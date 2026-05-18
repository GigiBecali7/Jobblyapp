-- Create avatars bucket (public) if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp'];

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload own folder" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update own folder" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete own folder" ON storage.objects;

-- Public read access (no auth required)
CREATE POLICY "Avatar public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder
CREATE POLICY "Avatar upload own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users can update files in their own folder
CREATE POLICY "Avatar update own folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users can delete files in their own folder
CREATE POLICY "Avatar delete own folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
