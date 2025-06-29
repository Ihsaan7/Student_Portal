"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function TestSupabase() {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, data = null) => {
    setTestResults(prev => [...prev, { message, data, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setTestResults([]);
    setLoading(true);

    try {
      // Test 1: Check environment variables
      addResult("1. Environment Variables Check");
      addResult("   Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      addResult("   Supabase Key Present:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      // Test 2: Check Supabase client
      addResult("2. Supabase Client Check");
      addResult("   Client created:", !!supabase);
      addResult("   Client URL:", supabase.supabaseUrl);

      // Test 3: Test basic query
      addResult("3. Testing basic query...");
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      addResult("   Test query result:", { data: testData, error: testError });

      // Test 4: Check table structure
      addResult("4. Checking table structure...");
      const { data: structureData, error: structureError } = await supabase
        .from('users')
        .select('*')
        .limit(0);
      
      addResult("   Structure check result:", { error: structureError });

      // Test 5: Try to insert a test record
      addResult("5. Testing insert operation...");
      const testUser = {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Test User',
        email: 'test@example.com',
        programme: 'Test Programme'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([testUser])
        .select();

      addResult("   Insert test result:", { data: insertData, error: insertError });

      // Test 6: Check RLS status
      addResult("6. Checking RLS status...");
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('get_rls_status', { table_name: 'users' })
        .catch(() => ({ data: null, error: 'RPC function not available' }));

      addResult("   RLS check result:", { data: rlsData, error: rlsError });

    } catch (error) {
      addResult("ERROR:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
        
        <button
          onClick={runTests}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium mb-6 disabled:opacity-50"
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="border-b border-gray-200 pb-2">
                <div className="font-medium text-gray-900">{result.message}</div>
                {result.data && (
                  <pre className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
                <div className="text-xs text-gray-400 mt-1">{result.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 