"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { performConnectivityCheck, addNetworkListeners } from "../../lib/networkUtils";

export default function TestConnection() {
  const [connectionStatus, setConnectionStatus] = useState("Testing...");
  const [details, setDetails] = useState({});
  const [networkStatus, setNetworkStatus] = useState("online");
  const [connectivityReport, setConnectivityReport] = useState(null);

  useEffect(() => {
    testConnection();
    
    // Add network event listeners
    const cleanup = addNetworkListeners(
      () => {
        setNetworkStatus("online");
        console.log("Network came back online");
      },
      () => {
        setNetworkStatus("offline");
        console.log("Network went offline");
      }
    );
    
    return cleanup;
  }, []);

  const testConnection = async () => {
    try {
      // Perform comprehensive connectivity check
      const connectivityResults = await performConnectivityCheck();
      setConnectivityReport(connectivityResults);
      
      // Test 1: Check if environment variables are loaded
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      setDetails(prev => ({
        ...prev,
        envVars: {
          url: url ? "✓ Loaded" : "✗ Missing",
          key: key ? "✓ Loaded" : "✗ Missing",
          urlValue: url,
          keyLength: key ? key.length : 0
        }
      }));

      if (!url || !key) {
        setConnectionStatus("❌ Environment variables missing");
        return;
      }

      // Check network connectivity first
      if (!connectivityResults.browserOnline) {
        setConnectionStatus("❌ Browser reports offline");
        return;
      }

      if (!connectivityResults.internetConnectivity) {
        setConnectionStatus("❌ No internet connectivity");
        return;
      }

      if (!connectivityResults.supabaseConnectivity) {
        setConnectionStatus("❌ Cannot reach Supabase servers");
        return;
      }

      // Test 2: Basic Supabase connection
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setConnectionStatus(`❌ Supabase connection failed: ${error.message}`);
        setDetails(prev => ({ ...prev, authError: error }));
        return;
      }

      setConnectionStatus("✅ Supabase connection successful");
      setDetails(prev => ({ ...prev, session: data.session ? "Active session" : "No active session" }));

      // Test 3: Try a simple database query
      try {
        const { data: testData, error: dbError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        if (dbError) {
          setDetails(prev => ({ ...prev, dbTest: `Database error: ${dbError.message}` }));
        } else {
          setDetails(prev => ({ ...prev, dbTest: "✅ Database accessible" }));
        }
      } catch (dbErr) {
        setDetails(prev => ({ ...prev, dbTest: `Database test failed: ${dbErr.message}` }));
      }

    } catch (error) {
      setConnectionStatus(`❌ Connection test failed: ${error.message}`);
      setDetails(prev => ({ ...prev, generalError: error.message }));
    }
  };

  const retryConnection = () => {
    setConnectionStatus("Testing...");
    setDetails({});
    setConnectivityReport(null);
    testConnection();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Supabase Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Network Status</h2>
          <p className={`text-lg mb-4 ${networkStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
            {networkStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className={`text-lg mb-4 ${connectionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {connectionStatus}
          </p>
          <button 
            onClick={retryConnection}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry Test
          </button>
        </div>

        {connectivityReport && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Connectivity Report</h2>
            <div className="bg-gray-100 p-4 rounded text-sm">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>Browser Online: {connectivityReport.browserOnline ? '✅' : '❌'}</div>
                <div>Internet: {connectivityReport.internetConnectivity ? '✅' : '❌'}</div>
                <div>Supabase: {connectivityReport.supabaseConnectivity ? '✅' : '❌'}</div>
                <div>Connection Type: {connectivityReport.networkInfo.effectiveType}</div>
              </div>
              {connectivityReport.networkInfo.downlink && (
                <div>Download Speed: ~{connectivityReport.networkInfo.downlink} Mbps</div>
              )}
              {connectivityReport.networkInfo.rtt && (
                <div>Latency: ~{connectivityReport.networkInfo.rtt}ms</div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Detailed Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Check if your internet connection is working</li>
            <li>Verify Supabase project is active and not paused</li>
            <li>Confirm environment variables are correct</li>
            <li>Check if Supabase service is experiencing outages</li>
            <li>Try accessing your Supabase dashboard directly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}