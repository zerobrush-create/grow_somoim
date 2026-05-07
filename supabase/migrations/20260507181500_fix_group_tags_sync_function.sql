-- Fix group tag sync for PostgreSQL versions that reject set-returning
-- functions inside WHERE clauses.
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
    SELECT NEW.id, lower(trim(raw_tag.tag))
    FROM unnest(NEW.tags) AS raw_tag(tag)
    WHERE trim(raw_tag.tag) <> ''
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END
$function$;
