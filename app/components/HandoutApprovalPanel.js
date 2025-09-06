'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const HandoutApprovalPanel = ({ user }) => {
  const [pendingHandouts, setPendingHandouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingHandouts();
  }, []);

  const fetchPendingHandouts = async () => {
    try {
      setLoading(true);
      
      // Simple query without complex joins
      const { data: handoutsData, error: handoutsError } = await supabase
        .from('handouts')
        .select(`
          *,
          lectures(
            course_code,
            lecture_number,
            title
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (handoutsError) throw handoutsError;

      // Add dummy uploader info for now (we can enhance this later)
      const processedHandouts = (handoutsData || []).map(handout => ({
        ...handout,
        lecture: handout.lectures,
        uploader: {
          name: 'Student',
          email: 'student@example.com'
        }
      }));

      setPendingHandouts(processedHandouts);
    } catch (err) {
      console.error('Error fetching pending handouts:', err);
      setError('Failed to load pending handouts');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (handoutId, approved) => {
    try {
      setProcessingId(handoutId);
      
      const newStatus = approved ? 'approved' : 'rejected';
      
      const updateData = {
        status: newStatus,
        is_approved: approved,
        approved_by: user.id,
        approved_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('handouts')
        .update(updateData)
        .eq('id', handoutId);

      if (error) throw error;

      // Remove from pending list
      setPendingHandouts(prev => prev.filter(h => h.id !== handoutId));
      
      // Show success message
      alert(`Handout ${approved ? 'approved' : 'rejected'} successfully!`);
    } catch (err) {
      console.error('Error processing handout:', err);
      alert('Failed to process handout. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const downloadFile = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-red-600 text-center">
          <p>{error}</p>
          <button 
            onClick={fetchPendingHandouts}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Handout Approval Queue</h2>
        <div className="flex items-center space-x-2">
          <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2 py-1 rounded">
            {pendingHandouts.length} pending
          </span>
          <button
            onClick={fetchPendingHandouts}
            className="text-gray-400 hover:text-gray-600"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {pendingHandouts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">All caught up!</p>
          <p className="text-sm">No handouts pending approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingHandouts.map((handout) => (
            <div key={handout.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{handout.title}</h3>
                      <p className="text-sm text-gray-600">
                        {handout.lecture?.course_code} - Lecture {handout.lecture?.lecture_number}: {handout.lecture?.title}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Uploaded by</p>
                      <p className="text-sm text-gray-900">{handout.uploader?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{handout.uploader?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">File Details</p>
                      <p className="text-sm text-gray-900">{formatFileSize(handout.file_size)}</p>
                      <p className="text-xs text-gray-500">{handout.file_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Upload Date</p>
                      <p className="text-sm text-gray-900">
                        {new Date(handout.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(handout.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadFile(handout.file_url, handout.file_name)}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors"
                  >
                    📄 Preview/Download
                  </button>
                  {handout.file_url && (
                    <a
                      href={handout.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Open in new tab →
                    </a>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApproval(handout.id, false)}
                    disabled={processingId === handout.id}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === handout.id ? (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      '❌ Reject'
                    )}
                  </button>
                  <button
                    onClick={() => handleApproval(handout.id, true)}
                    disabled={processingId === handout.id}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === handout.id ? (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      '✅ Approve'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HandoutApprovalPanel;