
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS groups_select_all ON public.groups;
CREATE POLICY groups_select_all ON public.groups FOR SELECT USING (true);

DROP POLICY IF EXISTS groups_insert_authenticated ON public.groups;
CREATE POLICY groups_insert_authenticated ON public.groups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = owner_id);

DROP POLICY IF EXISTS groups_update_owner ON public.groups;
CREATE POLICY groups_update_owner ON public.groups
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = owner_id)
  WITH CHECK (auth.uid()::text = owner_id);

DROP POLICY IF EXISTS groups_delete_owner ON public.groups;
CREATE POLICY groups_delete_owner ON public.groups
  FOR DELETE TO authenticated
  USING (auth.uid()::text = owner_id);

DROP POLICY IF EXISTS memberships_select_all ON public.memberships;
CREATE POLICY memberships_select_all ON public.memberships FOR SELECT USING (true);

DROP POLICY IF EXISTS memberships_insert_self ON public.memberships;
CREATE POLICY memberships_insert_self ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS memberships_update_self ON public.memberships;
CREATE POLICY memberships_update_self ON public.memberships
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS memberships_delete_self ON public.memberships;
CREATE POLICY memberships_delete_self ON public.memberships
  FOR DELETE TO authenticated
  USING (auth.uid()::text = user_id);
