-- Support Queries System Setup
-- This replaces the complex chat system with a simple query-based support system

-- Create support_queries table
CREATE TABLE IF NOT EXISTS support_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    query_text TEXT NOT NULL,
    query_type TEXT DEFAULT 'text' CHECK (query_type IN ('text', 'file')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'solved', 'unsolved')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    admin_response TEXT,
    admin_id UUID REFERENCES auth.users(id),
    admin_response_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_queries_user_id ON support_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_support_queries_status ON support_queries(status);
CREATE INDEX IF NOT EXISTS idx_support_queries_created_at ON support_queries(created_at);

-- Enable Row Level Security
ALTER TABLE support_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see their own queries
CREATE POLICY "Users can view own queries" ON support_queries
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own queries
CREATE POLICY "Users can insert own queries" ON support_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own queries (for status changes)
CREATE POLICY "Users can update own queries" ON support_queries
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all queries (we'll add this later when we create admin role)
-- CREATE POLICY "Admins can view all queries" ON support_queries
--     FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can update all queries (we'll add this later when we create admin role)
-- CREATE POLICY "Admins can update all queries" ON support_queries
--     FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Create storage bucket for support files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'support-files',
    'support-files',
    true,
    5242880, -- 5MB limit
    ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for support files
CREATE POLICY "Users can upload support files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'support-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own support files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'support-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_queries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_support_queries_updated_at
    BEFORE UPDATE ON support_queries
    FOR EACH ROW
    EXECUTE FUNCTION update_support_queries_updated_at();

-- Clean up old chat tables (optional - uncomment if you want to remove the old system)
-- DROP TABLE IF EXISTS chat_messages CASCADE;
-- DROP TABLE IF EXISTS chat_participants CASCADE;
-- DROP TABLE IF EXISTS chat_rooms CASCADE; 