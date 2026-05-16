-- Create cvs table
CREATE TABLE IF NOT EXISTS public.cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Mein Lebenslauf',
  design TEXT NOT NULL DEFAULT 'NordicMinimal',
  content JSONB NOT NULL DEFAULT '{}',
  edit_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cvs" ON public.cvs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add missing columns to cover_letters
ALTER TABLE public.cover_letters
  ADD COLUMN IF NOT EXISTS edit_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add missing columns to applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS job_url TEXT,
  ADD COLUMN IF NOT EXISTS application_method TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS cv_id UUID REFERENCES public.cvs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_letter_id UUID REFERENCES public.cover_letters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email_sent_to TEXT,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT NOW();
