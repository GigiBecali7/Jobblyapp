CREATE TABLE IF NOT EXISTS public.emails_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT,
  to_email TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.emails_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own email logs" ON public.emails_log FOR ALL USING (auth.uid() = user_id);
