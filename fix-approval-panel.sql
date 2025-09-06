-- Check what tables exist and fix the approval panel query issue

-- 1. Check if users table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- 2. Check the structure of handouts table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'handouts'
ORDER BY ordinal_position;

-- 3. Check if we have any pending handouts
SELECT id, title, uploaded_by, is_approved, created_at
FROM handouts
WHERE is_approved = false
LIMIT 5;

-- 4. Create a simple users table if it doesn't exist
-- This will store basic user info that can be populated from auth.users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create a function to sync auth.users with our users table
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email))
    ON CONFLICT (id) DO UPDATE SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically sync user data
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;
CREATE TRIGGER sync_user_profile_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION sync_user_profile();

-- 7. Disable RLS on users table for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 8. Test the query that HandoutApprovalPanel uses
SELECT 
    h.*,
    l.course_code,
    l.lecture_number,
    l.title as lecture_title,
    u.name as uploader_name,
    u.email as uploader_email
FROM handouts h
LEFT JOIN lectures l ON h.lecture_id = l.id
LEFT JOIN users u ON h.uploaded_by = u.id
WHERE h.is_approved = false
ORDER BY h.created_at DESC;
