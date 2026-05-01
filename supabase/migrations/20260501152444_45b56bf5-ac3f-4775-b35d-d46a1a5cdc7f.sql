CREATE OR REPLACE FUNCTION public.sync_group_tags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.group_tags WHERE group_id = NEW.id;
  IF NEW.tags IS NOT NULL AND array_length(NEW.tags, 1) > 0 THEN
    INSERT INTO public.group_tags (group_id, tag)
    SELECT NEW.id, lower(trim(unnest(NEW.tags)))
    WHERE trim(unnest(NEW.tags)) <> ''
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_sync_group_tags ON public.groups;
CREATE TRIGGER trg_sync_group_tags AFTER INSERT OR UPDATE OF tags ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.sync_group_tags();

-- Allow the trigger to insert via SECURITY DEFINER bypassing RLS; ensure policy allows owners too
DROP POLICY IF EXISTS "Owners insert tags" ON public.group_tags;
CREATE POLICY "Owners insert tags" ON public.group_tags FOR INSERT WITH CHECK (is_group_owner(auth.uid(), group_id) OR is_admin(auth.uid()));