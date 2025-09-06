# Database Setup Guide for AI Chatbot

This guide will help you set up the required database table for the AI chatbot functionality.

## Quick Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Sign in to your account
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Setup Script**
   - Copy the contents of `database/ai_chat_history.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

### Option 2: Using Local Development

If you're running Supabase locally:

```bash
# Navigate to your project directory
cd your-project-directory

# Run the SQL script
psql -h localhost -p 54322 -U postgres -d postgres -f database/ai_chat_history.sql
```

## Verification

To verify the table was created successfully:

1. **Check in Supabase Dashboard**
   - Go to "Table Editor"
   - Look for `ai_chat_history` table

2. **Test the AI Chat**
   - Navigate to `/ai-chat` in your application
   - Send a test message
   - Check if the message appears in the chat history

## Troubleshooting

### Error: "relation 'ai_chat_history' does not exist"

**Solution:** The database table hasn't been created yet.
- Follow the setup steps above
- Make sure you're connected to the correct database
- Verify the SQL script ran without errors

### Error: "permission denied for table ai_chat_history"

**Solution:** Row Level Security (RLS) policies need to be properly configured.
- The setup script includes RLS policies
- Make sure users are properly authenticated
- Check that `auth.uid()` returns the correct user ID

### Error: "column 'user_id' does not exist"

**Solution:** The table structure is incomplete.
- Drop the existing table: `DROP TABLE IF EXISTS ai_chat_history;`
- Re-run the complete setup script

## Table Structure

The `ai_chat_history` table includes:

- `id` - Primary key (auto-increment)
- `user_id` - Foreign key to auth.users
- `message` - The chat message content
- `sender` - Either 'user' or 'ai'
- `file_info` - JSON metadata for uploaded files
- `created_at` - Timestamp when message was created
- `updated_at` - Timestamp when message was last updated

## Security Features

- **Row Level Security (RLS)** - Users can only access their own chat history
- **Foreign Key Constraints** - Ensures data integrity with user accounts
- **Input Validation** - Sender field is restricted to 'user' or 'ai'

## Need Help?

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase connection in the Network tab
3. Ensure your `.env.local` file has the correct Supabase credentials
4. Check the Supabase logs in your dashboard

For additional support, refer to the [Supabase Documentation](https://supabase.com/docs) or the main project README.