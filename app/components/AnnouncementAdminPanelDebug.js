"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AnnouncementAdminPanelDebug() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebugInfo = (info) => {
    console.log('DEBUG:', info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      addDebugInfo('Starting to fetch announcements...');
      
      // Test basic connection first
      addDebugInfo('Testing basic Supabase connection...');
      const connectionTest = await supabase.from('announcements').select('count');
      addDebugInfo(`Connection test result: ${JSON.stringify(connectionTest)}`);
      
      addDebugInfo('Executing main announcements query...');
      const { data, error, status, statusText } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      addDebugInfo(`Query completed with status: ${status} (${statusText})`);
      
      if (error) {
        addDebugInfo(`Error details: ${JSON.stringify(error, null, 2)}`);
        throw error;
      }
      
      addDebugInfo(`Successfully fetched ${data?.length || 0} announcements`);
      if (data && data.length > 0) {
        addDebugInfo(`Sample announcement: ${JSON.stringify(data[0], null, 2)}`);
      }
      
      setAnnouncements(data || []);
      setError(null);
    } catch (error) {
      addDebugInfo(`Catch block: ${JSON.stringify(error, null, 2)}`);
      console.error('Error fetching announcements:', error);
      setError(error);
    } finally {
      setLoading(false);
      addDebugInfo('Fetch operation completed');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Announcements Debug Panel</h2>
      
      {/* Debug Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Debug Information</h3>
        <div className="max-h-60 overflow-y-auto">
          {debugInfo.map((info, index) => (
            <div key={index} className="text-sm text-gray-600 mb-1">
              {info}
            </div>
          ))}
        </div>
        <button
          onClick={() => setDebugInfo([])}
          className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
        >
          Clear Debug Info
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Details</h3>
          <pre className="text-sm text-red-700 overflow-x-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}

      {/* Retry Button */}
      <div className="mb-6">
        <button
          onClick={fetchAnnouncements}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
        >
          Retry Fetch
        </button>
      </div>

      {/* Announcements Display */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Announcements ({announcements.length})
        </h3>
        
        {announcements.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No announcements found.</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-md font-medium text-gray-900">{announcement.title}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  announcement.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {announcement.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p className="text-gray-600 mb-3">{announcement.content}</p>
              
              <div className="text-sm text-gray-500">
                <div>ID: {announcement.id}</div>
                <div>Created: {new Date(announcement.created_at).toLocaleString()}</div>
                {announcement.updated_at && announcement.updated_at !== announcement.created_at && (
                  <div>Updated: {new Date(announcement.updated_at).toLocaleString()}</div>
                )}
                {announcement.video_url && (
                  <div>Video URL: {announcement.video_url}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
