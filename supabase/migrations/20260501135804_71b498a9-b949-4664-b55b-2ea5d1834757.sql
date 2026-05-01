-- Restrict execution of SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_group_owner(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_class_instructor(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_class_enrolled(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_owner(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_instructor(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_enrolled(uuid, integer) TO authenticated;

-- Fix set_updated_at search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
begin new.updated_at = now(); return new; end;
$$;

-- Tighten avatars listing: only own folder can list/select via API; public URLs still work.
DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;
CREATE POLICY "Users read own avatar folder" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Tighten group-images listing similarly (keep public URL access; restrict listing to members/owners by group folder)
DROP POLICY IF EXISTS "Group images publicly readable" ON storage.objects;
CREATE POLICY "Group images member listing" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'group-images' AND (
    public.is_group_member(auth.uid(), (storage.foldername(name))[1])
    OR public.is_group_owner(auth.uid(), (storage.foldername(name))[1])
  ));

-- Tighten notifications insert: only allow inserting notifications for self (client-side scenarios) OR via service role bypass
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id OR public.is_admin(auth.uid()));