'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

const FixHandoutsPage = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const executeSQL = async (sqlCommand, description) => {
    try {
      setLoading(true);
      setStatus(`Executing: ${description}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: sqlCommand
      });
      
      if (error) {
        // Try direct query if RPC doesn't work
        const { data: directData, error: directError } = await supabase
          .from('handouts')
          .select('*')
          .limit(1);
          
        if (directError) {
          throw error;
        }
        
        // If we can query handouts, try to add the column directly
        const { error: alterError } = await supabase
          .rpc('exec_sql', { sql: sqlCommand });
          
        if (alterError) {
          throw alterError;
        }
      }
      
      setStatus(`✅ ${description} completed successfully`);
      return { success: true, data };
    } catch (error) {
      setStatus(`❌ ${description} failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const fixHandoutStatus = async () => {
    setLoading(true);
    setResults([]);
    
    const steps = [
      {
        sql: "ALTER TABLE handouts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));",
        description: "Adding status column to handouts table"
      },
      {
        sql: `UPDATE handouts 
              SET status = CASE 
                  WHEN is_approved = true THEN 'approved'
                  WHEN is_approved = false AND approved_by IS NOT NULL THEN 'rejected'
                  ELSE 'pending'
              END
              WHERE status = 'pending';`,
        description: "Updating existing handout statuses"
      },
      {
        sql: "CREATE INDEX IF NOT EXISTS idx_handouts_status ON handouts(status);",
        description: "Creating index on status column"
      }
    ];
    
    const stepResults = [];
    
    for (const step of steps) {
      const result = await executeSQL(step.sql, step.description);
      stepResults.push({
        description: step.description,
        success: result.success,
        error: result.error
      });
      
      // Add delay between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setResults(stepResults);
    setLoading(false);
  };

  const testQuery = async () => {
    try {
      setLoading(true);
      setStatus('Testing handout query...');
      
      const { data, error } = await supabase
        .from('handouts')
        .select(`
          id,
          title,
          status,
          is_approved,
          created_at,
          lectures(
            course_code,
            lecture_number,
            title
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      setStatus('✅ Query successful');
      setResults(data);
    } catch (error) {
      setStatus(`❌ Query failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Fix Handout Approval System</h1>
          
          <div className="space-y-4 mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">What this fix does:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Adds a 'status' column to track pending, approved, and rejected handouts</li>
                <li>• Updates existing handouts to use the new status system</li>
                <li>• Fixes the issue where rejected handouts still appear in the approval panel</li>
              </ul>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={fixHandoutStatus}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Fixing...' : 'Fix Handout Status System'}
              </button>
              
              <button
                onClick={testQuery}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test Handout Query'}
              </button>
            </div>
          </div>
          
          {status && (
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm font-mono">{status}</p>
            </div>
          )}
          
          {results && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Results:</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Manual SQL Alternative:</h3>
            <p className="text-sm text-blue-700 mb-3">
              If the automatic fix doesn't work, you can manually execute these commands in your Supabase SQL Editor:
            </p>
            <div className="bg-white border rounded p-3 text-xs font-mono text-gray-700">
              <div>ALTER TABLE handouts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));</div>
              <br />
              <div>UPDATE handouts SET status = CASE WHEN is_approved = true THEN 'approved' WHEN is_approved = false AND approved_by IS NOT NULL THEN 'rejected' ELSE 'pending' END WHERE status = 'pending';</div>
              <br />
              <div>CREATE INDEX IF NOT EXISTS idx_handouts_status ON handouts(status);</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixHandoutsPage;