# Admin Panel Setup Guide

This guide will help you set up the admin panel for your StudentNest application.

## Prerequisites

- Supabase project set up and running
- Database tables from the main setup already created
- Access to Supabase dashboard or SQL editor

## Step 1: Run Database Setup

You need to run the SQL commands in `admin-setup.sql` to create the necessary tables and functions for the admin system.

### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `admin-setup.sql`
4. Click "Run" to execute the SQL

### Option B: Using psql (if available)

```bash
psql "your-database-connection-string" -f admin-setup.sql
```

### Option C: Manual Setup

If you prefer to run the commands manually, here are the key SQL statements:

```sql
-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student';

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_stats table
CREATE TABLE IF NOT EXISTS system_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_users INTEGER DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  total_enrollments INTEGER DEFAULT 0,
  pending_support_queries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 2: Create Your First Admin User

### Method 1: Update Existing User (Recommended)

If you already have a user account:

1. Go to Supabase Dashboard → Authentication → Users
2. Find your user account
3. Note down your User ID
4. Go to SQL Editor and run:

```sql
UPDATE users 
SET role = 'super_admin' 
WHERE id = 'your-user-id-here';
```

### Method 2: Create New Admin User

1. First, create a new user account through the normal signup process
2. Then update their role using the SQL command above

### Method 3: Direct Database Insert

```sql
-- Insert a new admin user (replace with your details)
INSERT INTO users (id, email, name, role, created_at)
VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  'System Administrator',
  'super_admin',
  NOW()
);
```

**Note:** If using Method 3, you'll also need to create the corresponding auth user in Supabase Auth.

## Step 3: Set Up Row Level Security (RLS)

Run these commands to set up proper security:

```sql
-- Enable RLS on admin tables
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin full access to admin_settings" ON admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin full access to admin_logs" ON admin_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin read access to system_stats" ON system_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );
```

## Step 4: Test Admin Access

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000/login`

3. Log in with your admin account

4. You should be redirected to `/admin` instead of `/home`

5. Verify you can access all admin features:
   - Dashboard overview
   - User management
   - Support queries
   - Course management
   - System settings (super admin only)

## Admin Roles

### Student (default)
- Regular user access
- Can access courses and support

### Admin
- Access to admin panel
- Can manage users (except super admins)
- Can handle support queries
- Can view courses and enrollments
- Can view system analytics

### Super Admin
- All admin permissions
- Can manage other admins
- Can access system settings
- Can view admin logs
- Can delete users

## Security Features

- **Role-based access control**: Different permission levels for different admin roles
- **Audit logging**: All admin actions are logged with timestamps and details
- **Route protection**: Admin routes are protected by middleware
- **Session validation**: Admin status is verified on each request
- **RLS policies**: Database-level security ensures data protection

## Troubleshooting

### "Access Denied" Error
- Check that your user has the correct role in the database
- Verify RLS policies are set up correctly
- Clear browser cache and try again

### Admin Panel Not Loading
- Check browser console for JavaScript errors
- Verify all admin files are created correctly
- Check network connectivity

### Database Errors
- Ensure all SQL commands ran successfully
- Check Supabase logs for detailed error messages
- Verify table permissions and RLS policies

## Next Steps

1. **Customize the admin panel**: Modify the admin components to match your needs
2. **Add more admin features**: Extend the admin functionality as required
3. **Set up monitoring**: Consider adding system monitoring and alerts
4. **Backup strategy**: Implement regular database backups
5. **Security review**: Regularly review and update security policies

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review Supabase logs
3. Verify database setup
4. Test with a fresh user account

For additional help, refer to the main project documentation or create an issue in the project repository.