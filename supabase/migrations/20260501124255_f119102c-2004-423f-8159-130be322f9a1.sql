-- 모임 커버 이미지용 storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-images', 'group-images', true)
ON CONFLICT (id) DO NOTHING;

-- 누구나 이미지 조회 가능 (public bucket)
CREATE POLICY "Group images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'group-images');

-- 인증된 사용자는 자기 폴더에 업로드 가능 (경로: {user_id}/...)
CREATE POLICY "Users can upload their own group images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'group-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own group images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'group-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own group images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'group-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 모임 태그 컬럼 추가 (관심사 키워드)
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];