-- =========================================
-- 1) Extend event_attendees with status
-- =========================================
ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'going'
  CHECK (status IN ('going','maybe','declined'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_attendees_event_user
  ON public.event_attendees(event_id, user_id);

-- Allow users to update their own RSVP status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='event_attendees'
      AND policyname='Users update own RSVP'
  ) THEN
    CREATE POLICY "Users update own RSVP"
      ON public.event_attendees FOR UPDATE TO authenticated
      USING ((auth.uid())::text = (user_id)::text)
      WITH CHECK ((auth.uid())::text = (user_id)::text);
  END IF;
END $$;

-- =========================================
-- 2) User blocks
-- =========================================
CREATE TABLE IF NOT EXISTS public.blocks (
  id BIGSERIAL PRIMARY KEY,
  blocker_id VARCHAR NOT NULL,
  blocked_id VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks select own"
  ON public.blocks FOR SELECT TO authenticated
  USING (blocker_id = auth.uid()::text);

CREATE POLICY "blocks insert own"
  ON public.blocks FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid()::text);

CREATE POLICY "blocks delete own"
  ON public.blocks FOR DELETE TO authenticated
  USING (blocker_id = auth.uid()::text);

-- =========================================
-- 3) Activity feed
-- =========================================
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_feed(user_id, created_at DESC);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity select all"
  ON public.activity_feed FOR SELECT TO authenticated, anon
  USING (true);

-- Triggers to auto-record activity
CREATE OR REPLACE FUNCTION public.log_activity_membership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE gname VARCHAR;
BEGIN
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
    SELECT name INTO gname FROM public.groups WHERE id = NEW.group_id;
    INSERT INTO public.activity_feed (user_id, type, title, link)
    VALUES (NEW.user_id, 'group_join', '"' || COALESCE(gname,'모임') || '"에 가입했어요', '/groups/' || NEW.group_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_membership ON public.memberships;
CREATE TRIGGER trg_log_membership
AFTER INSERT OR UPDATE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.log_activity_membership();

CREATE OR REPLACE FUNCTION public.log_activity_post()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_feed (user_id, type, title, link)
  VALUES (NEW.author_id, 'post', '게시글: ' || LEFT(NEW.title, 60), '/groups/' || NEW.group_id || '/board');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_post ON public.board_posts;
CREATE TRIGGER trg_log_post
AFTER INSERT ON public.board_posts
FOR EACH ROW EXECUTE FUNCTION public.log_activity_post();

CREATE OR REPLACE FUNCTION public.log_activity_class_enroll()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ctitle VARCHAR;
BEGIN
  SELECT title INTO ctitle FROM public.classes WHERE id = NEW.class_id;
  INSERT INTO public.activity_feed (user_id, type, title, link)
  VALUES (NEW.user_id, 'class_enroll', '"' || COALESCE(ctitle,'클래스') || '" 수강 신청', '/classes/' || NEW.class_id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_class_enroll ON public.class_enrollments;
CREATE TRIGGER trg_log_class_enroll
AFTER INSERT ON public.class_enrollments
FOR EACH ROW EXECUTE FUNCTION public.log_activity_class_enroll();

-- =========================================
-- 4) RSVP notifications
-- =========================================
CREATE OR REPLACE FUNCTION public.notify_event_rsvp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE creator VARCHAR; etitle VARCHAR; gid VARCHAR;
BEGIN
  SELECT created_by, title, group_id INTO creator, etitle, gid FROM public.events WHERE id = NEW.event_id;
  IF creator IS NOT NULL AND creator <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (creator, 'event_rsvp',
      CASE NEW.status WHEN 'going' THEN '참석 응답' WHEN 'maybe' THEN '미정 응답' ELSE '불참 응답' END,
      '"' || COALESCE(etitle,'') || '" 일정', '/groups/' || gid || '/events');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_rsvp ON public.event_attendees;
CREATE TRIGGER trg_notify_rsvp
AFTER INSERT OR UPDATE OF status ON public.event_attendees
FOR EACH ROW EXECUTE FUNCTION public.notify_event_rsvp();

-- =========================================
-- 5) Realtime
-- =========================================
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.activity_feed REPLICA IDENTITY FULL;
ALTER TABLE public.event_attendees REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendees; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;