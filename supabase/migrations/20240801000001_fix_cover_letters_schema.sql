-- Fix cover_letters schema:
-- 1. Change FK from public.profiles → auth.users (profiles may not exist for all users)
-- 2. Make columns nullable to prevent NOT NULL violations on partial data
-- 3. Add missing columns

-- Add missing columns safely
ALTER TABLE public.cover_letters
  ADD COLUMN IF NOT EXISTS job_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Make NOT NULL constraints nullable (partial data should still save)
ALTER TABLE public.cover_letters
  ALTER COLUMN job_title DROP NOT NULL,
  ALTER COLUMN company    DROP NOT NULL,
  ALTER COLUMN content    DROP NOT NULL;

-- Re-point FK from profiles → auth.users for reliability
DO $$
BEGIN
  -- Drop whichever FK constraint exists on user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema    = 'public'
      AND tc.table_name      = 'cover_letters'
      AND kcu.column_name    = 'user_id'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.cover_letters DROP CONSTRAINT ' || tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema    = kcu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema    = 'public'
        AND tc.table_name      = 'cover_letters'
        AND kcu.column_name    = 'user_id'
      LIMIT 1
    );
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.cover_letters
    ADD CONSTRAINT cover_letters_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ensure RLS is on and policy covers all operations
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own cover letters" ON public.cover_letters;
CREATE POLICY "Users can manage own cover letters"
  ON public.cover_letters
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS cover_letters_user_id_idx ON public.cover_letters(user_id);
