-- Handout Download Tracking System
-- This script creates tables and functions to track handout downloads and calculate progress

-- 1. Create handout_downloads table to track when users download/open handouts
CREATE TABLE IF NOT EXISTS handout_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    handout_id UUID REFERENCES handouts(id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL,
    lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
    download_type VARCHAR(20) DEFAULT 'view' CHECK (download_type IN ('view', 'download')),
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    UNIQUE(user_id, handout_id) -- Prevent duplicate tracking for same user-handout pair
);

-- 2. Create course_progress table to track overall course progress
CREATE TABLE IF NOT EXISTS course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL,
    total_lectures INTEGER DEFAULT 0,
    handouts_accessed INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_code)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_handout_downloads_user_course ON handout_downloads(user_id, course_code);
CREATE INDEX IF NOT EXISTS idx_handout_downloads_handout ON handout_downloads(handout_id);
CREATE INDEX IF NOT EXISTS idx_handout_downloads_date ON handout_downloads(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON course_progress(user_id, course_code);

-- 4. Function to track handout download/view
CREATE OR REPLACE FUNCTION track_handout_access(
    p_user_id UUID,
    p_handout_id UUID,
    p_course_code VARCHAR(20),
    p_lecture_id UUID,
    p_download_type VARCHAR(20) DEFAULT 'view',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    already_accessed BOOLEAN;
BEGIN
    -- Check if user has already accessed this handout
    SELECT EXISTS(
        SELECT 1 FROM handout_downloads 
        WHERE user_id = p_user_id AND handout_id = p_handout_id
    ) INTO already_accessed;
    
    -- Only insert if not already accessed (prevents duplicate progress)
    IF NOT already_accessed THEN
        INSERT INTO handout_downloads (
            user_id, handout_id, course_code, lecture_id, 
            download_type, ip_address, user_agent
        ) VALUES (
            p_user_id, p_handout_id, p_course_code, p_lecture_id,
            p_download_type, p_ip_address, p_user_agent
        );
        
        -- Update course progress
        PERFORM update_course_progress(p_user_id, p_course_code);
        
        -- Track study time (assume 15 minutes per handout view)
        PERFORM track_study_time(p_user_id, p_course_code, 15);
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to update course progress based on handout access
CREATE OR REPLACE FUNCTION update_course_progress(
    p_user_id UUID,
    p_course_code VARCHAR(20)
)
RETURNS VOID AS $$
DECLARE
    total_lectures_count INTEGER;
    accessed_handouts_count INTEGER;
    progress_percent INTEGER;
BEGIN
    -- Get total number of lectures for the course
    SELECT COUNT(*) INTO total_lectures_count
    FROM lectures 
    WHERE course_code = p_course_code;
    
    -- Get number of unique handouts accessed by user for this course
    SELECT COUNT(DISTINCT lecture_id) INTO accessed_handouts_count
    FROM handout_downloads 
    WHERE user_id = p_user_id AND course_code = p_course_code;
    
    -- Calculate progress percentage
    IF total_lectures_count > 0 THEN
        progress_percent := ROUND((accessed_handouts_count::DECIMAL / total_lectures_count::DECIMAL) * 100);
    ELSE
        progress_percent := 0;
    END IF;
    
    -- Insert or update course progress
    INSERT INTO course_progress (
        user_id, course_code, total_lectures, 
        handouts_accessed, progress_percentage, last_activity
    ) VALUES (
        p_user_id, p_course_code, total_lectures_count,
        accessed_handouts_count, progress_percent, NOW()
    )
    ON CONFLICT (user_id, course_code)
    DO UPDATE SET
        total_lectures = total_lectures_count,
        handouts_accessed = accessed_handouts_count,
        progress_percentage = progress_percent,
        last_activity = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. Function to get user's course progress
CREATE OR REPLACE FUNCTION get_user_course_progress(
    p_user_id UUID,
    p_course_code VARCHAR(20)
)
RETURNS TABLE(
    total_lectures INTEGER,
    handouts_accessed INTEGER,
    progress_percentage INTEGER,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.total_lectures,
        cp.handouts_accessed,
        cp.progress_percentage,
        cp.last_activity
    FROM course_progress cp
    WHERE cp.user_id = p_user_id AND cp.course_code = p_course_code;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to get user's quiz attempts from mcq_sessions
CREATE OR REPLACE FUNCTION get_user_quiz_attempts(
    p_user_id UUID,
    p_course_code VARCHAR(20)
)
RETURNS INTEGER AS $$
DECLARE
    quiz_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO quiz_count
    FROM mcq_sessions
    WHERE user_id = p_user_id AND course_code = p_course_code;
    
    RETURN COALESCE(quiz_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 8. Function to get user's total study time
CREATE OR REPLACE FUNCTION get_user_study_hours(
    p_user_id UUID,
    p_course_code VARCHAR(20)
)
RETURNS INTEGER AS $$
DECLARE
    study_minutes INTEGER;
BEGIN
    SELECT total_study_time INTO study_minutes
    FROM study_progress
    WHERE user_id = p_user_id AND course_code = p_course_code;
    
    -- Convert minutes to hours (rounded)
    RETURN COALESCE(ROUND(study_minutes::DECIMAL / 60), 0);
END;
$$ LANGUAGE plpgsql;

-- 9. Disable RLS for development (enable later for security)
ALTER TABLE handout_downloads DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress DISABLE ROW LEVEL SECURITY;

-- 10. Grant permissions
GRANT ALL ON handout_downloads TO authenticated;
GRANT ALL ON course_progress TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION track_handout_access TO authenticated;
GRANT EXECUTE ON FUNCTION update_course_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_course_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_quiz_attempts TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_study_hours TO authenticated;

-- 9. Function to track study time
CREATE OR REPLACE FUNCTION track_study_time(
    p_user_id UUID,
    p_course_code VARCHAR(20),
    p_minutes INTEGER DEFAULT 15
)
RETURNS VOID AS $$
BEGIN
    -- Insert or update study progress with study time
    INSERT INTO study_progress (
        user_id, course_code, total_study_time, 
        study_sessions, last_study_session
    ) VALUES (
        p_user_id, p_course_code, p_minutes, 1, NOW()
    )
    ON CONFLICT (user_id, course_code)
    DO UPDATE SET
        total_study_time = study_progress.total_study_time + p_minutes,
        study_sessions = study_progress.study_sessions + 1,
        last_study_session = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION track_study_time TO authenticated;

-- Success message
SELECT 'Handout download tracking system setup completed successfully!' as message;