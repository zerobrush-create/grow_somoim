-- Ensure signed-in users can create groups and become the owner member.

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS groups_insert_authenticated ON public.groups;
CREATE POLICY groups_insert_authenticated
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = owner_id::text);

DROP POLICY IF EXISTS memberships_insert_self ON public.memberships;
CREATE POLICY memberships_insert_self
ON public.memberships
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

INSERT INTO storage.buckets (id, name, public)
VALUES ('group-images', 'group-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own group images" ON storage.objects;
CREATE POLICY "Users can upload their own group images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'group-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
