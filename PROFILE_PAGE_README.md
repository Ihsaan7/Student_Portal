# User Profile Page Setup Guide

This guide explains the new user profile page feature that allows users to:

- Select animated character avatars
- View and update their username
- Change their password
- View their email and programme information

## 📁 Files Created

### 1. Profile Page Component

- **Location**: `app/profile/page.js`
- **Purpose**: Main profile page with avatar selection, user info display, and update forms

### 2. Animated Character Avatars (8 unique avatars)

- **Location**: `public/avatars/avatar1.svg` through `avatar8.svg`
- **Features**: CSS-animated SVG characters with unique colors and expressions

### 3. Database Schema Update

- **Location**: `user-profile-avatar-setup.sql`
- **Purpose**: Adds `avatar_url` column to the users table

## 🚀 Setup Instructions

### Step 1: Run the Database Migration

1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `user-profile-avatar-setup.sql`
4. Click "Run" to execute the SQL

This will:

- Add the `avatar_url` column to your `users` table
- Set default avatars for existing users
- Create an index for performance

### Step 2: Verify the Installation

The profile page is already integrated into your navigation:

1. Log in to your application
2. Click on the profile icon in the top right corner
3. Select "Profile" from the dropdown menu
4. You'll be redirected to `/profile`

### Step 3: Test the Features

#### Avatar Selection

1. Click on your current avatar or the "Choose Avatar" button
2. A modal will appear showing 8 animated character avatars
3. Click on any avatar to select it
4. Click "Save Avatar" to update your profile

#### Username Update

1. Click the "Edit" button next to your username
2. Enter your new username in the modal
3. Click "Update Username" to save changes

#### Password Change

1. Click "Change Password" in the password section
2. Enter your new password (minimum 6 characters)
3. Confirm your password
4. Click "Update Password" to save

## 🎨 Avatar Customization

Each avatar is an animated SVG file with:

- Unique color gradients
- CSS animations (blinking, smiling, bouncing)
- Fully scalable vector graphics
- Lightweight file sizes

### Available Avatars:

1. **Avatar 1**: Purple gradient with animated smile
2. **Avatar 2**: Pink gradient with blinking eyes
3. **Avatar 3**: Blue gradient with moving eyes
4. **Avatar 4**: Green/teal with animated eyebrows
5. **Avatar 5**: Sunset gradient with cute expression
6. **Avatar 6**: Deep blue with glowing effect
7. **Avatar 7**: Red/orange with animated cheeks
8. **Avatar 8**: Pastel gradient with flowing hair

## 🔒 Security Features

- **Password Update**: Uses Supabase Auth's built-in password update method
- **Session Management**: Requires active authentication session
- **Database Security**: Updates are tied to the authenticated user's ID
- **No password storage**: Old passwords are not required (uses session token)

## 📱 Responsive Design

The profile page is fully responsive:

- **Desktop**: Full modal dialogs with grid layout
- **Tablet**: Adjusted spacing and layouts
- **Mobile**: Touch-friendly buttons and stacked layouts

## 🎯 Features Overview

### Profile Information Display

- **Avatar**: Visual representation with hover effect
- **Username**: Editable display name
- **Email**: Read-only email address (from auth)
- **Programme**: Display of enrolled programme
- **Password**: Hidden with change option

### Navigation

- **Back to Home**: Returns to dashboard
- **Logout**: Signs out and redirects to login

### Success/Error Messages

- Green success messages for completed actions
- Red error messages with helpful information
- Auto-dismiss after 3 seconds

## 🔧 Troubleshooting

### Avatar not updating?

1. Check your internet connection
2. Verify the database migration ran successfully
3. Check browser console for errors
4. Ensure the `avatar_url` column exists in the users table

### Password not changing?

1. Ensure new password is at least 6 characters
2. Verify both password fields match
3. Check that you're logged in
4. Look for error messages on the page

### Can't see avatars?

1. Check that the `public/avatars/` directory exists
2. Verify all 8 avatar SVG files are present
3. Clear browser cache and refresh

## 🛠️ Technical Details

### Technologies Used

- **Next.js 15**: React framework with App Router
- **Supabase**: Authentication and database
- **SVG Animations**: Pure CSS animations
- **Responsive CSS**: Mobile-first design

### Database Schema

```sql
-- Users table structure
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  programme TEXT,
  avatar_url TEXT DEFAULT '/avatars/avatar1.svg',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### API Calls

- `supabase.auth.getUser()` - Get current user
- `supabase.from('users').select()` - Fetch profile
- `supabase.from('users').update()` - Update avatar/username
- `supabase.auth.updateUser()` - Change password

## 🎨 Customization Options

### Adding More Avatars

1. Create new SVG files in `public/avatars/`
2. Name them `avatar9.svg`, `avatar10.svg`, etc.
3. Update the `avatars` array in `app/profile/page.js`:

```javascript
const avatars = [
  // ... existing avatars
  { id: 9, name: "Avatar 9", path: "/avatars/avatar9.svg" },
  { id: 10, name: "Avatar 10", path: "/avatars/avatar10.svg" },
];
```

### Changing Avatar Grid Layout

Modify the grid classes in the avatar modal:

```javascript
// Current: 4 columns
<div className="grid grid-cols-4 gap-4 mb-6">

// For 3 columns:
<div className="grid grid-cols-3 gap-4 mb-6">

// For 5 columns:
<div className="grid grid-cols-5 gap-4 mb-6">
```

### Styling Adjustments

The page uses CSS variables for theming:

- `hsl(var(--primary))` - Primary color
- `hsl(var(--secondary))` - Secondary color
- `hsl(var(--card))` - Card background
- `hsl(var(--foreground))` - Text color

## 📞 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify all SQL migrations have run
3. Ensure Supabase environment variables are set
4. Check that the users table has the required columns

## ✅ Checklist

- [ ] Run `user-profile-avatar-setup.sql` in Supabase
- [ ] Verify avatars are visible in `public/avatars/`
- [ ] Test avatar selection
- [ ] Test username update
- [ ] Test password change
- [ ] Verify on mobile devices
- [ ] Check success/error messages work

## 🎉 Enjoy Your New Profile Page!

Your users can now personalize their accounts with fun animated avatars and manage their profile settings easily!
