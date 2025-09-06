'use client';

import { useState } from 'react';
import { createAnnouncementsTable } from '../../../utils/executeSQL';
import { supabase } from '../../../lib/supabase';

export default function AdminSetup() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateTable = async () => {
    setLoading(true);
    setStatus('Checking announcements table...');
    
    try {
      const result = await createAnnouncementsTable();
      if (result.success) {
        setStatus('✅ Announcements table is ready!');
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setStatus(`❌ Unexpected error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const testAnnouncementsQuery = async () => {
    setLoading(true);
    setStatus('Testing announcements query...');
    
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .limit(5);
      
      if (error) {
        setStatus(`❌ Query error: ${error.message}`);
      } else {
        setStatus(`✅ Query successful! Found ${data.length} announcements.`);
      }
    } catch (error) {
      setStatus(`❌ Unexpected error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const createSampleAnnouncement = async () => {
    setLoading(true);
    setStatus('Creating sample announcement...');
    
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert([
          {
            course_id: 'CS101',
            title: 'Test Announcement',
            content: 'This is a test announcement created by the admin setup utility.',
            priority: 'normal',
            is_active: true
          }
        ])
        .select();
      
      if (error) {
        setStatus(`❌ Insert error: ${error.message}`);
      } else {
        setStatus(`✅ Sample announcement created successfully!`);
      }
    } catch (error) {
      setStatus(`❌ Unexpected error: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Setup Utility</h1>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Important Notice</h2>
              <p className="text-yellow-700">
                If the announcements table doesn't exist, you'll need to create it manually in your Supabase SQL Editor.
                Copy and paste the contents of <code>create-announcements-table.sql</code> into the SQL Editor and run it.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleCreateTable}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Checking...' : 'Check Table Status'}
              </button>
              
              <button
                onClick={testAnnouncementsQuery}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Testing...' : 'Test Query'}
              </button>
              
              <button
                onClick={createSampleAnnouncement}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create Sample'}
              </button>
            </div>
            
            {status && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Status:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{status}</p>
              </div>
            )}
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Manual SQL Setup</h3>
              <p className="text-blue-700 mb-2">
                If you need to create the announcements table manually, copy this SQL to your Supabase SQL Editor:
              </p>
              <div className="bg-white border rounded p-3 text-sm font-mono overflow-x-auto">
                <pre>{`-- Create announcements table
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
  );`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}