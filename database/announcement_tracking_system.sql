-- Complete Announcement Tracking System
-- This file sets up all the necessary tables and functions for the announcement system

-- ===== TABLES =====

-- Create announcement_reads table to track which users have read which announcements
CREATE TABLE IF NOT EXISTS announcement_reads (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, announcement_id)
);

-- Create calendar_notes table for user calendar notes
CREATE TABLE IF NOT EXISTS calendar_notes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ===== INDEXES =====

-- Indexes for announcement_reads
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement_id ON announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_announcement ON announcement_reads(user_id, announcement_id);

-- Indexes for calendar_notes
CREATE INDEX IF NOT EXISTS idx_calendar_notes_user_id ON calendar_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_notes_date ON calendar_notes(date);
CREATE INDEX IF NOT EXISTS idx_calendar_notes_user_date ON calendar_notes(user_id, date);

-- ===== RLS POLICIES =====

-- Enable RLS for announcement_reads
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- RLS policies for announcement_reads
DROP POLICY IF EXISTS "Users can view own announcement reads" ON announcement_reads;
CREATE POLICY "Users can view own announcement reads" ON announcement_reads
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own announcement reads" ON announcement_reads;
CREATE POLICY "Users can insert own announcement reads" ON announcement_reads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own announcement reads" ON announcement_reads;
CREATE POLICY "Users can update own announcement reads" ON announcement_reads
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable RLS for calendar_notes
ALTER TABLE calendar_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_notes
DROP POLICY IF EXISTS "Users can view own calendar notes" ON calendar_notes;
CREATE POLICY "Users can view own calendar notes" ON calendar_notes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own calendar notes" ON calendar_notes;
CREATE POLICY "Users can insert own calendar notes" ON calendar_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own calendar notes" ON calendar_notes;
CREATE POLICY "Users can update own calendar notes" ON calendar_notes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own calendar notes" ON calendar_notes;
CREATE POLICY "Users can delete own calendar notes" ON calendar_notes
    FOR DELETE USING (auth.uid() = user_id);

-- ===== TRIGGERS =====

-- Create trigger function for calendar_notes updated_at
CREATE OR REPLACE FUNCTION update_calendar_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for calendar_notes
DROP TRIGGER IF EXISTS trigger_update_calendar_notes_updated_at ON calendar_notes;
CREATE TRIGGER trigger_update_calendar_notes_updated_at
    BEFORE UPDATE ON calendar_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_notes_updated_at();

-- ===== RPC FUNCTIONS =====

-- Function to get unread announcement count for a user
CREATE OR REPLACE FUNCTION get_unread_announcement_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_active_announcements INTEGER;
    read_announcements INTEGER;
    unread_count INTEGER;
BEGIN
    -- Get total number of active announcements
    SELECT COUNT(*) INTO total_active_announcements
    FROM announcements 
    WHERE is_active = true;
    
    -- Get number of announcements this user has read
    SELECT COUNT(*) INTO read_announcements
    FROM announcement_reads ar
    JOIN announcements a ON ar.announcement_id = a.id
    WHERE ar.user_id = user_uuid 
    AND a.is_active = true;
    
    -- Calculate unread count
    unread_count := total_active_announcements - read_announcements;
    
    -- Ensure non-negative result
    IF unread_count < 0 THEN
        unread_count := 0;
    END IF;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark an announcement as read by a user
CREATE OR REPLACE FUNCTION mark_announcement_read(announcement_uuid INTEGER, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert or update the read record
    INSERT INTO announcement_reads (user_id, announcement_id, read_at)
    VALUES (user_uuid, announcement_uuid, NOW())
    ON CONFLICT (user_id, announcement_id) 
    DO UPDATE SET read_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent announcements with read status for a user
CREATE OR REPLACE FUNCTION get_recent_announcements_with_read_status(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR,
    content TEXT,
    video_url TEXT,
    video_file_name VARCHAR,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
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
        a.is_active,
        a.created_at,
        a.updated_at,
        CASE 
            WHEN ar.id IS NOT NULL THEN true
            ELSE false
        END as is_read
    FROM announcements a
    LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = user_uuid
    WHERE a.is_active = true
    ORDER BY a.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all announcements with read status for admin (optional)
CREATE OR REPLACE FUNCTION get_all_announcements_with_read_status(user_uuid UUID)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR,
    content TEXT,
    video_url TEXT,
    video_file_name VARCHAR,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
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
        a.is_active,
        a.created_at,
        a.updated_at,
        CASE 
            WHEN ar.id IS NOT NULL THEN true
            ELSE false
        END as is_read
    FROM announcements a
    LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = user_uuid
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== COMMENTS =====

COMMENT ON TABLE announcement_reads IS 'Tracks which announcements have been read by which users';
COMMENT ON COLUMN announcement_reads.user_id IS 'Reference to the user who read the announcement';
COMMENT ON COLUMN announcement_reads.announcement_id IS 'Reference to the announcement that was read';
COMMENT ON COLUMN announcement_reads.read_at IS 'When the announcement was marked as read';

COMMENT ON TABLE calendar_notes IS 'Stores user notes for specific calendar dates';
COMMENT ON COLUMN calendar_notes.user_id IS 'Reference to the user who created the note';
COMMENT ON COLUMN calendar_notes.date IS 'The date this note is associated with';
COMMENT ON COLUMN calendar_notes.note_text IS 'The content of the note';

COMMENT ON FUNCTION get_unread_announcement_count(UUID) IS 'Returns the number of unread active announcements for a specific user';
COMMENT ON FUNCTION mark_announcement_read(INTEGER, UUID) IS 'Marks a specific announcement as read by a specific user';
COMMENT ON FUNCTION get_recent_announcements_with_read_status(UUID, INTEGER) IS 'Returns recent announcements with read status for a specific user';

-- ===== SAMPLE DATA FOR TESTING =====

-- Note: The sample announcements were already inserted in the announcements.sql file
-- This is just to ensure we have some test data if needed

DO $$
BEGIN
    -- Only insert if no announcements exist
    IF NOT EXISTS (SELECT 1 FROM announcements LIMIT 1) THEN
        INSERT INTO announcements (title, content, is_active) VALUES
            ('Welcome to VU Clone', 'Welcome to our Virtual University clone application! Explore all the features available.', true),
            ('System Maintenance', 'The system will undergo maintenance this weekend. Please save your work regularly.', true),
            ('New Features Available', 'Check out the new AI chat assistant and announcement system!', true),
            ('Academic Calendar Update', 'Important dates have been added to the academic calendar. Please review your schedule.', true),
            ('Library Services', 'Extended library hours now available for final exam preparation.', false);
    END IF;
END $$;
