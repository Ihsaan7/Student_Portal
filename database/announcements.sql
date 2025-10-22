-- Announcements Table
-- This table stores announcements that can be displayed to users

CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    video_url TEXT,
    video_file_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_active_created ON announcements(is_active, created_at DESC);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_announcements_updated_at ON announcements;
CREATE TRIGGER trigger_update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcements_updated_at();

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow everyone to read active announcements
DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;
CREATE POLICY "Anyone can view active announcements" ON announcements
    FOR SELECT USING (is_active = true);

-- Allow everyone to view all announcements (for admin purposes)
-- You might want to restrict this to admin users only in production
DROP POLICY IF EXISTS "Anyone can view all announcements" ON announcements;
CREATE POLICY "Anyone can view all announcements" ON announcements
    FOR SELECT USING (true);

-- Allow anyone to insert announcements (you might want to restrict this)
DROP POLICY IF EXISTS "Anyone can insert announcements" ON announcements;
CREATE POLICY "Anyone can insert announcements" ON announcements
    FOR INSERT WITH CHECK (true);

-- Allow anyone to update announcements (you might want to restrict this)
DROP POLICY IF EXISTS "Anyone can update announcements" ON announcements;
CREATE POLICY "Anyone can update announcements" ON announcements
    FOR UPDATE USING (true);

-- Allow anyone to delete announcements (you might want to restrict this)
DROP POLICY IF EXISTS "Anyone can delete announcements" ON announcements;
CREATE POLICY "Anyone can delete announcements" ON announcements
    FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE announcements IS 'Stores announcements that can be displayed to users';
COMMENT ON COLUMN announcements.title IS 'The title of the announcement';
COMMENT ON COLUMN announcements.content IS 'The main content/message of the announcement';
COMMENT ON COLUMN announcements.video_url IS 'Optional URL to a video associated with the announcement';
COMMENT ON COLUMN announcements.video_file_name IS 'File name of uploaded video (if stored in Supabase storage)';
COMMENT ON COLUMN announcements.is_active IS 'Whether the announcement is currently active/visible';
COMMENT ON COLUMN announcements.created_at IS 'When the announcement was created';
COMMENT ON COLUMN announcements.updated_at IS 'When the announcement was last updated';

-- Insert some sample data for testing
INSERT INTO announcements (title, content, is_active) 
VALUES 
    ('Welcome to StudentNest', 'Welcome to StudentNest! Explore all the features available.', true),
    ('System Maintenance', 'The system will undergo maintenance this weekend. Please save your work regularly.', true),
    ('New Features Available', 'Check out the new AI chat assistant and announcement system!', true)
ON CONFLICT DO NOTHING;
