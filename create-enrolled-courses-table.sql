-- Create enrolled_courses table for Virtual University LMS
-- Run this in your Supabase SQL Editor

-- Create the enrolled_courses table
CREATE TABLE IF NOT EXISTS enrolled_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    semester TEXT NOT NULL,
    programme TEXT NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_code, semester)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enrolled_courses_user_id ON enrolled_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_enrolled_courses_course_code ON enrolled_courses(course_code);

-- Disable RLS for now (you can enable it later for security)
ALTER TABLE enrolled_courses DISABLE ROW LEVEL SECURITY;

-- Test the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'enrolled_courses'
ORDER BY ordinal_position; 