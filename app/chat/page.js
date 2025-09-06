"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [queries, setQueries] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [fileInputRef] = useState(useRef(null));
  const queriesEndRef = useRef(null);

  // Load user and queries on component mount
  useEffect(() => {
    const loadUserAndQueries = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No user found');
          return;
        }
        setUser(user);

        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);

        // Check if storage bucket exists
        await checkStorageBucket();

        // Test database access
        await testDatabaseAccess();

        // Load user's queries
        await loadQueries(user.id);

      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndQueries();
  }, []);

  // Check if storage bucket exists
  const checkStorageBucket = async () => {
    try {
      console.log('Checking storage buckets...');
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error checking storage buckets:', error);
        return;
      }
      
      console.log('All available buckets:', data);
      
      const supportBucket = data.find(bucket => bucket.id === 'support-files');
      if (!supportBucket) {
        console.warn('Support files bucket not found in list. Available buckets:', data.map(b => b.id));
        
        // Try to access the bucket directly to see if it exists
        try {
          const { data: testFiles, error: testError } = await supabase.storage
            .from('support-files')
            .list('', { limit: 1 });
          
          if (testError) {
            console.error('Direct bucket access failed:', testError);
            alert('Storage bucket not configured. Please run the SQL setup script in Supabase first.');
          } else {
            console.log('Direct bucket access successful:', testFiles);
            console.log('Support files bucket exists and is accessible');
          }
        } catch (directError) {
          console.error('Direct bucket test failed:', directError);
          alert('Storage bucket not configured. Please run the SQL setup script in Supabase first.');
        }
      } else {
        console.log('Support files bucket found:', supportBucket);
      }
    } catch (error) {
      console.error('Error checking storage:', error);
    }
  };

  // Test database connection and table access
  const testDatabaseAccess = async () => {
    try {
      console.log('Testing database access...');
      
      // Skip test if user is not loaded yet
      if (!user || !user.id) {
        console.log('User not loaded yet, skipping database test');
        return;
      }
      
      // Test if we can read from support_queries table
      const { data: testData, error: testError } = await supabase
        .from('support_queries')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Error accessing support_queries table:', testError);
        alert('Cannot access support_queries table. Please check your database setup.');
      } else {
        console.log('Database access successful');
      }
      
      // Test if we can insert into support_queries table
      const { data: insertTest, error: insertError } = await supabase
        .from('support_queries')
        .insert({
          user_id: user.id,
          user_name: userProfile?.name || user.email,
          user_email: user.email,
          query_text: 'Test query - will be deleted',
          status: 'pending',
          query_type: 'text'
        })
        .select();
      
      if (insertError) {
        console.error('Error inserting test query:', insertError);
        alert('Cannot insert into support_queries table. Please check your permissions.');
      } else {
        console.log('Insert test successful:', insertTest);
        
        // Delete the test query
        if (insertTest && insertTest[0]) {
          await supabase
            .from('support_queries')
            .delete()
            .eq('id', insertTest[0].id);
          console.log('Test query deleted');
        }
      }
      
    } catch (error) {
      console.error('Database test error:', error);
    }
  };

  // Load user's queries
  const loadQueries = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('support_queries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQueries(data || []);
    } catch (error) {
      console.error('Error loading queries:', error);
    }
  };

  // Auto-scroll to bottom when new queries arrive
  useEffect(() => {
    queriesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [queries]);

  // Submit new query
  const handleSubmitQuery = async (e) => {
    e.preventDefault();
    if (!message.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('support_queries')
        .insert({
          user_id: user.id,
          user_name: userProfile?.name || user.email,
          user_email: user.email,
          query_text: message.trim(),
          status: 'pending',
          query_type: 'text'
        });

      if (error) throw error;
      setMessage("");
      
      // Reload queries to show the new one
      await loadQueries(user.id);
    } catch (error) {
      console.error('Error submitting query:', error);
      alert('Failed to submit query. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (sendingMessage) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Check file type
    const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
    
    if (!isAllowed) {
      alert('Only images, PDFs, and Word documents are allowed');
      return;
    }

    setSendingMessage(true);
    try {
      console.log('Starting file upload for:', file.name);
      console.log('File size:', file.size, 'bytes');
      console.log('File type:', file.type);
      
      // Upload file to Supabase Storage (skip bucket check since we know it exists)
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `support-attachments/${user.id}/${fileName}`;

      console.log('Uploading to path:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('support-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        console.error('Upload error message:', uploadError.message);
        console.error('Upload error code:', uploadError.code);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('support-files')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Save query with file attachment
      const { data: queryData, error: queryError } = await supabase
        .from('support_queries')
        .insert({
          user_id: user.id,
          user_name: userProfile?.name || user.email,
          user_email: user.email,
          query_text: `Query with attachment: ${file.name}`,
          status: 'pending',
          query_type: 'file',
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        })
        .select();

      if (queryError) {
        console.error('Query insert error:', queryError);
        throw queryError;
      }

      console.log('Query saved successfully:', queryData);
      
      // Reload queries to show the new one
      await loadQueries(user.id);
    } catch (error) {
      console.error('Error uploading file:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // More specific error messages
      if (error.message?.includes('bucket') || error.message?.includes('Storage bucket')) {
        alert('Storage bucket not found. Please run the SQL setup script first in your Supabase dashboard.');
      } else if (error.message?.includes('permission') || error.message?.includes('not authorized')) {
        alert('Permission denied. Please check your authentication.');
      } else {
        // Fallback: create a text query mentioning the file
        try {
          console.log('Attempting fallback: creating text query with file info');
          const { error: fallbackError } = await supabase
            .from('support_queries')
            .insert({
              user_id: user.id,
              user_name: userProfile?.name || user.email,
              user_email: user.email,
              query_text: `[File upload failed] I tried to upload: ${file.name} (${formatFileSize(file.size)}). Please contact support for file upload issues.`,
              status: 'pending',
              query_type: 'text'
            });
          
          if (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
            alert('Failed to upload file and create query. Please try again later.');
          } else {
            alert('File upload failed, but your query was saved. Please contact support for file upload issues.');
            await loadQueries(user.id);
          }
        } catch (fallbackError) {
          console.error('Fallback failed:', fallbackError);
          alert('Failed to upload file. Please try again.');
        }
      }
    } finally {
      setSendingMessage(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'solved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unsolved':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate query statistics
  const getQueryStats = () => {
    const total = queries.length;
    const solved = queries.filter(q => q.status === 'solved').length;
    const pending = queries.filter(q => q.status === 'pending').length;
    const unsolved = queries.filter(q => q.status === 'unsolved').length;
    
    return { total, solved, pending, unsolved };
  };

  // Format time with better detail
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Edit query functionality
  const [editingQuery, setEditingQuery] = useState(null);
  const [editText, setEditText] = useState('');

  const startEditing = (query) => {
    setEditingQuery(query.id);
    setEditText(query.query_text);
  };

  const cancelEditing = () => {
    setEditingQuery(null);
    setEditText('');
  };

  const saveEdit = async (queryId) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('support_queries')
        .update({ query_text: editText.trim() })
        .eq('id', queryId);

      if (error) throw error;

      // Update local state
      setQueries(prev => prev.map(q => 
        q.id === queryId ? { ...q, query_text: editText.trim() } : q
      ));

      setEditingQuery(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating query:', error);
      alert('Failed to update query. Please try again.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="/chat">
        <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading support queries...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/chat">
      <div className="max-w-4xl mx-auto h-[calc(100vh-200px)]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Support</h1>
          <p className="text-gray-600">Submit your queries and get help from our support team.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Support Queries</h2>
                <p className="text-sm text-gray-600">You have {queries.length} query{queries.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Support Team Online</span>
              </div>
            </div>
            
            {/* Query Statistics */}
            {queries.length > 0 && (
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{getQueryStats().total}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{getQueryStats().solved}</div>
                  <div className="text-xs text-gray-600">Solved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{getQueryStats().pending}</div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{getQueryStats().unsolved}</div>
                  <div className="text-xs text-gray-600">Unsolved</div>
                </div>
              </div>
            )}
          </div>

          {/* Queries List */}
          <div className="flex-1 overflow-y-auto p-6">
            {queries.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No queries yet</h3>
                <p className="text-gray-500">Submit your first query below and our support team will help you!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {queries.map((query) => (
                  <div key={query.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold">
                            {userProfile?.name?.charAt(0) || user?.email?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{userProfile?.name || user?.email}</h3>
                          <p className="text-sm text-gray-600">{formatTime(query.created_at)}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(query.status)}`}>
                        {query.status.charAt(0).toUpperCase() + query.status.slice(1)}
                      </span>
                    </div>

                    <div className="mb-4">
                      {query.query_type === 'file' ? (
                        <div>
                          <p className="text-gray-700 mb-3">{query.query_text}</p>
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{query.file_name}</p>
                                <p className="text-sm text-gray-600">{formatFileSize(query.file_size)}</p>
                              </div>
                              <a
                                href={query.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm hover:bg-indigo-200 transition"
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {editingQuery === query.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows="3"
                                placeholder="Edit your query..."
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => saveEdit(query.id)}
                                  className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <p className="text-gray-700 flex-1">{query.query_text}</p>
                              {query.status === 'pending' && (
                                <button
                                  onClick={() => startEditing(query)}
                                  className="ml-2 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition"
                                  title="Edit query"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {query.admin_response && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-xs">A</span>
                          </div>
                          <span className="font-medium text-blue-900">Admin Response</span>
                        </div>
                        <p className="text-blue-800">{query.admin_response}</p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={queriesEndRef} />
              </div>
            )}
          </div>

          {/* Query Input */}
          <div className="p-6 border-t border-gray-200">
            <form onSubmit={handleSubmitQuery} className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={sendingMessage}
                />
                
                {/* File Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 text-gray-600 hover:text-indigo-600 transition border border-gray-300 rounded-lg hover:border-indigo-300"
                  disabled={sendingMessage}
                  title="Attach file (images, PDFs, Word docs - max 5MB)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 font-medium"
                  disabled={!message.trim() || sendingMessage}
                >
                  {sendingMessage ? 'Submitting...' : 'Submit Query'}
                </button>
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />
              
              <p className="text-xs text-gray-500">
                You can attach images, PDFs, or Word documents (max 5MB). Our support team will respond within 24 hours.
              </p>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 