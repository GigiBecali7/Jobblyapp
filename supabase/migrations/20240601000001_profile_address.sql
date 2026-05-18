ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'Österreich';
