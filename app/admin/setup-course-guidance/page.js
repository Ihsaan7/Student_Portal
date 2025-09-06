'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminMiddleware from '../../../components/AdminMiddleware';

const SetupCourseGuidancePage = ({ adminData }) => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const executeSQL = async (sql, description) => {
    try {
      setStatus(`Executing: ${description}...`);
      const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
      
      if (error) {
        throw error;
      }
      
      setStatus(`✅ ${description} completed successfully`);
      return true;
    } catch (err) {
      setStatus(`❌ ${description} failed: ${err.message}`);
      throw err;
    }
  };

  const setupCourseGuidance = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Step 1: Create course_guidance table
      await executeSQL(`
        CREATE TABLE IF NOT EXISTS course_guidance (
          id SERIAL PRIMARY KEY,
          course_code VARCHAR(10) NOT NULL,
          title VARCHAR(255) DEFAULT 'How to Attempt this Course',
          main_video_url TEXT,
          youtube_video_id VARCHAR(50),
          video_duration INTEGER DEFAULT 0,
          guidance_points JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(course_code)
        );
      `, 'Create course_guidance table');

      // Step 2: Create indexes
      await executeSQL(`
        CREATE INDEX IF NOT EXISTS idx_course_guidance_course_code ON course_guidance(course_code);
      `, 'Create course_code index');

      // Step 3: Create get_course_guidance function
      await executeSQL(`
        CREATE OR REPLACE FUNCTION get_course_guidance(p_course_code VARCHAR)
        RETURNS TABLE (
          id INTEGER,
          course_code VARCHAR,
          title VARCHAR,
          main_video_url TEXT,
          youtube_video_id VARCHAR,
          video_duration INTEGER,
          guidance_points JSONB,
          created_at TIMESTAMP WITH TIME ZONE,
          updated_at TIMESTAMP WITH TIME ZONE
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            cg.id,
            cg.course_code,
            cg.title,
            cg.main_video_url,
            cg.youtube_video_id,
            cg.video_duration,
            cg.guidance_points,
            cg.created_at,
            cg.updated_at
          FROM course_guidance cg
          WHERE cg.course_code = p_course_code;
        END;
        $$;
      `, 'Create get_course_guidance function');

      // Step 4: Insert sample data for CS201
      await executeSQL(`
        INSERT INTO course_guidance (course_code, title, guidance_points)
        VALUES (
          'CS201',
          'How to Attempt this Course',
          '[
            {"point": "Start with the fundamentals and build your understanding step by step"},
            {"point": "Practice coding exercises regularly to reinforce concepts"},
            {"point": "Join study groups and participate in discussions"},
            {"point": "Complete all assignments on time and seek help when needed"}
          ]'::jsonb
        )
        ON CONFLICT (course_code) DO NOTHING;
      `, 'Insert sample data for CS201');

      setSuccess('Course guidance system setup completed successfully! You can now manage course guidance content from the admin panel.');
      
    } catch (err) {
      console.error('Setup failed:', err);
      setError(`Setup failed: ${err.message}`);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const testQuery = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      setStatus('Testing course guidance query...');
      const { data, error } = await supabase
        .from('course_guidance')
        .select('*')
        .eq('course_code', 'CS201');
      
      if (error) {
        throw error;
      }
      
      setSuccess(`Test successful! Found ${data.length} course guidance record(s) for CS201.`);
      console.log('Course guidance data:', data);
      
    } catch (err) {
      console.error('Test failed:', err);
      setError(`Test failed: ${err.message}`);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Setup Course Guidance System</h1>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              This utility will set up the course guidance system by creating the necessary database tables and functions.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">What this will do:</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Create the <code>course_guidance</code> table</li>
                <li>• Add indexes for performance</li>
                <li>• Create the <code>get_course_guidance</code> function</li>
                <li>• Insert sample data for CS201</li>
              </ul>
            </div>
          </div>

          {/* Status Messages */}
          {status && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800">
              {status}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800">
              {success}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={setupCourseGuidance}
              disabled={loading}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Setting up...' : 'Setup Course Guidance System'}
            </button>
            
            <button
              onClick={testQuery}
              disabled={loading}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Testing...' : 'Test Course Guidance Query'}
            </button>
          </div>

          {/* Manual SQL Alternative */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual SQL Alternative</h3>
            <p className="text-gray-600 mb-4">
              If the automated setup doesn't work, you can manually execute these SQL commands in your Supabase SQL Editor:
            </p>
            
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm text-gray-800">
{`-- Create course_guidance table
CREATE TABLE IF NOT EXISTS course_guidance (
  id SERIAL PRIMARY KEY,
  course_code VARCHAR(10) NOT NULL,
  title VARCHAR(255) DEFAULT 'How to Attempt this Course',
  main_video_url TEXT,
  youtube_video_id VARCHAR(50),
  video_duration INTEGER DEFAULT 0,
  guidance_points JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_code)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_course_guidance_course_code ON course_guidance(course_code);

-- Insert sample data
INSERT INTO course_guidance (course_code, title, guidance_points)
VALUES (
  'CS201',
  'How to Attempt this Course',
  '[{"point": "Start with the fundamentals"}, {"point": "Practice regularly"}]'::jsonb
) ON CONFLICT (course_code) DO NOTHING;`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SetupCourseGuidancePageWrapper = () => {
  return (
    <AdminMiddleware>
      {(adminData) => <SetupCourseGuidancePage adminData={adminData} />}
    </AdminMiddleware>
  );
};

export default SetupCourseGuidancePageWrapper;