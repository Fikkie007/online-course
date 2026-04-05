-- Add password_hash column to profiles table for email/password authentication
ALTER TABLE profiles ADD COLUMN password_hash TEXT;

-- Add unique constraint on email for credentials login
CREATE UNIQUE INDEX idx_profiles_email_unique ON profiles(email);