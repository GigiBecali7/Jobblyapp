CREATE TABLE IF NOT EXISTS public.feedback (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  category    text,
  message     text NOT NULL,
  email       text,
  page_url    text,
  user_agent  text,
  created_at  timestamptz   DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert feedback"         ON public.feedback;
DROP POLICY IF EXISTS "Only service role can read feedback" ON public.feedback;

CREATE POLICY "Anyone can insert feedback"
  ON public.feedback FOR INSERT WITH CHECK (true);

CREATE POLICY "Only service role can read feedback"
  ON public.feedback FOR SELECT USING (false);

CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback(created_at DESC);
