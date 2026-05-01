CREATE TABLE public.bookmarks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  target_type VARCHAR NOT NULL CHECK (target_type IN ('group','class','event')),
  target_id VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bookmarks" ON public.bookmarks FOR SELECT TO authenticated
  USING ((auth.uid())::text = (user_id)::text);
CREATE POLICY "Users insert own bookmarks" ON public.bookmarks FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = (user_id)::text);
CREATE POLICY "Users delete own bookmarks" ON public.bookmarks FOR DELETE TO authenticated
  USING ((auth.uid())::text = (user_id)::text);

CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);