'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminMiddleware from '../../../components/AdminMiddleware';
import { getSupportQueries, updateSupportQuery, logAdminAction } from '../../../lib/adminAuth';
import LoadingSpinner from '../../components/LoadingSpinner';

const SupportManagement = ({ adminData }) => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalQueries, setTotalQueries] = useState(0);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState('solved');
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  
  const queriesPerPage = 20;

  useEffect(() => {
    loadQueries();
  }, [currentPage, statusFilter]);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const { queries: fetchedQueries, total } = await getSupportQueries(currentPage, queriesPerPage, statusFilter);
      setQueries(fetchedQueries);
      setTotalQueries(total);
    } catch (err) {
      console.error('Error loading support queries:', err);
      setError('Failed to load support queries');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(0); // Reset to first page when filtering
  };

  const handleRespond = async () => {
    if (!selectedQuery) return;
    
    try {
      setActionLoading(true);
      const success = await updateSupportQuery(selectedQuery.id, responseStatus, responseText);
      
      if (success) {
        setSuccess('Support query updated successfully');
        setShowResponseModal(false);
        setSelectedQuery(null);
        setResponseText('');
        setResponseStatus('solved');
        loadQueries(); // Refresh the list
      } else {
        setError('Failed to update support query');
      }
    } catch (err) {
      console.error('Error updating support query:', err);
      setError('Failed to update support query');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'solved': return 'bg-green-100 text-green-800';
      case 'unsolved': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const totalPages = Math.ceil(totalQueries / queriesPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Support Management</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
            <button onClick={() => setSuccess('')} className="float-right font-bold">×</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusFilter('')}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    statusFilter === '' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({totalQueries})
                </button>
                <button
                  onClick={() => handleStatusFilter('pending')}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    statusFilter === 'pending' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleStatusFilter('solved')}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    statusFilter === 'solved' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Solved
                </button>
                <button
                  onClick={() => handleStatusFilter('unsolved')}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    statusFilter === 'unsolved' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Unsolved
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Support Queries */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Support Queries</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="medium" variant="primary" />
              <p className="mt-2" style={{color: 'hsl(var(--muted-foreground))'}}>Loading support queries...</p>
            </div>
          ) : queries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No support queries found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {queries.map((query) => (
                <div key={query.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {query.subject || 'No Subject'}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatusBadgeColor(query.status)
                        }`}>
                          {query.status || 'pending'}
                        </span>
                        {query.priority && (
                          <span className={`text-sm font-medium ${getPriorityColor(query.priority)}`}>
                            {query.priority} priority
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <p><strong>From:</strong> {query.user_name || 'Unknown'} ({query.user_email || 'No email'})</p>
                        <p><strong>Submitted:</strong> {formatDate(query.created_at)}</p>
                        {query.admin_response_at && (
                          <p><strong>Responded:</strong> {formatDate(query.admin_response_at)}</p>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-800 whitespace-pre-wrap">{query.message}</p>
                      </div>
                      
                      {query.admin_response && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                          <p className="text-sm font-medium text-blue-800 mb-1">Admin Response:</p>
                          <p className="text-blue-700 whitespace-pre-wrap">{query.admin_response}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedQuery(query);
                          setResponseText(query.admin_response || '');
                          setResponseStatus(query.status === 'pending' ? 'solved' : query.status);
                          setShowResponseModal(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                      >
                        {query.admin_response ? 'Update Response' : 'Respond'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {currentPage * queriesPerPage + 1} to {Math.min((currentPage + 1) * queriesPerPage, totalQueries)} of {totalQueries} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Response Modal */}
      {showResponseModal && selectedQuery && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Respond to Support Query
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm font-medium text-gray-700 mb-1">Original Query:</p>
              <p className="text-sm text-gray-600">{selectedQuery.subject}</p>
              <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{selectedQuery.message}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={responseStatus}
                onChange={(e) => setResponseStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="solved">Solved</option>
                <option value="unsolved">Unsolved</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your response to the user..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedQuery(null);
                  setResponseText('');
                  setResponseStatus('solved');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRespond}
                disabled={actionLoading || !responseText.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Update Query'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SupportManagementPage = () => {
  return (
    <AdminMiddleware requiredPermission="view_support">
      {(adminData) => <SupportManagement adminData={adminData} />}
    </AdminMiddleware>
  );
};

export default SupportManagementPage;