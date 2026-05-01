CREATE TABLE public.group_reviews (
  id SERIAL PRIMARY KEY,
  group_id VARCHAR NOT NULL,
  author_id VARCHAR NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view group reviews" ON public.group_reviews FOR SELECT USING (true);
CREATE POLICY "Members write group reviews" ON public.group_reviews FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = (author_id)::text AND (public.is_group_member(auth.uid(), group_id) OR public.is_group_owner(auth.uid(), group_id)));
CREATE POLICY "Authors update group reviews" ON public.group_reviews FOR UPDATE TO authenticated
  USING ((auth.uid())::text = (author_id)::text) WITH CHECK ((auth.uid())::text = (author_id)::text);
CREATE POLICY "Authors or admins delete group reviews" ON public.group_reviews FOR DELETE TO authenticated
  USING ((auth.uid())::text = (author_id)::text OR public.is_admin(auth.uid()));

CREATE INDEX idx_group_reviews_group ON public.group_reviews(group_id);