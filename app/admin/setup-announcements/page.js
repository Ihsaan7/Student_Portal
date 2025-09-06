'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function SetupAnnouncementsPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const createAnnouncementsTable = async () => {
    setLoading(true);
    setStatus('Creating announcements table...');

    const sql = `
      -- Create announcements table for course admin panel
      CREATE TABLE IF NOT EXISTS announcements (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        course_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id),
        target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'instructors'))
      );
    `;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) throw error;
      setStatus(prev => prev + '\n✅ Announcements table created successfully!');
    } catch (error) {
      console.error('Error creating table:', error);
      setStatus(prev => prev + `\n❌ Error creating table: ${error.message}`);
    }
    setLoading(false);
  };

  const createIndexes = async () => {
    setLoading(true);
    setStatus(prev => prev + '\nCreating indexes...');

    const sql = `
      -- Create index for better performance
      CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON announcements(course_id);
      CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active) WHERE is_active = true;
    `;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) throw error;
      setStatus(prev => prev + '\n✅ Indexes created successfully!');
    } catch (error) {
      console.error('Error creating indexes:', error);
      setStatus(prev => prev + `\n❌ Error creating indexes: ${error.message}`);
    }
    setLoading(false);
  };

  const createPolicies = async () => {
    setLoading(true);
    setStatus(prev => prev + '\nSetting up security policies...');

    const sql = `
      -- Enable Row Level Security
      ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Allow read access to announcements" ON announcements
        FOR SELECT USING (is_active = true);
      
      CREATE POLICY "Allow admin full access to announcements" ON announcements
        FOR ALL USING (true);
    `;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) throw error;
      setStatus(prev => prev + '\n✅ Security policies created successfully!');
    } catch (error) {
      console.error('Error creating policies:', error);
      setStatus(prev => prev + `\n❌ Error creating policies: ${error.message}`);
    }
    setLoading(false);
  };

  const createTrigger = async () => {
    setLoading(true);
    setStatus(prev => prev + '\nCreating update trigger...');

    const sql = `
      -- Function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_announcements_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Create trigger for updated_at
      CREATE TRIGGER announcements_updated_at_trigger
        BEFORE UPDATE ON announcements
        FOR EACH ROW
        EXECUTE FUNCTION update_announcements_updated_at();
    `;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) throw error;
      setStatus(prev => prev + '\n✅ Update trigger created successfully!');
    } catch (error) {
      console.error('Error creating trigger:', error);
      setStatus(prev => prev + `\n❌ Error creating trigger: ${error.message}`);
    }
    setLoading(false);
  };

  const insertSampleData = async () => {
    setLoading(true);
    setStatus(prev => prev + '\nInserting sample announcements...');

    const sql = `
      -- Insert sample announcements
      INSERT INTO announcements (course_id, title, content, priority, created_by) VALUES
      ('CS101', 'Welcome to Computer Science 101', 'Welcome to our introductory computer science course. Please review the syllabus and course materials.', 'high', (SELECT id FROM auth.users LIMIT 1)),
      ('CS101', 'Assignment 1 Released', 'The first programming assignment has been released. Due date is next Friday.', 'normal', (SELECT id FROM auth.users LIMIT 1)),
      ('MATH201', 'Midterm Exam Schedule', 'The midterm exam is scheduled for next week. Please check the detailed schedule in the course materials.', 'high', (SELECT id FROM auth.users LIMIT 1))
      ON CONFLICT (id) DO NOTHING;
    `;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) throw error;
      setStatus(prev => prev + '\n✅ Sample data inserted successfully!');
    } catch (error) {
      console.error('Error inserting sample data:', error);
      setStatus(prev => prev + `\n❌ Error inserting sample data: ${error.message}`);
    }
    setLoading(false);
  };

  const setupAll = async () => {
    setStatus('Starting complete announcements setup...');
    await createAnnouncementsTable();
    await createIndexes();
    await createPolicies();
    await createTrigger();
    await insertSampleData();
    setStatus(prev => prev + '\n\n🎉 Announcements system setup complete! You can now use the Course Admin Panel.');
  };

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing announcements table...');

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .limit(5);

      if (error) throw error;
      setStatus(prev => prev + `\n✅ Table test successful! Found ${data.length} announcements.`);
    } catch (error) {
      console.error('Error testing table:', error);
      setStatus(prev => prev + `\n❌ Table test failed: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Setup Announcements System</h1>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Database Setup Required</h2>
            <p className="text-yellow-700">
              The announcements table doesn't exist yet, which is causing the console error in CourseAdminPanel. 
              Use the buttons below to set up the database tables and resolve the issue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={createAnnouncementsTable}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Table'}
            </button>
            
            <button
              onClick={createIndexes}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Indexes'}
            </button>
            
            <button
              onClick={createPolicies}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Setting up...' : 'Setup Security'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={createTrigger}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Trigger'}
            </button>
            
            <button
              onClick={insertSampleData}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Inserting...' : 'Add Sample Data'}
            </button>
            
            <button
              onClick={testConnection}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Testing...' : 'Test Table'}
            </button>
          </div>

          <div className="mb-6">
            <button
              onClick={setupAll}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
            >
              {loading ? 'Setting up...' : '🚀 Complete Setup (All Steps)'}
            </button>
          </div>

          {status && (
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Setup Status:</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{status}</pre>
            </div>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Manual Setup Alternative</h3>
            <p className="text-blue-700 mb-2">
              If the automated setup doesn't work, you can manually run the SQL from <code>create-announcements-table.sql</code> in your Supabase SQL Editor.
            </p>
            <p className="text-blue-700">
              After setup, the console error "Error loading announcements" will be resolved and the Course Admin Panel will work properly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}