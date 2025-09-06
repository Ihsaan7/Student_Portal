import { supabase } from '../lib/supabase';

// Function to execute SQL commands through Supabase
export async function executeSQL(sqlCommand) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_command: sqlCommand
    });
    
    if (error) {
      console.error('SQL execution error:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: err };
  }
}

// Function to create announcements table
export async function createAnnouncementsTable() {
  const createTableSQL = `
    -- Create announcements table
    CREATE TABLE IF NOT EXISTS announcements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id)
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON announcements(course_id);
    CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
    CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
    
    -- Enable RLS
    ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view active announcements" ON announcements
      FOR SELECT USING (is_active = true);
    
    CREATE POLICY "Admins can manage all announcements" ON announcements
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('admin', 'super_admin')
        )
      );
  `;
  
  try {
    // Execute the SQL directly using Supabase client
    const { error } = await supabase.from('announcements').select('id').limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, we need to create it
      console.log('Announcements table does not exist. Please create it manually in Supabase SQL Editor.');
      console.log('SQL to execute:');
      console.log(createTableSQL);
      return { success: false, error: 'Table does not exist - manual creation required' };
    }
    
    return { success: true, message: 'Announcements table exists' };
  } catch (err) {
    console.error('Error checking announcements table:', err);
    return { success: false, error: err };
  }
}