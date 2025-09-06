# VU Student Portal Clone

This is a [Next.js](https://nextjs.org) project that replicates a university student portal with authentication, course management, and dashboard features.

## Quick Start

### 1. Environment Setup
Create a `.env.local` file with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Database Setup
Run the SQL script to set up your database:
```sql
-- Execute the contents of complete-database-setup.sql in your Supabase SQL editor
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔧 Troubleshooting Network Issues

If you're experiencing "Failed to fetch" errors or login issues:

### Quick Diagnosis
1. **Run the automated fixer:**
   ```bash
   node fix-network-issues.js
   ```

2. **Visit the test page:** Navigate to `/test-connection` in your browser for live connectivity testing

3. **Check network status:** The login page shows real-time connection status

### Common Issues & Solutions

#### "Failed to fetch" during login
- ✅ **Auto-retry:** The app automatically retries failed requests 3 times
- ✅ **Network detection:** Real-time network status monitoring
- ✅ **Enhanced errors:** Detailed error messages with troubleshooting tips

#### Environment configuration issues
- Run `node fix-network-issues.js` to check configuration
- Verify `.env.local` file exists and contains correct Supabase credentials
- Restart development server after environment changes

#### Connectivity problems
- Check the network indicator on the login page
- Visit `/test-connection` for comprehensive diagnostics
- Review `NETWORK_TROUBLESHOOTING.md` for detailed solutions

### Enhanced Features
- 🔄 **Automatic retry logic** for network failures
- 🌐 **Real-time network status** indicators
- 🔍 **Comprehensive connectivity testing** at `/test-connection`
- 📊 **Network performance metrics** (speed, latency, connection type)
- 🛠️ **Automated troubleshooting** tools and scripts

## 📁 Project Structure

```
├── app/
│   ├── components/          # Reusable UI components
│   ├── home/               # Dashboard/home page
│   ├── login/              # Authentication page
│   ├── test-connection/    # Network diagnostics page
│   └── providers.js        # App-wide providers
├── lib/
│   ├── supabase.js         # Supabase client configuration
│   └── networkUtils.js     # Network utility functions
├── complete-database-setup.sql    # Database setup script
├── NETWORK_TROUBLESHOOTING.md     # Detailed troubleshooting guide
├── TROUBLESHOOTING.md             # General troubleshooting
└── fix-network-issues.js          # Automated issue detection
```

## 🚀 Features

- **Authentication:** Secure login with Supabase Auth
- **Admin Panel:** Complete administrative interface with role-based access
- **Dashboard:** Student course overview and management
- **User Management:** Admin tools for managing users and roles
- **Network Resilience:** Automatic retry logic and connectivity monitoring
- **Real-time Status:** Live network and connection indicators
- **Comprehensive Testing:** Built-in diagnostics and troubleshooting tools
- **Error Handling:** Enhanced error messages with actionable solutions
- **System Analytics:** Dashboard with statistics and admin logs

## 📚 Documentation

- **`NETWORK_TROUBLESHOOTING.md`** - Complete guide for resolving network issues
- **`TROUBLESHOOTING.md`** - General application troubleshooting
- **`complete-database-setup.sql`** - Database schema and setup instructions
- **`ADMIN_SETUP_GUIDE.md`** - Step-by-step admin panel setup instructions

## 🔐 Admin Panel

The VU Clone includes a comprehensive admin panel with role-based access control:

### Admin Roles
- **Student** (default): Regular user access
- **Admin**: Can manage users, support queries, and view courses
- **Super Admin**: Full system access including settings and admin management

### Admin Features
- **Dashboard**: System overview with statistics
- **User Management**: View, edit roles, and manage users
- **Support Management**: Handle support queries and responses
- **Course Management**: View course analytics and enrollments
- **System Settings**: Configure system parameters (super admin only)
- **Admin Logs**: Track administrative actions

### Quick Admin Setup

1. **Run the setup script**:
   ```bash
   node setup-admin.js
   ```

2. **Set up database**:
   - Copy content from `admin-setup.sql`
   - Run in Supabase SQL Editor

3. **Create first admin**:
   ```sql
   UPDATE users SET role = 'super_admin' WHERE email = 'your-email@domain.com';
   ```

4. **Access admin panel**:
   - Login with admin account
   - You'll be redirected to `/admin`

For detailed setup instructions, see [ADMIN_SETUP_GUIDE.md](./ADMIN_SETUP_GUIDE.md)

## 🔧 Utilities

- **`fix-network-issues.js`** - Automated configuration checker and fixer
- **`/test-connection`** - Live network connectivity testing page
- **`network-test.js`** - Browser console network testing script
- **`setup-admin.js`** - Interactive guide for setting up the admin panel
- **`admin-setup.sql`** - Database setup for admin functionality

## 🛠️ Tech Stack

- **Framework:** Next.js 14 with App Router
- **Authentication:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Network Utils:** Custom connectivity monitoring

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🚀 Deployment

1. Set up your Supabase project
2. Configure environment variables in your hosting platform
3. Run database setup script in Supabase SQL editor
4. Deploy to Vercel, Netlify, or your preferred platform

For detailed deployment instructions, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
