-- Lecture System Improvements SQL Script
-- This script adds support for unlike reasons and uploader name display

-- Add unlike reasons table
CREATE TABLE IF NOT EXISTS handout_unlikes (
    id BIGSERIAL PRIMARY KEY,
    handout_id BIGINT REFERENCES handouts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(handout_id, user_id)
);

-- Add uploader name column to handouts table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'handouts' AND column_name = 'uploader_name') THEN
        ALTER TABLE handouts ADD COLUMN uploader_name TEXT;
    END IF;
END $$;

-- Create function to get user display name
CREATE OR REPLACE FUNCTION get_user_display_name(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    display_name TEXT;
BEGIN
    -- Try to get name from user_metadata first
    SELECT COALESCE(
        (raw_user_meta_data->>'full_name'),
        (raw_user_meta_data->>'name'),
        email
    ) INTO display_name
    FROM auth.users
    WHERE id = user_uuid;
    
    -- If no name found, return 'Anonymous User'
    RETURN COALESCE(display_name, 'Anonymous User');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to toggle handout unlike
CREATE OR REPLACE FUNCTION toggle_handout_unlike(
    handout_id_param BIGINT,
    user_id_param UUID,
    reason_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    unlike_exists BOOLEAN;
BEGIN
    -- Check if unlike already exists
    SELECT EXISTS(
        SELECT 1 FROM handout_unlikes 
        WHERE handout_id = handout_id_param AND user_id = user_id_param
    ) INTO unlike_exists;
    
    IF unlike_exists THEN
        -- Remove unlike
        DELETE FROM handout_unlikes 
        WHERE handout_id = handout_id_param AND user_id = user_id_param;
        RETURN FALSE;
    ELSE
        -- Add unlike with reason
        INSERT INTO handout_unlikes (handout_id, user_id, reason)
        VALUES (handout_id_param, user_id_param, COALESCE(reason_param, 'No reason provided'));
        
        -- Also remove any existing like
        DELETE FROM handout_likes 
        WHERE handout_id = handout_id_param AND user_id = user_id_param;
        
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing toggle_handout_like function to handle unlikes
CREATE OR REPLACE FUNCTION toggle_handout_like(
    handout_id_param BIGINT,
    user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    like_exists BOOLEAN;
BEGIN
    -- Check if like already exists
    SELECT EXISTS(
        SELECT 1 FROM handout_likes 
        WHERE handout_id = handout_id_param AND user_id = user_id_param
    ) INTO like_exists;
    
    IF like_exists THEN
        -- Remove like
        DELETE FROM handout_likes 
        WHERE handout_id = handout_id_param AND user_id = user_id_param;
        RETURN FALSE;
    ELSE
        -- Add like
        INSERT INTO handout_likes (handout_id, user_id)
        VALUES (handout_id_param, user_id_param)
        ON CONFLICT (handout_id, user_id) DO NOTHING;
        
        -- Also remove any existing unlike
        DELETE FROM handout_unlikes 
        WHERE handout_id = handout_id_param AND user_id = user_id_param;
        
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for handouts with enhanced information
CREATE OR REPLACE VIEW handouts_with_stats AS
SELECT 
    h.*,
    get_user_display_name(h.uploaded_by) as uploader_name,
    COALESCE(like_counts.like_count, 0) as like_count,
    COALESCE(unlike_counts.unlike_count, 0) as unlike_count
FROM handouts h
LEFT JOIN (
    SELECT handout_id, COUNT(*) as like_count
    FROM handout_likes
    GROUP BY handout_id
) like_counts ON h.id = like_counts.handout_id
LEFT JOIN (
    SELECT handout_id, COUNT(*) as unlike_count
    FROM handout_unlikes
    GROUP BY handout_id
) unlike_counts ON h.id = unlike_counts.handout_id;

-- Set up Row Level Security for handout_unlikes
ALTER TABLE handout_unlikes ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own unlikes
CREATE POLICY "Users can manage their own unlikes" ON handout_unlikes
    FOR ALL USING (auth.uid() = user_id);

-- Policy for admins to view all unlikes
CREATE POLICY "Admins can view all unlikes" ON handout_unlikes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
                 OR auth.users.email = 'admin@vu.edu.pk')
        )
    );

-- Grant necessary permissions
GRANT SELECT ON handouts_with_stats TO authenticated;
GRANT ALL ON handout_unlikes TO authenticated;
GRANT USAGE ON SEQUENCE handout_unlikes_id_seq TO authenticated;

-- Update existing handouts with uploader names
UPDATE handouts 
SET uploader_name = get_user_display_name(uploaded_by)
WHERE uploader_name IS NULL AND uploaded_by IS NOT NULL;

COMMIT;

-- Success message
SELECT 'Lecture system improvements applied successfully!' as status;