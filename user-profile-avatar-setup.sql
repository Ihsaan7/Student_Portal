-- User Profile Enhancement: Add Avatar Support
-- Run this SQL in your Supabase SQL Editor to add avatar functionality

-- 1. Add avatar_url column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '/avatars/avatar1.svg';

-- 2. Update existing users to have default avatar
UPDATE public.users 
SET avatar_url = '/avatars/avatar1.svg' 
WHERE avatar_url IS NULL;

-- 3. Create an index for faster avatar queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_avatar ON public.users(avatar_url);

-- 4. Verify the update
SELECT id, name, email, avatar_url 
FROM public.users 
LIMIT 5;

-- Success message
SELECT 'Avatar column added successfully! Users can now select profile avatars.' as status;
