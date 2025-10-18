-- Quick Fix: Add avatar_url column to existing users table
-- Run this in Supabase SQL Editor NOW to fix the avatar error

-- Add avatar_url column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '/avatars/avatar1.svg';

-- Update existing users to have default avatar
UPDATE public.users 
SET avatar_url = '/avatars/avatar1.svg' 
WHERE avatar_url IS NULL;

-- Success message
SELECT 'Avatar column added successfully!' as status;
