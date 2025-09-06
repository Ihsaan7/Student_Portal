-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,
  5242880, -- 5MB limit
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Users can upload chat files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-files' AND
    auth.role() = 'authenticated'
  );

-- Policy to allow users to view files in chat rooms they participate in
CREATE POLICY "Users can view chat files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-files' AND
    EXISTS (
      SELECT 1 FROM chat_participants cp
      JOIN chat_messages cm ON cp.room_id = cm.room_id
      WHERE cm.file_url LIKE '%' || storage.objects.name || '%'
      AND cp.user_id = auth.uid()
    )
  );

-- Policy to allow users to delete their own uploaded files
CREATE POLICY "Users can delete their own chat files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-files' AND
    owner = auth.uid()
  ); 