# 🚀 Deployment Security Checklist

## ✅ Before You Deploy

### 1. Install Required Package
```bash
npm install @supabase/auth-helpers-nextjs
```

### 2. Environment Variables Setup

Make sure these are configured in your hosting platform (Vercel/Netlify):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

⚠️ **NEVER commit these to Git!**

### 3. Supabase Dashboard Security Settings

Login to your Supabase dashboard and configure:

#### A. Authentication Settings
1. Go to **Authentication** → **Settings**
2. Enable **Email Confirmations** (recommended)
3. Set **Site URL** to your production domain
4. Add **Redirect URLs** for your production domain
5. Enable **Rate Limiting** (default is good)

#### B. Row Level Security (RLS)
Run this in your Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrolled_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Enrolled courses policies
CREATE POLICY "Users can view own enrollments" ON public.enrolled_courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollments" ON public.enrolled_courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own enrollments" ON public.enrolled_courses
  FOR DELETE USING (auth.uid() = user_id);

-- Calendar notes policies
CREATE POLICY "Users can manage own calendar notes" ON public.calendar_notes
  FOR ALL USING (auth.uid() = user_id);

-- Announcements (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view announcements" ON public.announcements
  FOR SELECT TO authenticated USING (true);

-- Announcement tracking
CREATE POLICY "Users can manage own announcement tracking" ON public.announcement_tracking
  FOR ALL USING (auth.uid() = user_id);

-- Support queries
CREATE POLICY "Users can manage own support queries" ON public.support_queries
  FOR ALL USING (auth.uid() = user_id);

-- AI chat history
CREATE POLICY "Users can manage own chat history" ON public.ai_chat_history
  FOR ALL USING (auth.uid() = user_id);
```

#### C. Storage Security
```sql
-- Secure storage buckets
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'support-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'support-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 4. Build and Test Locally

```bash
# Build the project
npm run build

# Test the production build
npm run start
```

Test these scenarios:
- ✅ Try accessing /home without logging in → should redirect to /login
- ✅ Login with valid credentials → should work
- ✅ Login with invalid credentials → should show error
- ✅ Try entering malicious code in forms → should be sanitized
- ✅ Check browser console for errors

### 5. Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts and add environment variables when asked
```

Or use the Vercel dashboard:
1. Connect your GitHub repo
2. Add environment variables
3. Deploy

### 6. Post-Deployment Verification

#### A. Test Security Headers
Visit: https://securityheaders.com
Enter your deployed URL and verify you get an **A** rating.

#### B. Test SSL/HTTPS
Visit: https://www.ssllabs.com/ssltest/
Enter your domain and ensure you have an **A** rating.

#### C. Test Authentication Flow
1. Visit your site (should redirect to login if not authenticated)
2. Try creating an account
3. Try logging in
4. Try accessing protected pages
5. Try logging out

#### D. Test Rate Limiting
1. Try logging in with wrong password 5+ times rapidly
2. Should get "Too many attempts" error

### 7. Monitoring Setup

#### Option A: Vercel Analytics (Built-in)
- Automatically enabled on Vercel
- View in Vercel dashboard

#### Option B: Sentry (Error Tracking)
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 8. Regular Maintenance

- [ ] Update dependencies monthly: `npm update`
- [ ] Check Supabase logs weekly
- [ ] Review failed login attempts
- [ ] Monitor API usage
- [ ] Backup database regularly

## 🚨 Security Incident Response Plan

If you detect a security breach:

### Immediate Actions:
1. **Disable affected features** in Supabase dashboard
2. **Force logout all users**: Supabase → Authentication → Users → Bulk Actions
3. **Check logs**: Review Supabase logs for suspicious activity
4. **Change API keys**: Generate new ones in Supabase dashboard

### Investigation:
1. Identify the attack vector
2. Check database for unauthorized changes
3. Review all admin actions
4. Check for data exfiltration

### Recovery:
1. Patch the vulnerability
2. Force password reset for affected users
3. Notify users about the incident
4. Update security measures

## 📱 Student Communication

Add this to your login page:

```
🔒 Security Notice:
- Use a strong, unique password
- Never share your password
- Always log out on shared computers
- Report suspicious activity to admin
```

## ✅ Final Checklist

Before going live with students:

- [ ] @supabase/auth-helpers-nextjs installed
- [ ] All environment variables set in hosting platform
- [ ] Middleware.js is working (test protected routes)
- [ ] RLS enabled on all Supabase tables
- [ ] Security headers verified (A rating)
- [ ] SSL/HTTPS working (A rating)
- [ ] Authentication flow tested completely
- [ ] Rate limiting tested
- [ ] Input validation tested
- [ ] File upload restrictions tested
- [ ] Admin panel only accessible to admins
- [ ] Error messages don't leak sensitive info
- [ ] Backup system in place
- [ ] Monitoring tools configured
- [ ] Incident response plan documented

## 🎓 For Your Students

Create a "Security Tips" page with:

1. **Password Security**
   - Use at least 8 characters
   - Mix uppercase, lowercase, numbers
   - Don't reuse passwords from other sites

2. **Account Safety**
   - Never share your credentials
   - Log out after use
   - Report suspicious emails/messages

3. **Data Privacy**
   - We never ask for passwords via email
   - Your data is encrypted
   - We follow GDPR/privacy best practices

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review browser console errors
4. Check this guide's troubleshooting section

**Good luck with your launch! 🚀**
