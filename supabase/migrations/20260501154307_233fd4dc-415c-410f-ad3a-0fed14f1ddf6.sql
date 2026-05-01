-- Enable realtime
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.class_messages REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.class_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- User presence (online status)
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id VARCHAR PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view presence" ON public.user_presence FOR SELECT USING (true);
CREATE POLICY "Users upsert own presence" ON public.user_presence FOR INSERT WITH CHECK ((auth.uid())::text = user_id);
CREATE POLICY "Users update own presence" ON public.user_presence FOR UPDATE USING ((auth.uid())::text = user_id) WITH CHECK ((auth.uid())::text = user_id);