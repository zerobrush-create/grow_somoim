
-- Helper functions
CREATE OR REPLACE FUNCTION public.is_class_instructor(_user_id uuid, _class_id integer)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND instructor_id = _user_id::text);
$$;

CREATE OR REPLACE FUNCTION public.is_class_enrolled(_user_id uuid, _class_id integer)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.class_enrollments WHERE class_id = _class_id AND user_id = _user_id::text);
$$;

-- ===== board_posts =====
ALTER TABLE public.board_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view board posts" ON public.board_posts FOR SELECT USING (true);
CREATE POLICY "Members can create board posts" ON public.board_posts FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = author_id AND (is_group_member(auth.uid(), group_id) OR is_group_owner(auth.uid(), group_id)));
CREATE POLICY "Authors can update own posts" ON public.board_posts FOR UPDATE TO authenticated
  USING ((auth.uid())::text = author_id) WITH CHECK ((auth.uid())::text = author_id);
CREATE POLICY "Authors or owners can delete posts" ON public.board_posts FOR DELETE TO authenticated
  USING ((auth.uid())::text = author_id OR is_group_owner(auth.uid(), group_id));

-- ===== board_comments =====
ALTER TABLE public.board_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view board comments" ON public.board_comments FOR SELECT USING (true);
CREATE POLICY "Members can create comments" ON public.board_comments FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = author_id AND EXISTS (
    SELECT 1 FROM public.board_posts bp WHERE bp.id = post_id
      AND (is_group_member(auth.uid(), bp.group_id) OR is_group_owner(auth.uid(), bp.group_id))
  ));
CREATE POLICY "Authors can update own comments" ON public.board_comments FOR UPDATE TO authenticated
  USING ((auth.uid())::text = author_id) WITH CHECK ((auth.uid())::text = author_id);
CREATE POLICY "Authors or owners can delete comments" ON public.board_comments FOR DELETE TO authenticated
  USING ((auth.uid())::text = author_id OR EXISTS (
    SELECT 1 FROM public.board_posts bp WHERE bp.id = post_id AND is_group_owner(auth.uid(), bp.group_id)
  ));

-- ===== board_post_likes =====
ALTER TABLE public.board_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes" ON public.board_post_likes FOR SELECT USING (true);
CREATE POLICY "Members can like" ON public.board_post_likes FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = user_id AND EXISTS (
    SELECT 1 FROM public.board_posts bp WHERE bp.id = post_id
      AND (is_group_member(auth.uid(), bp.group_id) OR is_group_owner(auth.uid(), bp.group_id))
  ));
CREATE POLICY "Users can unlike own" ON public.board_post_likes FOR DELETE TO authenticated
  USING ((auth.uid())::text = user_id);

-- ===== group_photos =====
ALTER TABLE public.group_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view photos" ON public.group_photos FOR SELECT USING (true);
CREATE POLICY "Members can upload photos" ON public.group_photos FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = uploader_id AND (is_group_member(auth.uid(), group_id) OR is_group_owner(auth.uid(), group_id)));
CREATE POLICY "Uploader or owner can delete photos" ON public.group_photos FOR DELETE TO authenticated
  USING ((auth.uid())::text = uploader_id OR is_group_owner(auth.uid(), group_id));

-- ===== announcements =====
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Owners can create announcements" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = author_id AND is_group_owner(auth.uid(), group_id));
CREATE POLICY "Owners can update announcements" ON public.announcements FOR UPDATE TO authenticated
  USING (is_group_owner(auth.uid(), group_id)) WITH CHECK (is_group_owner(auth.uid(), group_id));
CREATE POLICY "Owners can delete announcements" ON public.announcements FOR DELETE TO authenticated
  USING (is_group_owner(auth.uid(), group_id));

-- ===== direct_messages =====
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view DMs" ON public.direct_messages FOR SELECT TO authenticated
  USING ((auth.uid())::text = sender_id OR (auth.uid())::text = receiver_id);
CREATE POLICY "Users can send DMs" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = sender_id);
CREATE POLICY "Receiver can mark read" ON public.direct_messages FOR UPDATE TO authenticated
  USING ((auth.uid())::text = receiver_id) WITH CHECK ((auth.uid())::text = receiver_id);
CREATE POLICY "Sender can delete own DMs" ON public.direct_messages FOR DELETE TO authenticated
  USING ((auth.uid())::text = sender_id);

-- ===== classes =====
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Users can create own classes" ON public.classes FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = instructor_id);
CREATE POLICY "Instructors can update own classes" ON public.classes FOR UPDATE TO authenticated
  USING ((auth.uid())::text = instructor_id) WITH CHECK ((auth.uid())::text = instructor_id);
CREATE POLICY "Instructors can delete own classes" ON public.classes FOR DELETE TO authenticated
  USING ((auth.uid())::text = instructor_id);

-- ===== class_enrollments =====
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view enrollments" ON public.class_enrollments FOR SELECT USING (true);
CREATE POLICY "Users can enroll self" ON public.class_enrollments FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = user_id);
CREATE POLICY "Users can cancel own enrollment" ON public.class_enrollments FOR DELETE TO authenticated
  USING ((auth.uid())::text = user_id OR is_class_instructor(auth.uid(), class_id));

-- ===== class_reviews =====
ALTER TABLE public.class_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.class_reviews FOR SELECT USING (true);
CREATE POLICY "Users can write own reviews" ON public.class_reviews FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = author_id);
CREATE POLICY "Authors can update own reviews" ON public.class_reviews FOR UPDATE TO authenticated
  USING ((auth.uid())::text = author_id) WITH CHECK ((auth.uid())::text = author_id);
CREATE POLICY "Authors can delete own reviews" ON public.class_reviews FOR DELETE TO authenticated
  USING ((auth.uid())::text = author_id);

-- ===== class_messages =====
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view class messages" ON public.class_messages FOR SELECT TO authenticated
  USING (is_class_enrolled(auth.uid(), class_id) OR is_class_instructor(auth.uid(), class_id));
CREATE POLICY "Members can send class messages" ON public.class_messages FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = sender_id AND (is_class_enrolled(auth.uid(), class_id) OR is_class_instructor(auth.uid(), class_id)));
CREATE POLICY "Senders can delete own class messages" ON public.class_messages FOR DELETE TO authenticated
  USING ((auth.uid())::text = sender_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_messages;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.class_messages REPLICA IDENTITY FULL;
