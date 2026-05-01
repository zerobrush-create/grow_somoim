CREATE OR REPLACE FUNCTION public.notify_referral()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.points (user_id, amount, type, description)
  VALUES (NEW.referrer_id, 100, 'referral', '친구 초대 보상');
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.referrer_id, 'referral', '추천 보상 100P 지급', '친구가 가입했어요', '/points');
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_referral() FROM PUBLIC, anon, authenticated;