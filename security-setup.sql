-- =============================================
-- COMPREHENSIVE SECURITY SETUP FOR STUDENTNEST
-- Run this in your Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. CREATE MISSING TABLES (IF NEEDED)
-- =============================================

-- Create announcement_tracking if it doesn't exist
CREATE TABLE IF NOT EXISTS public.announcement_tracking (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id INTEGER,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create support_queries if it doesn't exist
CREATE TABLE IF NOT EXISTS public.support_queries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_chat_history if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables (only if they exist)
DO $$ 
BEGIN
  -- Enable RLS on existing tables
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enrolled_courses') THEN
    ALTER TABLE public.enrolled_courses ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_notes') THEN
    ALTER TABLE public.calendar_notes ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'announcements') THEN
    ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Now safe to enable RLS on newly created tables
  ALTER TABLE public.announcement_tracking ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.support_queries ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
END $$;

-- =============================================
-- 3. DROP EXISTING POLICIES (IF ANY)
-- =============================================

-- Drop existing policies to avoid conflicts (safe if tables don't exist)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own data" ON public.users;
  DROP POLICY IF EXISTS "Users can update own data" ON public.users;
  DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
  DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrolled_courses;
  DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.enrolled_courses;
  DROP POLICY IF EXISTS "Users can delete own enrollments" ON public.enrolled_courses;
  DROP POLICY IF EXISTS "Users can manage own calendar notes" ON public.calendar_notes;
  DROP POLICY IF EXISTS "Authenticated users can view announcements" ON public.announcements;
  DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
  DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
  DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
  DROP POLICY IF EXISTS "Users can manage own announcement tracking" ON public.announcement_tracking;
  DROP POLICY IF EXISTS "Users can view own support queries" ON public.support_queries;
  DROP POLICY IF EXISTS "Users can insert support queries" ON public.support_queries;
  DROP POLICY IF EXISTS "Users can update own support queries" ON public.support_queries;
  DROP POLICY IF EXISTS "Admins can view all support queries" ON public.support_queries;
  DROP POLICY IF EXISTS "Admins can update support queries" ON public.support_queries;
  DROP POLICY IF EXISTS "Users can manage own chat history" ON public.ai_chat_history;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- =============================================
-- 4. USERS TABLE POLICIES
-- =============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    -- Users can only view their own profile
    CREATE POLICY "Users can view own data" ON public.users
      FOR SELECT 
      USING (auth.uid() = id);

    -- Users can update their own profile
    CREATE POLICY "Users can update own data" ON public.users
      FOR UPDATE 
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);

    -- Users are automatically created on signup (handled by trigger)
    CREATE POLICY "Users can insert own data" ON public.users
      FOR INSERT 
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- =============================================
-- 5. ENROLLED COURSES POLICIES
-- =============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enrolled_courses') THEN
    -- Users can view their own enrollments
    CREATE POLICY "Users can view own enrollments" ON public.enrolled_courses
      FOR SELECT 
      USING (auth.uid() = user_id);

    -- Users can enroll in courses
    CREATE POLICY "Users can insert own enrollments" ON public.enrolled_courses
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

    -- Users can unenroll from courses
    CREATE POLICY "Users can delete own enrollments" ON public.enrolled_courses
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- 6. CALENDAR NOTES POLICIES
-- =============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_notes') THEN
    -- Users have full access to their calendar notes
    CREATE POLICY "Users can manage own calendar notes" ON public.calendar_notes
      FOR ALL 
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- 7. ANNOUNCEMENTS POLICIES
-- =============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'announcements') THEN
    -- All authenticated users can view announcements
    CREATE POLICY "Authenticated users can view announcements" ON public.announcements
      FOR SELECT 
      TO authenticated 
      USING (true);

    -- Only admins can create announcements
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'users' 
               AND column_name = 'is_admin') THEN
      CREATE POLICY "Admins can insert announcements" ON public.announcements
        FOR INSERT 
        TO authenticated
        WITH CHECK (
          auth.uid() IN (
            SELECT id FROM public.users WHERE is_admin = true
          )
        );

      -- Only admins can update announcements
      CREATE POLICY "Admins can update announcements" ON public.announcements
        FOR UPDATE 
        TO authenticated
        USING (
          auth.uid() IN (
            SELECT id FROM public.users WHERE is_admin = true
          )
        )
        WITH CHECK (
          auth.uid() IN (
            SELECT id FROM public.users WHERE is_admin = true
          )
        );

      -- Only admins can delete announcements
      CREATE POLICY "Admins can delete announcements" ON public.announcements
        FOR DELETE 
        TO authenticated
        USING (
          auth.uid() IN (
            SELECT id FROM public.users WHERE is_admin = true
          )
        );
    END IF;
  END IF;
END $$;

-- =============================================
-- 8. ANNOUNCEMENT TRACKING POLICIES
-- =============================================

