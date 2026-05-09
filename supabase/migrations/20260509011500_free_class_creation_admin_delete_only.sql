-- Classes can be opened freely by any signed-in user.
-- Deleting classes is reserved for app admins only.

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create own classes" ON public.classes;
CREATE POLICY "Users can create own classes"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid())::text = instructor_id);

DROP POLICY IF EXISTS "Instructors can delete own classes" ON public.classes;

DROP POLICY IF EXISTS "Admins delete classes" ON public.classes;
CREATE POLICY "Admins delete classes"
ON public.classes
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

ALTER TABLE public.classes
ALTER COLUMN status SET DEFAULT 'approved';
