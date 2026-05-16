-- Add AI rate-limiting columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_requests_today INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_requests_reset_at TIMESTAMPTZ;
