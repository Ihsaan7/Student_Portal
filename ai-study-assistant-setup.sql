-- AI Study Assistant Database Setup
-- This script creates the necessary tables and functions for the AI Study Assistant feature

-- Create study_progress table to track user progress
CREATE TABLE IF NOT EXISTS study_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL,
    mcqs_completed INTEGER DEFAULT 0,
    total_mcqs INTEGER DEFAULT 0,
    accuracy_rate INTEGER DEFAULT 0,
    lectures_studied INTEGER DEFAULT 0,
    last_study_session TIMESTAMP WITH TIME ZONE,
    study_sessions INTEGER DEFAULT 0,
    total_study_time INTEGER DEFAULT 0, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_code)
);

-- Create mcq_sessions table to store individual quiz sessions
CREATE TABLE IF NOT EXISTS mcq_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    questions_total INTEGER NOT NULL,
    questions_correct INTEGER NOT NULL,
    accuracy_rate INTEGER NOT NULL,
    time_taken INTEGER, -- in minutes
    lecture_content_hash VARCHAR(64), -- to identify which content was used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mcq_questions table to store generated questions (optional, for analytics)
CREATE TABLE IF NOT EXISTS mcq_questions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES mcq_sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
    user_answer INTEGER CHECK (user_answer BETWEEN 0 AND 3),
    is_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE study_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for study_progress
CREATE POLICY "Users can view their own study progress" ON study_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study progress" ON study_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study progress" ON study_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for mcq_sessions
CREATE POLICY "Users can view their own MCQ sessions" ON mcq_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MCQ sessions" ON mcq_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for mcq_questions
CREATE POLICY "Users can view their own MCQ questions" ON mcq_questions
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM mcq_sessions WHERE id = session_id));

CREATE POLICY "Users can insert their own MCQ questions" ON mcq_questions
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM mcq_sessions WHERE id = session_id));

-- Create function to update study progress
CREATE OR REPLACE FUNCTION update_study_progress(
    p_user_id UUID,
    p_course_code VARCHAR(20),
    p_mcqs_completed INTEGER,
    p_accuracy_rate INTEGER,
    p_session_time INTEGER DEFAULT 30
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO study_progress (
        user_id,
        course_code,
        mcqs_completed,
        total_mcqs,
        accuracy_rate,
        lectures_studied,
        last_study_session,
        study_sessions,
        total_study_time
    )
    VALUES (
        p_user_id,
        p_course_code,
        p_mcqs_completed,
        p_mcqs_completed,
        p_accuracy_rate,
        1,
        NOW(),
        1,
        p_session_time
    )
    ON CONFLICT (user_id, course_code)
    DO UPDATE SET
        mcqs_completed = study_progress.mcqs_completed + p_mcqs_completed,
        total_mcqs = study_progress.total_mcqs + p_mcqs_completed,
        accuracy_rate = CASE 
            WHEN study_progress.study_sessions = 0 THEN p_accuracy_rate
            ELSE ROUND((study_progress.accuracy_rate * study_progress.study_sessions + p_accuracy_rate) / (study_progress.study_sessions + 1))
        END,
        lectures_studied = study_progress.lectures_studied + 1,
        last_study_session = NOW(),
        study_sessions = study_progress.study_sessions + 1,
        total_study_time = study_progress.total_study_time + p_session_time,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user study statistics
CREATE OR REPLACE FUNCTION get_user_study_stats(p_user_id UUID, p_course_code VARCHAR(20))
RETURNS TABLE (
    mcqs_completed INTEGER,
    total_mcqs INTEGER,
    accuracy_rate INTEGER,
    lectures_studied INTEGER,
    last_study_session TIMESTAMP WITH TIME ZONE,
    study_sessions INTEGER,
    total_study_time INTEGER,
    avg_session_time NUMERIC,
    best_accuracy INTEGER,
    recent_sessions_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.mcqs_completed,
        sp.total_mcqs,
        sp.accuracy_rate,
        sp.lectures_studied,
        sp.last_study_session,
        sp.study_sessions,
        sp.total_study_time,
        CASE 
            WHEN sp.study_sessions > 0 THEN ROUND(sp.total_study_time::NUMERIC / sp.study_sessions, 1)
            ELSE 0
        END as avg_session_time,
        COALESCE((SELECT MAX(accuracy_rate) FROM mcq_sessions WHERE user_id = p_user_id AND course_code = p_course_code), 0) as best_accuracy,
        (SELECT COUNT(*) FROM mcq_sessions WHERE user_id = p_user_id AND course_code = p_course_code AND session_date >= NOW() - INTERVAL '7 days') as recent_sessions_count
    FROM study_progress sp
    WHERE sp.user_id = p_user_id AND sp.course_code = p_course_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log MCQ session
CREATE OR REPLACE FUNCTION log_mcq_session(
    p_user_id UUID,
    p_course_code VARCHAR(20),
    p_questions_total INTEGER,
    p_questions_correct INTEGER,
    p_time_taken INTEGER DEFAULT NULL,
    p_content_hash VARCHAR(64) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    session_id INTEGER;
    calculated_accuracy INTEGER;
BEGIN
    calculated_accuracy := ROUND((p_questions_correct::NUMERIC / p_questions_total) * 100);
    
    INSERT INTO mcq_sessions (
        user_id,
        course_code,
        questions_total,
        questions_correct,
        accuracy_rate,
        time_taken,
        lecture_content_hash
    )
    VALUES (
        p_user_id,
        p_course_code,
        p_questions_total,
        p_questions_correct,
        calculated_accuracy,
        p_time_taken,
        p_content_hash
    )
    RETURNING id INTO session_id;
    
    -- Update study progress
    PERFORM update_study_progress(
        p_user_id,
        p_course_code,
        p_questions_total,
        calculated_accuracy,
        COALESCE(p_time_taken, 30)
    );
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_progress_user_course ON study_progress(user_id, course_code);
CREATE INDEX IF NOT EXISTS idx_mcq_sessions_user_course ON mcq_sessions(user_id, course_code);
CREATE INDEX IF NOT EXISTS idx_mcq_sessions_date ON mcq_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_session ON mcq_questions(session_id);

-- Insert some sample data for testing (optional)
-- You can uncomment these lines to test the functionality
/*
INSERT INTO study_progress (user_id, course_code, mcqs_completed, total_mcqs, accuracy_rate, lectures_studied, study_sessions, total_study_time)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'CS101', 20, 30, 85, 3, 3, 90),
    ('00000000-0000-0000-0000-000000000001', 'MATH201', 15, 20, 75, 2, 2, 60);
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON study_progress TO authenticated;
GRANT ALL ON mcq_sessions TO authenticated;
GRANT ALL ON mcq_questions TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION update_study_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_study_stats TO authenticated;
GRANT EXECUTE ON FUNCTION log_mcq_session TO authenticated;

COMMIT;

-- Success message
SELECT 'AI Study Assistant database setup completed successfully!' as message;