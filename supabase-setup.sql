-- Supabase Users Table Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    programme TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add any missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS programme TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Disable RLS temporarily for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 4. Create a simple policy if you want to enable RLS later
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can insert their own data" ON users
-- FOR INSERT WITH CHECK (auth.uid() = id);
-- CREATE POLICY "Users can read their own data" ON users
-- FOR SELECT USING (auth.uid() = id);

-- 5. Test the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position; 