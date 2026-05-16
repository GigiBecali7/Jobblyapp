-- ============================================================
-- Jobbly — Onboarding + Extended Profile Columns
-- Run in Supabase SQL editor BEFORE deploying this release
-- ============================================================

-- Add all profile extension columns (safe: IF NOT EXISTS)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS photo_url         TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url        TEXT,
  ADD COLUMN IF NOT EXISTS phone             TEXT,
  ADD COLUMN IF NOT EXISTS city              TEXT,
  ADD COLUMN IF NOT EXISTS linkedin          TEXT,
  ADD COLUMN IF NOT EXISTS birthday          TEXT,
  ADD COLUMN IF NOT EXISTS industry          TEXT,
  ADD COLUMN IF NOT EXISTS position          TEXT,
  ADD COLUMN IF NOT EXISTS experience        TEXT,
  ADD COLUMN IF NOT EXISTS experience_level  TEXT,
  ADD COLUMN IF NOT EXISTS current_position  TEXT,
  ADD COLUMN IF NOT EXISTS desired_position  TEXT,
  ADD COLUMN IF NOT EXISTS work_model        TEXT    DEFAULT 'hybrid',
  ADD COLUMN IF NOT EXISTS salary_target     INTEGER DEFAULT 55000,
  ADD COLUMN IF NOT EXISTS desired_salary    INTEGER,
  ADD COLUMN IF NOT EXISTS radius            TEXT    DEFAULT 'Österreichweit',
  ADD COLUMN IF NOT EXISTS skills            TEXT[],
  ADD COLUMN IF NOT EXISTS languages         JSONB   DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS job_alerts        BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_frequency   TEXT    DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Grandfather existing users: anyone with a name already set doesn't need onboarding
UPDATE public.profiles
SET onboarding_completed = TRUE
WHERE (first_name IS NOT NULL AND first_name <> '')
  AND (onboarding_completed IS NULL OR onboarding_completed = FALSE);

-- ============================================================
-- Supabase Storage — avatars bucket
-- Run only if the bucket doesn't exist yet
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', TRUE, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload to their own subfolder, anyone can read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname = 'Users can upload own avatars'
  ) THEN
    CREATE POLICY "Users can upload own avatars"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname = 'Anyone can view avatars'
  ) THEN
    CREATE POLICY "Anyone can view avatars"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname = 'Users can update own avatars'
  ) THEN
    CREATE POLICY "Users can update own avatars"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname = 'Users can delete own avatars'
  ) THEN
    CREATE POLICY "Users can delete own avatars"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;
