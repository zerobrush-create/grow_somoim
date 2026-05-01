-- Post images
CREATE TABLE IF NOT EXISTS public.post_images (
  id BIGSERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  post_type VARCHAR NOT NULL DEFAULT 'board',
  image_url VARCHAR NOT NULL,
  uploader_id VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view post images" ON public.post_images FOR SELECT USING (true);
CREATE POLICY "Uploader insert post images" ON public.post_images FOR INSERT WITH CHECK ((auth.uid())::text = uploader_id::text);
CREATE POLICY "Uploader delete post images" ON public.post_images FOR DELETE USING ((auth.uid())::text = uploader_id::text);
CREATE INDEX IF NOT EXISTS idx_post_images_post ON public.post_images(post_type, post_id);

-- Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  attended_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, attended_on)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own attendance" ON public.attendance FOR SELECT USING ((auth.uid())::text = user_id::text);
CREATE POLICY "Users insert own attendance" ON public.attendance FOR INSERT WITH CHECK ((auth.uid())::text = user_id::text);

-- Badges
CREATE TABLE IF NOT EXISTS public.badges (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  code VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Users insert own badges" ON public.badges FOR INSERT WITH CHECK ((auth.uid())::text = user_id::text OR is_admin(auth.uid()));

-- Group tags table for tag search
CREATE TABLE IF NOT EXISTS public.group_tags (
  id BIGSERIAL PRIMARY KEY,
  group_id VARCHAR NOT NULL,
  tag VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, tag)
);
ALTER TABLE public.group_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view group tags" ON public.group_tags FOR SELECT USING (true);
CREATE POLICY "Owners insert tags" ON public.group_tags FOR INSERT WITH CHECK (is_group_owner(auth.uid(), group_id));
CREATE POLICY "Owners delete tags" ON public.group_tags FOR DELETE USING (is_group_owner(auth.uid(), group_id));
CREATE INDEX IF NOT EXISTS idx_group_tags_tag ON public.group_tags(tag);

-- Storage bucket for post images
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Post images public read" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "Auth upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete post images" ON storage.objects FOR DELETE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Attendance reward + streak badge trigger
CREATE OR REPLACE FUNCTION public.on_attendance_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE streak INT;
BEGIN
  -- Award 10P
  INSERT INTO public.points (user_id, amount, type, description)
  VALUES (NEW.user_id, 10, 'attendance', '출석 보상');

  -- Calculate streak (consecutive days ending today)
  SELECT COUNT(*) INTO streak FROM (
    SELECT attended_on, attended_on - (ROW_NUMBER() OVER (ORDER BY attended_on))::int AS grp
    FROM public.attendance WHERE user_id = NEW.user_id ORDER BY attended_on DESC LIMIT 30
  ) t WHERE t.grp = (SELECT MAX(grp) FROM (
    SELECT attended_on - (ROW_NUMBER() OVER (ORDER BY attended_on))::int AS grp
    FROM public.attendance WHERE user_id = NEW.user_id ORDER BY attended_on DESC LIMIT 30
  ) x);

  IF streak >= 7 THEN
    INSERT INTO public.badges (user_id, code, title, description)
    VALUES (NEW.user_id, 'streak_7', '7일 연속 출석', '일주일 연속 출석을 달성했어요')
    ON CONFLICT DO NOTHING;
  END IF;
  IF streak >= 30 THEN
    INSERT INTO public.badges (user_id, code, title, description)
    VALUES (NEW.user_id, 'streak_30', '30일 연속 출석', '한 달 연속 출석을 달성했어요')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_attendance_reward ON public.attendance;
CREATE TRIGGER trg_attendance_reward AFTER INSERT ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.on_attendance_insert();

-- First post badge
CREATE OR REPLACE FUNCTION public.award_first_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.badges (user_id, code, title, description)
  VALUES (NEW.author_id, 'first_post', '첫 게시글', '첫 게시글을 작성했어요')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_first_post ON public.board_posts;
CREATE TRIGGER trg_first_post AFTER INSERT ON public.board_posts
FOR EACH ROW EXECUTE FUNCTION public.award_first_post();

-- First group join badge
CREATE OR REPLACE FUNCTION public.award_first_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' THEN
    INSERT INTO public.badges (user_id, code, title, description)
    VALUES (NEW.user_id, 'first_group', '첫 모임 가입', '첫 모임에 가입했어요')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_first_group ON public.memberships;
CREATE TRIGGER trg_first_group AFTER INSERT ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.award_first_group();