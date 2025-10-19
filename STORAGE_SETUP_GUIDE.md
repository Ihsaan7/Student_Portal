# 📦 Storage Security Setup Guide

## Why This is Needed

Your SQL script can't modify storage directly because you don't have owner permissions. You need to set up storage policies through the Supabase Dashboard instead.

---

## 🎯 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com
2. Sign in to your account
3. Select your **VU_Clone** project

---

### Step 2: Navigate to Storage

1. In the left sidebar, click **"Storage"**
2. You should see your buckets (or create one if needed)

---

### Step 3: Check/Create the Bucket

1. Look for a bucket called **"support-files"**
2. If it doesn't exist:
   - Click **"New bucket"**
   - Name: `support-files`
   - Public: **OFF** (keep it private)
   - Click **"Create bucket"**

---

### Step 4: Set Up Policies

#### A. Go to Policies Tab

1. Click on the **"support-files"** bucket
2. Click the **"Policies"** tab at the top
3. You should see "No policies created yet"

#### B. Create Upload Policy

1. Click **"New Policy"** button
2. Select **"For full customization"** (not the template)
3. Fill in:
   - **Policy Name**: `Users can upload own files`
   - **Allowed operation**: Check **INSERT** only
   - **Policy definition** (paste this):
     ```sql
     (bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text)
     ```
   - **Target roles**: `authenticated`
4. Click **"Review"** then **"Save policy"**

#### C. Create Select/View Policy

1. Click **"New Policy"** again
2. Select **"For full customization"**
3. Fill in:
   - **Policy Name**: `Users can view own files`
   - **Allowed operation**: Check **SELECT** only
   - **Policy definition** (paste this):
     ```sql
     (bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text)
     ```
   - **Target roles**: `authenticated`
4. Click **"Review"** then **"Save policy"**

#### D. Create Delete Policy

1. Click **"New Policy"** again
2. Select **"For full customization"**
3. Fill in:
   - **Policy Name**: `Users can delete own files`
   - **Allowed operation**: Check **DELETE** only
   - **Policy definition** (paste this):
     ```sql
     (bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text)
     ```
   - **Target roles**: `authenticated`
4. Click **"Review"** then **"Save policy"**

---

## ✅ Verification

After creating all 3 policies, you should see:

- ✅ **Users can upload own files** (INSERT)
- ✅ **Users can view own files** (SELECT)
- ✅ **Users can delete own files** (DELETE)

All policies should show:

- **Roles**: `authenticated`
- **Command**: INSERT/SELECT/DELETE respectively

---

## 🔍 What These Policies Do

### Policy Explanation:

```sql
(bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text)
```

**Breaking it down:**

- `bucket_id = 'support-files'` → Only applies to support-files bucket
- `(storage.foldername(name))[1]` → Gets the first folder in the file path
- `= auth.uid()::text` → Must match the user's ID

**Example:**

- User ID: `abc-123-def`
- Can upload to: `support-files/abc-123-def/myfile.pdf` ✅
- Cannot upload to: `support-files/xyz-456-ghi/myfile.pdf` ❌

**This ensures users can only access their own files!**

---

## 🚨 Troubleshooting

### Can't find Storage section?

- Make sure you're in the correct project
- Storage should be in the left sidebar under "Database"

### Can't create policy?

- Make sure you're the project owner
- Try refreshing the page

### Policy not working?

- Check the policy definition has no typos
- Make sure target roles is set to `authenticated`
- Verify the bucket name is exactly `support-files`

### Want to test it?

Try uploading a file from your app after login - it should work!

---

## 📝 Optional: Admin Access

If you want admins to see ALL files (not just their own):

1. Create additional policy: `Admins can view all files`
2. Allowed operation: **SELECT**
3. Policy definition:
   ```sql
   (bucket_id = 'support-files' AND
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true))
   ```
4. This lets users with `is_admin = true` see all files

---

## ✅ You're Done!

Once you've created all 3 policies:

- ✅ Users can upload their support files
- ✅ Users can view their own files
- ✅ Users can delete their own files
- ✅ Users CANNOT access other users' files
- ✅ Your storage is secure! 🔒

**Now your security setup is complete!** 🎉

---

## Quick Reference

### Policy 1: Upload

```
Name: Users can upload own files
Operation: INSERT
Target: authenticated
Definition: (bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text)
```

### Policy 2: View

```
Name: Users can view own files
Operation: SELECT
Target: authenticated
Definition: (bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text)
```

### Policy 3: Delete

```
Name: Users can delete own files
Operation: DELETE
Target: authenticated
Definition: (bucket_id = 'support-files' AND (storage.foldername(name))[1] = auth.uid()::text)
```

Copy and paste these exactly as shown!
