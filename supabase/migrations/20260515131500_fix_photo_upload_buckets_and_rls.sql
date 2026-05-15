-- Fix chat attachments and group photo uploads.
-- The app uploads group images under: {user_id}/{group_id}/{timestamp}.ext
-- The app uploads chat files under: group/{group_id}/{user_id}/{timestamp}.ext
-- Direct messages use: dm/{user_id}/{timestamp}.ext

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('chat-files', 'chat-files', true),
  ('group-images', 'group-images', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public can view chat files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read chat files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat files" ON storage.objects;

CREATE POLICY "Public can read chat files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-files');

CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-files'
  AND (
    ((storage.foldername(name))[1] = 'group' AND (storage.foldername(name))[3] = auth.uid()::text)
    OR ((storage.foldername(name))[1] = 'dm' AND (storage.foldername(name))[2] = auth.uid()::text)
  )
);

CREATE POLICY "Users can delete their own chat files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-files'
  AND (
    ((storage.foldername(name))[1] = 'group' AND (storage.foldername(name))[3] = auth.uid()::text)
    OR ((storage.foldername(name))[1] = 'dm' AND (storage.foldername(name))[2] = auth.uid()::text)
  )
);

DROP POLICY IF EXISTS "Public can view group images" ON storage.objects;
DROP POLICY IF EXISTS "Group images member listing" ON storage.objects;
DROP POLICY IF EXISTS "Public can read group images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own group images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload group images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own group images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update group images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own group images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete group images" ON storage.objects;

CREATE POLICY "Public can read group images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'group-images');

CREATE POLICY "Users can upload group images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'group-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update group images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'group-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'group-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete group images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'group-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

ALTER TABLE public.group_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view photos" ON public.group_photos;
CREATE POLICY "Anyone can view photos"
ON public.group_photos
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Members can upload photos" ON public.group_photos;
CREATE POLICY "Members can upload photos"
ON public.group_photos
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = uploader_id::text
  AND (
    EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = group_photos.group_id
        AND g.owner_id::text = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM public.memberships m
      WHERE m.group_id = group_photos.group_id
        AND m.user_id::text = auth.uid()::text
        AND m.status = 'approved'
    )
    OR public.is_admin(auth.uid())
  )
);

DROP POLICY IF EXISTS "Uploader or owner can delete photos" ON public.group_photos;
CREATE POLICY "Uploader or owner can delete photos"
ON public.group_photos
FOR DELETE
TO authenticated
USING (
  auth.uid()::text = uploader_id::text
  OR EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = group_photos.group_id
      AND g.owner_id::text = auth.uid()::text
  )
  OR public.is_admin(auth.uid())
);