-- Users can manage their own announcement tracking
CREATE POLICY "Users can manage own announcement tracking" ON public.announcement_tracking
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 9. SUPPORT QUERIES POLICIES
-- =============================================

-- Users can view their own support queries
CREATE POLICY "Users can view own support queries" ON public.support_queries
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create support queries
CREATE POLICY "Users can insert support queries" ON public.support_queries
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own support queries
CREATE POLICY "Users can update own support queries" ON public.support_queries
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all support queries (if is_admin column exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'users' 
             AND column_name = 'is_admin') THEN
    CREATE POLICY "Admins can view all support queries" ON public.support_queries
      FOR SELECT 
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT id FROM public.users WHERE is_admin = true
        )
      );

    -- Admins can update any support query (for responses)
    CREATE POLICY "Admins can update support queries" ON public.support_queries
      FOR UPDATE 
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT id FROM public.users WHERE is_admin = true
        )
      );
  END IF;
END $$;

-- =============================================
-- 10. AI CHAT HISTORY POLICIES
-- =============================================

-- Users can manage their own chat history
CREATE POLICY "Users can manage own chat history" ON public.ai_chat_history
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 11. STORAGE SECURITY
-- =============================================

-- Note: Storage policies are managed through Supabase Dashboard
-- Go to: Storage -> Policies -> Create Policy
-- 
-- Recommended policies for 'support-files' bucket:
-- 
-- 1. Upload Policy:
--    Name: "Users can upload own files"
--    Allowed operation: INSERT
--    Policy definition: (bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text)
--
-- 2. Select Policy:
--    Name: "Users can view own files"
--    Allowed operation: SELECT
--    Policy definition: (bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text)
--
-- 3. Delete Policy:
--    Name: "Users can delete own files"
--    Allowed operation: DELETE
--    Policy definition: (bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text)
--
-- OR run these commands if you have storage owner permissions:
-- (Skip this section if you don't have permission)
--
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can upload own files" ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text);
-- 
-- CREATE POLICY "Users can view own files" ON storage.objects
--   FOR SELECT TO authenticated
--   USING (bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text);
-- 
-- CREATE POLICY "Users can delete own files" ON storage.objects
--   FOR DELETE TO authenticated
--   USING (bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================
-- 12. SECURITY FUNCTIONS
-- =============================================

-- Function to check if user is admin (if is_admin column exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'users' 
             AND column_name = 'is_admin') THEN
    CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
    RETURNS boolean AS $func$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id AND is_admin = true
      );
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
END $$;

-- Function to log security events (optional)
CREATE TABLE IF NOT EXISTS public.security_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs (if is_admin column exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'users' 
             AND column_name = 'is_admin') THEN
    CREATE POLICY "Admins can view security logs" ON public.security_logs
      FOR SELECT 
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT id FROM public.users WHERE is_admin = true
        )
      );
  ELSE
    -- If no is_admin column, make logs view-only for the user who created them
    CREATE POLICY "Users can view own security logs" ON public.security_logs
      FOR SELECT 
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- 13. RATE LIMITING (Supabase side)
-- =============================================

-- Note: Also enable rate limiting in Supabase Dashboard:
-- Authentication -> Settings -> Rate Limits
-- Recommended settings:
-- - Email signups: 10 per hour
-- - Password signins: 50 per hour
-- - Password recovery: 5 per hour

-- =============================================
-- 14. AUDIT TRAIL
-- =============================================

-- Create audit log for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (if is_admin column exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'users' 
             AND column_name = 'is_admin') THEN
    CREATE POLICY "Admins can view audit logs" ON public.audit_logs
      FOR SELECT 
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT id FROM public.users WHERE is_admin = true
        )
      );
  ELSE
    -- If no is_admin column, make logs view-only for the user who created them
    CREATE POLICY "Users can view own audit logs" ON public.audit_logs
      FOR SELECT 
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- 15. VERIFICATION STATUS
-- =============================================

-- Add verification queries to check security setup
-- Run these to verify everything is set up correctly:

-- Check RLS is enabled on all tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 
    'enrolled_courses', 
    'calendar_notes', 
    'announcements', 
    'announcement_tracking', 
    'support_queries', 
    'ai_chat_history'
  )
ORDER BY tablename;

-- Check all policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================
-- 16. EMERGENCY DISABLE (Use only if needed)
-- =============================================

-- If you need to temporarily disable RLS for debugging:
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- 
-- ALWAYS RE-ENABLE BEFORE GOING TO PRODUCTION:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SETUP COMPLETE
-- =============================================

-- Next steps:
-- 1. Test authentication flow
-- 2. Verify users can only access their own data
-- 3. Test admin functions
-- 4. Monitor security logs
-- 5. Enable Supabase rate limiting in dashboard
