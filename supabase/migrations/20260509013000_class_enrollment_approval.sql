-- Require instructor/admin approval before a student can enter class spaces.

ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.class_enrollments
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'class_enrollments_status_check'
      AND conrelid = 'public.class_enrollments'::regclass
  ) THEN
    ALTER TABLE public.class_enrollments
    ADD CONSTRAINT class_enrollments_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Existing enrollments predate approval flow, so keep them active.
UPDATE public.class_enrollments
SET status = 'approved'
WHERE status IS DISTINCT FROM 'approved'
  AND enrolled_at < now();

CREATE OR REPLACE FUNCTION public.is_class_enrolled(_user_id uuid, _class_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_enrollments
    WHERE class_id = _class_id
      AND user_id = _user_id::text
      AND status = 'approved'
  );
$$;

DROP POLICY IF EXISTS "Anyone can view enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Users can view class enrollments" ON public.class_enrollments;
CREATE POLICY "Users can view class enrollments"
ON public.class_enrollments
FOR SELECT
USING (
  status = 'approved'
  OR auth.uid()::text = user_id
  OR public.is_class_instructor(auth.uid(), class_id)
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can enroll self" ON public.class_enrollments;
CREATE POLICY "Users can enroll self"
ON public.class_enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = user_id
  AND status = 'pending'
);

DROP POLICY IF EXISTS "Instructors can update class enrollments" ON public.class_enrollments;
CREATE POLICY "Instructors can update class enrollments"
ON public.class_enrollments
FOR UPDATE
TO authenticated
USING (
  public.is_class_instructor(auth.uid(), class_id)
  OR public.is_admin(auth.uid())
)
WITH CHECK (
  public.is_class_instructor(auth.uid(), class_id)
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can cancel own enrollment" ON public.class_enrollments;
CREATE POLICY "Users can cancel own enrollment"
ON public.class_enrollments
FOR DELETE
TO authenticated
USING (
  auth.uid()::text = user_id
  OR public.is_class_instructor(auth.uid(), class_id)
  OR public.is_admin(auth.uid())
);
