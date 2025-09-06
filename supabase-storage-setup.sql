-- Supabase Storage Setup for Course Materials
-- Run this script in your Supabase SQL Editor to create storage buckets and policies

-- 1. Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload course materials" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'course-materials' AND
    auth.role() = 'authenticated'
);

-- 3. Create policy to allow public read access to approved materials
CREATE POLICY "Allow public read access to course materials" ON storage.objects
FOR SELECT USING (
    bucket_id = 'course-materials'
);

-- 4. Create policy to allow users to update their own uploads
CREATE POLICY "Allow users to update their own uploads" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'course-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Create policy to allow users to delete their own uploads
CREATE POLICY "Allow users to delete their own uploads" ON storage.objects
FOR DELETE USING (
    bucket_id = 'course-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: After running this script, you may need to:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Verify the 'course-materials' bucket was created
-- 3. Adjust bucket settings if needed (file size limits, allowed file types, etc.)
-- 4. Test file upload functionality from your application