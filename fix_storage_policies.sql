-- Fix storage policies for support files
-- Run this to fix the RLS policy issues

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can upload support files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own support files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own support files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own support files" ON storage.objects;

-- Create simpler, more permissive policies for testing
-- Allow authenticated users to upload to support-files bucket
CREATE POLICY "Allow authenticated uploads to support-files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'support-files' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to view files in support-files bucket
CREATE POLICY "Allow authenticated view support-files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'support-files' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to update files in support-files bucket
CREATE POLICY "Allow authenticated update support-files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'support-files' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to delete files in support-files bucket
CREATE POLICY "Allow authenticated delete support-files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'support-files' 
        AND auth.role() = 'authenticated'
    );

-- Verify the policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%support%'; 