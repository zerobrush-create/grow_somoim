-- pg_net for async HTTP calls from Postgres
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.dispatch_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  has_sub boolean;
  fn_url text := 'https://uyrtsixnjnzkjajoorkx.supabase.co/functions/v1/send-push';
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.push_subscriptions WHERE user_id::text = NEW.user_id::text)
    INTO has_sub;
  IF NOT has_sub THEN RETURN NEW; END IF;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', COALESCE(NEW.body, ''),
      'link', COALESCE(NEW.link, '/')
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_dispatch_push ON public.notifications;
CREATE TRIGGER trg_dispatch_push
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_on_notification();