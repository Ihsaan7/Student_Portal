-- Create course guidance table for "How to Attempt this Course" section
-- This table will store admin-editable guidance content for each course

CREATE TABLE IF NOT EXISTS course_guidance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code TEXT NOT NULL,
    guidance_points TEXT[], -- Array of guidance points (Point 1, Point 2, etc.)
    main_video_url TEXT, -- URL for the main "How to Attempt" video
    main_video_title TEXT DEFAULT 'How to Attempt this Course',
    youtube_video_id TEXT, -- Extracted YouTube video ID for the main video
    duration TEXT, -- Duration in MM:SS or HH:MM:SS format
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(course_code)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_guidance_course_code ON course_guidance(course_code);
CREATE INDEX IF NOT EXISTS idx_course_guidance_active ON course_guidance(is_active) WHERE is_active = true;

-- Disable RLS for now (enable later for security)
ALTER TABLE course_guidance DISABLE ROW LEVEL SECURITY;

-- Insert sample guidance for CS201 course
INSERT INTO course_guidance (course_code, guidance_points, main_video_url, youtube_video_id, duration, created_by) 
VALUES (
    'CS201',
    ARRAY[
        'Point 1: Start by watching all lecture videos in sequence',
        'Point 2: Download and review handouts before each lecture',
        'Point 3: Practice coding examples provided in each lecture',
        'Point 4: Join discussion forums for doubt clarification',
        'Point 5: Complete assignments within the given deadlines',
        'Point 6: Review previous lectures before moving to advanced topics'
    ],
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'dQw4w9WgXcQ',
    '15:30',
    (SELECT id FROM auth.users LIMIT 1)
)
ON CONFLICT (course_code) DO UPDATE SET
    guidance_points = EXCLUDED.guidance_points,
    main_video_url = EXCLUDED.main_video_url,
    youtube_video_id = EXCLUDED.youtube_video_id,
    duration = EXCLUDED.duration,
    updated_at = NOW();

-- Create function to get course guidance
CREATE OR REPLACE FUNCTION get_course_guidance(course_code_param TEXT)
RETURNS TABLE(
    id UUID,
    course_code TEXT,
    guidance_points TEXT[],
    main_video_url TEXT,
    main_video_title TEXT,
    youtube_video_id TEXT,
    duration TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cg.id,
        cg.course_code,
        cg.guidance_points,
        cg.main_video_url,
        cg.main_video_title,
        cg.youtube_video_id,
        cg.duration,
        cg.is_active
    FROM course_guidance cg
    WHERE cg.course_code = course_code_param AND cg.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Verify setup
SELECT 'Course guidance table created successfully!' as status;
SELECT * FROM course_guidance WHERE course_code = 'CS201';