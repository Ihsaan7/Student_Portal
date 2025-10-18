-- Announcements System Database Schema
-- This file contains the SQL commands to create the announcements system tables

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    video_url VARCHAR(500),
    video_file_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);

-- Create user announcement reads tracking table
CREATE TABLE IF NOT EXISTS user_announcement_reads (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    announcement_id INTEGER REFERENCES announcements(id),
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, announcement_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_user_reads_user_id ON user_announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reads_announcement_id ON user_announcement_reads(announcement_id);

-- Enable Row Level Security (RLS)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_announcement_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements table
-- Allow all authenticated users to read active announcements
CREATE POLICY "Allow authenticated users to read active announcements" ON announcements
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Allow admins to do everything with announcements
CREATE POLICY "Allow admins full access to announcements" ON announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for user_announcement_reads table
-- Allow users to read their own read status
CREATE POLICY "Users can read their own announcement reads" ON user_announcement_reads
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own read status
CREATE POLICY "Users can insert their own announcement reads" ON user_announcement_reads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow admins to read all read statuses
CREATE POLICY "Allow admins to read all announcement reads" ON user_announcement_reads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Create a function to get unread announcements count for a user
CREATE OR REPLACE FUNCTION get_unread_announcements_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM announcements a
        WHERE a.is_active = true
        AND a.id NOT IN (
            SELECT uar.announcement_id
            FROM user_announcement_reads uar
            WHERE uar.user_id = user_uuid
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to mark announcement as read
CREATE OR REPLACE FUNCTION mark_announcement_read(announcement_uuid INTEGER, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_announcement_reads (user_id, announcement_id)
    VALUES (user_uuid, announcement_uuid)
    ON CONFLICT (user_id, announcement_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get recent announcements with read status
CREATE OR REPLACE FUNCTION get_recent_announcements_with_read_status(user_uuid UUID, limit_count INTEGER DEFAULT 3)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR(255),
    content TEXT,
    video_url VARCHAR(500),
    video_file_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.content,
        a.video_url,
        a.video_file_name,
        a.created_at,
        CASE WHEN uar.user_id IS NOT NULL THEN true ELSE false END as is_read
    FROM announcements a
    LEFT JOIN user_announcement_reads uar ON a.id = uar.announcement_id AND uar.user_id = user_uuid
    WHERE a.is_active = true
    ORDER BY a.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample data (optional)
INSERT INTO announcements (title, content, created_by) VALUES 
('Welcome to the New Academic Year', 'We are excited to welcome all students to the new academic year. Please check your course schedules and make sure you have access to all required materials.', (SELECT id FROM auth.users WHERE email = 'admin@vu.edu.pk' LIMIT 1)),
('System Maintenance Notice', 'The learning management system will undergo scheduled maintenance on Sunday from 2 AM to 6 AM. During this time, the system may be temporarily unavailable.', (SELECT id FROM auth.users WHERE email = 'admin@vu.edu.pk' LIMIT 1)),
('New Study Resources Available', 'We have added new study resources and practice materials for all courses. Check the resources section in your course pages.', (SELECT id FROM auth.users WHERE email = 'admin@vu.edu.pk' LIMIT 1));