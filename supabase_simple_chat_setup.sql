-- Simple Chat System Setup
-- Run this script in your Supabase SQL Editor

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('course', 'support')),
    course_id VARCHAR(50),
    course_name VARCHAR(255),
    course_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    message_text TEXT,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'voice')),
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    file_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_participants table
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT false,
    UNIQUE(room_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- Simple policies - allow all authenticated users to read/write
CREATE POLICY "Allow authenticated users to read chat rooms" ON chat_rooms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read messages" ON chat_messages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to insert their own messages" ON chat_messages
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update their own messages" ON chat_messages
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Allow users to delete their own messages" ON chat_messages
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Allow authenticated users to read participants" ON chat_participants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to insert themselves as participants" ON chat_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update their own participant status" ON chat_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Insert default support chat room
INSERT INTO chat_rooms (room_type, course_name, course_code) 
VALUES ('support', 'Student Support', 'SUPPORT')
ON CONFLICT DO NOTHING;

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,
  5242880,
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Simple storage policies
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to view files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-files' AND
    auth.role() = 'authenticated'
  ); 