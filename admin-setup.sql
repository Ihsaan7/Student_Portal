-- Admin Panel Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Add role column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin'));

-- 2. Create admin_settings table for admin configuration
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create admin_logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT, -- 'user', 'course', 'system', etc.
    target_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create system_stats table for dashboard analytics
CREATE TABLE IF NOT EXISTS system_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stat_date DATE DEFAULT CURRENT_DATE,
    total_users INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    total_admins INTEGER DEFAULT 0,
    active_users_today INTEGER DEFAULT 0,
    new_registrations_today INTEGER DEFAULT 0,
    total_courses INTEGER DEFAULT 0,
    total_enrollments INTEGER DEFAULT 0,
    support_queries_pending INTEGER DEFAULT 0,
    support_queries_solved INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stat_date)
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_stats_date ON system_stats(stat_date);

-- 6. Enable RLS on new tables
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_stats ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for admin tables

-- Admin settings - only admins can access
CREATE POLICY "Only admins can view admin settings" ON admin_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Only admins can modify admin settings" ON admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Admin logs - only admins can view
CREATE POLICY "Only admins can view admin logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Only admins can insert admin logs" ON admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- System stats - only admins can access
CREATE POLICY "Only admins can view system stats" ON system_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Only admins can modify system stats" ON system_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- 8. Update support_queries policies to allow admin access
DROP POLICY IF EXISTS "Admins can view all queries" ON support_queries;
DROP POLICY IF EXISTS "Admins can update all queries" ON support_queries;

CREATE POLICY "Admins can view all queries" ON support_queries
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all queries" ON support_queries
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- 9. Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
    VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to update system stats
CREATE OR REPLACE FUNCTION update_system_stats()
RETURNS VOID AS $$
BEGIN
    INSERT INTO system_stats (
        stat_date,
        total_users,
        total_students,
        total_admins,
        active_users_today,
        new_registrations_today,
        total_courses,
        total_enrollments,
        support_queries_pending,
        support_queries_solved
    )
    VALUES (
        CURRENT_DATE,
        (SELECT COUNT(*) FROM public.users),
        (SELECT COUNT(*) FROM public.users WHERE role = 'student'),
        (SELECT COUNT(*) FROM public.users WHERE role IN ('admin', 'super_admin')),
        (SELECT COUNT(*) FROM public.users WHERE DATE(created_at) = CURRENT_DATE),
        (SELECT COUNT(*) FROM public.users WHERE DATE(created_at) = CURRENT_DATE),
        (SELECT COUNT(DISTINCT course_code) FROM enrolled_courses),
        (SELECT COUNT(*) FROM enrolled_courses),
        (SELECT COUNT(*) FROM support_queries WHERE status = 'pending'),
        (SELECT COUNT(*) FROM support_queries WHERE status = 'solved')
    )
    ON CONFLICT (stat_date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        total_students = EXCLUDED.total_students,
        total_admins = EXCLUDED.total_admins,
        active_users_today = EXCLUDED.active_users_today,
        new_registrations_today = EXCLUDED.new_registrations_today,
        total_courses = EXCLUDED.total_courses,
        total_enrollments = EXCLUDED.total_enrollments,
        support_queries_pending = EXCLUDED.support_queries_pending,
        support_queries_solved = EXCLUDED.support_queries_solved,
        created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create your first admin user (CHANGE THESE CREDENTIALS!)
-- First, you need to sign up normally, then run this to make yourself admin:
-- UPDATE public.users SET role = 'super_admin' WHERE email = 'your-admin-email@example.com';

-- 12. Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('site_name', '"VU Student Portal"', 'Name of the application'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('max_file_size', '5242880', 'Maximum file upload size in bytes (5MB)'),
('allowed_file_types', '["image/*", "application/pdf", "application/msword"]', 'Allowed file types for uploads'),
('email_notifications', 'true', 'Enable/disable email notifications'),
('registration_enabled', 'true', 'Enable/disable new user registration')
ON CONFLICT (setting_key) DO NOTHING;

-- 13. Grant necessary permissions
GRANT ALL ON admin_settings TO authenticated;
GRANT ALL ON admin_logs TO authenticated;
GRANT ALL ON system_stats TO authenticated;

-- 14. Create initial system stats entry
SELECT update_system_stats();

-- 15. Verification
SELECT 'Admin setup completed successfully!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_settings', 'admin_logs', 'system_stats');

-- Instructions:
-- 1. Run this SQL script in your Supabase SQL editor
-- 2. Sign up for a new account or use existing account
-- 3. Run: UPDATE public.users SET role = 'super_admin' WHERE email = 'your-email@example.com';
-- 4. Access admin panel at /admin