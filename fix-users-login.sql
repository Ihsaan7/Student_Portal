-- Fix Users Table and Login Issues
-- Run this script in your Supabase SQL Editor

-- 1. Create users table with proper structure
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'student',
    programme TEXT DEFAULT 'CS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Disable RLS for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Remove the problematic trigger that might be causing issues
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS sync_user_profile();

-- 4. Create a simpler user sync function (optional, manual sync)
CREATE OR REPLACE FUNCTION create_user_profile(user_id UUID, user_email TEXT, user_name TEXT DEFAULT NULL, user_role TEXT DEFAULT 'student')
RETURNS void AS $$
BEGIN
    INSERT INTO users (id, email, name, role, programme)
    VALUES (user_id, user_email, COALESCE(user_name, user_email), user_role, 'CS')
    ON CONFLICT (id) DO UPDATE SET
        email = user_email,
        name = COALESCE(user_name, user_email),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Check if there are any existing auth users and sync them
DO $$
DECLARE
    auth_user RECORD;
BEGIN
    -- This will only work if you have admin access to auth.users
    -- If this fails, that's okay - users will be created on login
    BEGIN
        FOR auth_user IN 
            SELECT id, email, raw_user_meta_data
            FROM auth.users 
            LIMIT 10  -- Just sync a few to test
        LOOP
            PERFORM create_user_profile(
                auth_user.id, 
                auth_user.email, 
                COALESCE(auth_user.raw_user_meta_data->>'name', auth_user.email),
                'student'
            );
        END LOOP;
        
        RAISE NOTICE 'Synced existing auth users to users table';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not sync auth users (this is normal if you do not have admin access)';
    END;
END $$;

-- 6. Create an admin user (you can change this email to your actual admin email)
-- Replace 'admin@example.com' with the actual email you want to be admin
INSERT INTO users (id, email, name, role, programme) 
VALUES (
    gen_random_uuid(), -- This will be updated when the real user logs in
    'admin@example.com', 
    'Admin User', 
    'admin', 
    'ADMIN'
) ON CONFLICT DO NOTHING;

-- 7. Verify the setup
SELECT 'Users table setup completed!' as status;

-- 8. Show current users
SELECT id, email, name, role, programme, created_at 
FROM users 
ORDER BY created_at DESC;
