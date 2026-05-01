-- Notify post author when someone comments on their board post
CREATE OR REPLACE FUNCTION public.notify_board_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_author varchar;
  post_title varchar;
  post_group varchar;
BEGIN
  SELECT author_id, title, group_id INTO post_author, post_title, post_group
  FROM public.board_posts WHERE id = NEW.post_id;

  IF post_author IS NOT NULL AND post_author <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (post_author, 'comment',
      '새 댓글: ' || post_title,
      LEFT(NEW.content, 80),
      '/groups/' || post_group || '/board');
  END IF;

  -- Mentions: parse @nickname
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT p.id::text, 'mention', '회원님이 언급되었어요', LEFT(NEW.content, 80),
         '/groups/' || post_group || '/board'
  FROM public.profiles p
  WHERE p.nickname IS NOT NULL
    AND p.nickname <> ''
    AND NEW.content ~ ('@' || p.nickname || '(\s|$|[^[:alnum:]_])')
    AND p.id::text <> NEW.author_id;

  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_notify_board_comment ON public.board_comments;
CREATE TRIGGER trg_notify_board_comment
AFTER INSERT ON public.board_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_board_comment();

-- Mentions inside board posts themselves
CREATE OR REPLACE FUNCTION public.notify_board_post_mention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT p.id::text, 'mention', '회원님이 게시글에서 언급되었어요',
         LEFT(NEW.content, 80),
         '/groups/' || NEW.group_id || '/board'
  FROM public.profiles p
  WHERE p.nickname IS NOT NULL
    AND p.nickname <> ''
    AND NEW.content ~ ('@' || p.nickname || '(\s|$|[^[:alnum:]_])')
    AND p.id::text <> NEW.author_id;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_notify_board_post_mention ON public.board_posts;
CREATE TRIGGER trg_notify_board_post_mention
AFTER INSERT ON public.board_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_board_post_mention();