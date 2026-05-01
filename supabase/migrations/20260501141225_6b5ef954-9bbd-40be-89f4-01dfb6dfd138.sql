REVOKE EXECUTE ON FUNCTION public.notify_dm() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_membership() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_announcement() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_class_enrollment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_referral() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;