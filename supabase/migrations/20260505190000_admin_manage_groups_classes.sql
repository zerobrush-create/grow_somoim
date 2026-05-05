-- Allow app admins to manage groups and classes from the admin console.

DROP POLICY IF EXISTS "Admins update groups" ON public.groups;
CREATE POLICY "Admins update groups"
ON public.groups
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins delete groups" ON public.groups;
CREATE POLICY "Admins delete groups"
ON public.groups
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update classes" ON public.classes;
CREATE POLICY "Admins update classes"
ON public.classes
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins delete classes" ON public.classes;
CREATE POLICY "Admins delete classes"
ON public.classes
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));
