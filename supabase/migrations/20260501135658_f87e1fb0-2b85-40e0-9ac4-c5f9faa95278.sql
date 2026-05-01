-- ========== ROLES ==========
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'member');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ========== NOTIFICATIONS ==========
CREATE TABLE IF NOT EXISTS public.notifications (
  id bigserial PRIMARY KEY,
  user_id varchar NOT NULL,
  type varchar NOT NULL,
  title varchar NOT NULL,
  body text,
  link varchar,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid()::text = user_id);

-- ========== AD REQUESTS ==========
ALTER TABLE public.ad_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own ad requests" ON public.ad_requests;
CREATE POLICY "Users view own ad requests" ON public.ad_requests FOR SELECT TO authenticated
  USING (auth.uid()::text = requester_id::text OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users create ad requests" ON public.ad_requests;
CREATE POLICY "Users create ad requests" ON public.ad_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = requester_id::text);
DROP POLICY IF EXISTS "Admins update ad requests" ON public.ad_requests;
CREATE POLICY "Admins update ad requests" ON public.ad_requests FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins delete ad requests" ON public.ad_requests;
CREATE POLICY "Admins delete ad requests" ON public.ad_requests FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== INSTRUCTOR APPLICATIONS ==========
ALTER TABLE public.instructor_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own applications" ON public.instructor_applications;
CREATE POLICY "Users view own applications" ON public.instructor_applications FOR SELECT TO authenticated
  USING (auth.uid()::text = applicant_id::text OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users apply" ON public.instructor_applications;
CREATE POLICY "Users apply" ON public.instructor_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = applicant_id::text);
DROP POLICY IF EXISTS "Admins update applications" ON public.instructor_applications;
CREATE POLICY "Admins update applications" ON public.instructor_applications FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins delete applications" ON public.instructor_applications;
CREATE POLICY "Admins delete applications" ON public.instructor_applications FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== ADMINS table ==========
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage admins" ON public.admins;
CREATE POLICY "Admins manage admins" ON public.admins FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ========== POINTS ==========
ALTER TABLE public.points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own points" ON public.points;
CREATE POLICY "Users view own points" ON public.points FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id::text OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users create own points" ON public.points;
CREATE POLICY "Users create own points" ON public.points FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins manage points" ON public.points;
CREATE POLICY "Admins manage points" ON public.points FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== REFERRALS ==========
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own referrals" ON public.referrals;
CREATE POLICY "Users view own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid()::text = referrer_id::text OR auth.uid()::text = referred_user_id::text OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users create referrals" ON public.referrals;
CREATE POLICY "Users create referrals" ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = referred_user_id::text);

-- ========== BANNERS ==========
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view banners" ON public.banners;
CREATE POLICY "Anyone view banners" ON public.banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ========== SITE CONTENT ==========
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view site content" ON public.site_content;
CREATE POLICY "Anyone view site content" ON public.site_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage site content" ON public.site_content;
CREATE POLICY "Admins manage site content" ON public.site_content FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ========== LEADER POSTS / COMMENTS ==========
ALTER TABLE public.leader_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view leader posts" ON public.leader_posts;
CREATE POLICY "Anyone view leader posts" ON public.leader_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authors create leader posts" ON public.leader_posts;
CREATE POLICY "Authors create leader posts" ON public.leader_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = author_id::text);
DROP POLICY IF EXISTS "Authors update leader posts" ON public.leader_posts;
CREATE POLICY "Authors update leader posts" ON public.leader_posts FOR UPDATE TO authenticated
  USING (auth.uid()::text = author_id::text) WITH CHECK (auth.uid()::text = author_id::text);
DROP POLICY IF EXISTS "Authors or admins delete leader posts" ON public.leader_posts;
CREATE POLICY "Authors or admins delete leader posts" ON public.leader_posts FOR DELETE TO authenticated
  USING (auth.uid()::text = author_id::text OR public.is_admin(auth.uid()));

ALTER TABLE public.leader_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view leader comments" ON public.leader_comments;
CREATE POLICY "Anyone view leader comments" ON public.leader_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authors create leader comments" ON public.leader_comments;
CREATE POLICY "Authors create leader comments" ON public.leader_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = author_id::text);
DROP POLICY IF EXISTS "Authors or admins delete leader comments" ON public.leader_comments;
CREATE POLICY "Authors or admins delete leader comments" ON public.leader_comments FOR DELETE TO authenticated
  USING (auth.uid()::text = author_id::text OR public.is_admin(auth.uid()));

-- ========== STORES / TRANSACTIONS ==========
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view active stores" ON public.stores;
CREATE POLICY "Anyone view active stores" ON public.stores FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners manage own store" ON public.stores;
CREATE POLICY "Owners manage own store" ON public.stores FOR ALL TO authenticated
  USING (auth.uid()::text = owner_id::text OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid()::text = owner_id::text OR public.is_admin(auth.uid()));

ALTER TABLE public.store_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own transactions" ON public.store_transactions;
CREATE POLICY "Users view own transactions" ON public.store_transactions FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id::text OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users create transactions" ON public.store_transactions;
CREATE POLICY "Users create transactions" ON public.store_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

-- ========== CLASS BOARD ==========
ALTER TABLE public.class_board_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view class board" ON public.class_board_posts;
CREATE POLICY "Anyone view class board" ON public.class_board_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Members create class posts" ON public.class_board_posts;
CREATE POLICY "Members create class posts" ON public.class_board_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = author_id::text AND (public.is_class_enrolled(auth.uid(), class_id) OR public.is_class_instructor(auth.uid(), class_id)));
DROP POLICY IF EXISTS "Authors update class posts" ON public.class_board_posts;
CREATE POLICY "Authors update class posts" ON public.class_board_posts FOR UPDATE TO authenticated
  USING (auth.uid()::text = author_id::text) WITH CHECK (auth.uid()::text = author_id::text);
DROP POLICY IF EXISTS "Authors or instructor delete class posts" ON public.class_board_posts;
CREATE POLICY "Authors or instructor delete class posts" ON public.class_board_posts FOR DELETE TO authenticated
  USING (auth.uid()::text = author_id::text OR public.is_class_instructor(auth.uid(), class_id));

ALTER TABLE public.class_board_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view class comments" ON public.class_board_comments;
CREATE POLICY "Anyone view class comments" ON public.class_board_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Members create class comments" ON public.class_board_comments;
CREATE POLICY "Members create class comments" ON public.class_board_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = author_id::text);
DROP POLICY IF EXISTS "Authors delete class comments" ON public.class_board_comments;
CREATE POLICY "Authors delete class comments" ON public.class_board_comments FOR DELETE TO authenticated
  USING (auth.uid()::text = author_id::text);

ALTER TABLE public.class_board_post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view class likes" ON public.class_board_post_likes;
CREATE POLICY "Anyone view class likes" ON public.class_board_post_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users like class posts" ON public.class_board_post_likes;
CREATE POLICY "Users like class posts" ON public.class_board_post_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);
DROP POLICY IF EXISTS "Users unlike class posts" ON public.class_board_post_likes;
CREATE POLICY "Users unlike class posts" ON public.class_board_post_likes FOR DELETE TO authenticated
  USING (auth.uid()::text = user_id::text);

-- ========== AVATARS bucket for profile boost ==========
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;
CREATE POLICY "Avatars publicly readable" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;