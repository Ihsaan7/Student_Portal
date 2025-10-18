# Announcements System Setup Guide

## 🚨 Database Setup Required

The announcement system requires database tables and functions to be created. Follow these steps:

## Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **New Query**

## Step 2: Run the Database Schema

1. Open the file `announcements-schema.sql` in your project
2. Copy the entire content
3. Paste it into the Supabase SQL Editor
4. Click **Run** to execute the SQL

## Step 3: Verify Setup

After running the SQL, you should see these tables created:
- `announcements` - Stores announcement data
- `user_announcement_reads` - Tracks which users have read which announcements

## Step 4: Test the System

1. Restart your development server: `npm run dev`
2. Login as an admin user
3. Go to Admin Panel → Announcements tab
4. Try creating a test announcement
5. Check the Calendar page for the announcement section
6. Verify the bell icon shows unread count

## Troubleshooting

### Error: "function get_unread_announcement_count does not exist"
- Make sure you ran the complete SQL schema
- Check that all functions were created successfully

### Error: "relation announcements does not exist"
- The tables weren't created properly
- Re-run the SQL schema in Supabase dashboard

### Error: "permission denied for table announcements"
- RLS policies might not be set up correctly
- Ensure your user has admin role in the database

## Admin Role Setup

Make sure your user has admin privileges:

```sql
-- Update your user role to admin
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
WHERE email = 'your-email@domain.com';
```

## Features Included

✅ **Admin Panel Integration**
- Create, edit, delete announcements
- Upload video content
- Toggle active/inactive status

✅ **User Notifications**
- Bell icon with unread count
- Announcement section on Calendar page
- Read status tracking per user

✅ **Database Security**
- Row Level Security (RLS) enabled
- Admin-only write access
- User-specific read tracking

## File Structure

```
app/
├── admin/page.js              # Admin panel with announcements tab
├── calendar/page.js           # Calendar with announcements section
├── components/
│   ├── AnnouncementAdminPanel.js  # Admin CRUD interface
│   └── DashboardLayout.js         # Bell notification icon
└── announcements-schema.sql       # Database setup
```

Once the database is set up, the announcement system will be fully functional!