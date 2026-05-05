-- Make referral links work for email-confirmation signups.

UPDATE public.users
SET referral_code = upper(left(replace(id, '-', ''), 8))
WHERE referral_code IS NULL OR referral_code = '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  referral_input text;
  referrer_user_id text;
  generated_referral_code text;
BEGIN
  generated_referral_code := upper(left(replace(NEW.id::text, '-', ''), 8));

  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = COALESCE(public.profiles.name, EXCLUDED.name),
        updated_at = now();

  INSERT INTO public.users (id, email, nickname, referral_code)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    generated_referral_code
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        nickname = COALESCE(public.users.nickname, EXCLUDED.nickname),
        referral_code = COALESCE(public.users.referral_code, EXCLUDED.referral_code),
        updated_at = now();

  referral_input := upper(nullif(regexp_replace(COALESCE(NEW.raw_user_meta_data ->> 'referral_code', ''), '[^a-zA-Z0-9]', '', 'g'), ''));

  IF referral_input IS NOT NULL THEN
    SELECT id INTO referrer_user_id
    FROM public.users
    WHERE upper(referral_code) = referral_input
       OR upper(left(replace(id, '-', ''), 8)) = referral_input
    LIMIT 1;

    IF referrer_user_id IS NOT NULL AND referrer_user_id <> NEW.id::text THEN
      INSERT INTO public.referrals (referrer_id, referred_user_id)
      SELECT referrer_user_id, NEW.id::text
      WHERE NOT EXISTS (
        SELECT 1 FROM public.referrals WHERE referred_user_id = NEW.id::text
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
