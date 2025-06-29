-- Create storage bucket for support files
-- Run this script in your Supabase SQL Editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'support-files',
    'support-files',
    true,
    5242880, -- 5MB limit
    ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for support files
-- Users can upload files to their own folder
CREATE POLICY "Users can upload support files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'support-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own files
CREATE POLICY "Users can view own support files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'support-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own files
CREATE POLICY "Users can update own support files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'support-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own files
CREATE POLICY "Users can delete own support files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'support-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'support-files'; 