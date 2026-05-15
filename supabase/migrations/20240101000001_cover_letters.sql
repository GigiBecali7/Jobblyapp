CREATE TABLE IF NOT EXISTS public.cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  design TEXT NOT NULL DEFAULT 'NordicMinimal',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cover letters"
  ON public.cover_letters
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS cover_letters_user_id_idx ON public.cover_letters(user_id);
CREATE INDEX IF NOT EXISTS cover_letters_created_at_idx ON public.cover_letters(created_at DESC);
