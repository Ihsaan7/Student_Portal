-- Fix Announcements RLS Policies
-- Run this in your Supabase SQL Editor to fix the permission issues

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admins full access to announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admins to read all announcement reads" ON user_announcement_reads;

-- Recreate policies with correct table references
-- Allow admins to do everything with announcements
CREATE POLICY "Allow admins full access to announcements" ON announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Allow admins to read all read statuses
CREATE POLICY "Allow admins to read all announcement reads" ON user_announcement_reads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('announcements', 'user_announcement_reads')
ORDER BY tablename, policyname;

-- Grant execute permissions on RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_announcements_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_announcement_read(INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_announcements_with_read_status(UUID, INTEGER) TO authenticated;

-- Check if user has admin role
SELECT 
    id,
    email,
    role,
    created_at
FROM public.users 
WHERE id = auth.uid();

-- Test the unread announcements count function
SELECT get_unread_announcements_count(auth.uid()) as unread_count;