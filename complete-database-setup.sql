-- Complete Database Setup for StudentNest Application
    name TEXT,
    email TEXT,
    programme TEXT,
    avatar_url TEXT DEFAULT '/avatars/avatar1.svg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create enrolled_courses table
CREATE TABLE IF NOT EXISTS public.enrolled_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 3,
    semester TEXT NOT NULL,
    programme TEXT NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_code, semester)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_enrolled_courses_user_id ON public.enrolled_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_enrolled_courses_course_code ON public.enrolled_courses(course_code);

-- 4. Create a function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Disable RLS for development (enable later for production)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrolled_courses DISABLE ROW LEVEL SECURITY;

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.enrolled_courses TO anon, authenticated;

-- 8. Insert some sample courses for testing (optional)
INSERT INTO public.enrolled_courses (user_id, course_code, course_name, credits, semester, programme)
SELECT 
    auth.uid(),
    'CS101',
    'Introduction to Computer Science',
    3,
    'Fall 2024',
    'BS in Computer Science'
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, course_code, semester) DO NOTHING;

-- 9. Verify setup
SELECT 'Setup completed successfully!' as status;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'enrolled_courses');