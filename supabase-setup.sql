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

-- 3. Create enrolled_courses table
CREATE TABLE IF NOT EXISTS enrolled_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    semester TEXT NOT NULL,
    programme TEXT NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_code, semester)
);

-- 4. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_enrolled_courses_user_id ON enrolled_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_enrolled_courses_course_code ON enrolled_courses(course_code);

-- 5. Disable RLS temporarily for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrolled_courses DISABLE ROW LEVEL SECURITY;

-- 6. Create a simple policy if you want to enable RLS later
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can insert their own data" ON users
-- FOR INSERT WITH CHECK (auth.uid() = id);
-- CREATE POLICY "Users can read their own data" ON users
-- FOR SELECT USING (auth.uid() = id);

-- ALTER TABLE enrolled_courses ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can manage their own enrollments" ON enrolled_courses
-- FOR ALL USING (auth.uid() = user_id);

-- 7. Test the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'enrolled_courses'
ORDER BY ordinal_position; 