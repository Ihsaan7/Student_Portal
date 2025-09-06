-- Fix handout approval system to properly handle rejected handouts
-- This script adds a status field to track pending, approved, and rejected states

-- 1. Add status column to handouts table
ALTER TABLE handouts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2. Update existing records to use the new status system
-- Set status based on current is_approved value
UPDATE handouts 
SET status = CASE 
    WHEN is_approved = true THEN 'approved'
    WHEN is_approved = false AND approved_by IS NOT NULL THEN 'rejected'
    ELSE 'pending'
END
WHERE status = 'pending'; -- Only update records that haven't been updated yet

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_handouts_status ON handouts(status);

-- 4. Update the view to include status
CREATE OR REPLACE VIEW handouts_with_likes AS
SELECT 
    h.*,
    COALESCE(l.like_count, 0) as like_count
FROM handouts h
LEFT JOIN (
    SELECT 
        handout_id,
        COUNT(*) as like_count
    FROM handout_likes
    GROUP BY handout_id
) l ON h.id = l.handout_id;

-- 5. Create a function to update handout status
CREATE OR REPLACE FUNCTION update_handout_status(handout_id_param UUID, new_status TEXT, admin_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate status
    IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status. Must be pending, approved, or rejected';
    END IF;
    
    -- Update the handout
    UPDATE handouts 
    SET 
        status = new_status,
        is_approved = CASE WHEN new_status = 'approved' THEN true ELSE false END,
        approved_by = CASE WHEN new_status IN ('approved', 'rejected') THEN admin_id ELSE NULL END,
        approved_at = CASE WHEN new_status IN ('approved', 'rejected') THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = handout_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. Test the function
-- SELECT update_handout_status('your-handout-id', 'approved', 'your-admin-id');

-- 7. Show current handout statuses
SELECT 
    id,
    title,
    status,
    is_approved,
    approved_by,
    approved_at,
    created_at
FROM handouts 
ORDER BY created_at DESC
LIMIT 10;

-- 8. Show pending handouts (what the approval panel should show)
SELECT 
    h.id,
    h.title,
    h.status,
    l.course_code,
    l.lecture_number,
    l.title as lecture_title
FROM handouts h
LEFT JOIN lectures l ON h.lecture_id = l.id
WHERE h.status = 'pending'
ORDER BY h.created_at DESC;