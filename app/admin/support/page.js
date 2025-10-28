'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminMiddleware from '../../../components/AdminMiddleware';
import { getSupportQueries, updateSupportQuery, logAdminAction } from '../../../lib/adminAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../components/ThemeProvider';

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
  const { theme, toggleTheme } = useTheme();
  
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
      case 'pending': return 'bg-accent/10 text-accent border border-accent/20';
      case 'solved': return 'bg-primary/10 text-primary border border-primary/20';
      case 'unsolved': return 'bg-destructive/10 text-destructive border border-destructive/20';
      default: return 'bg-muted/50 text-muted-foreground border border-border';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-accent';
      case 'low': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const totalPages = Math.ceil(totalQueries / queriesPerPage);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="text-primary hover:text-primary/80 mr-4 transition-colors cursor-pointer"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                <span className="hidden sm:inline">Support Management</span>
                <span className="sm:hidden">Support</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md transition-all duration-200 hover:bg-muted/50 cursor-pointer border border-border hover:border-primary/30"
                style={{ 
                  backgroundColor: 'hsl(var(--muted))', 
                  color: 'hsl(var(--muted-foreground))' 
                }}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold hover:text-destructive/80 cursor-pointer">×</button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-md">
            {success}
            <button onClick={() => setSuccess('')} className="float-right font-bold hover:text-primary/80 cursor-pointer">×</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-card rounded-lg shadow-sm border border-primary/20 mb-6 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusFilter('')}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    statusFilter === '' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  All ({totalQueries})
                </button>
                <button
                  onClick={() => handleStatusFilter('pending')}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    statusFilter === 'pending' 
                      ? 'bg-accent text-accent-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleStatusFilter('solved')}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    statusFilter === 'solved' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Solved
                </button>
                <button
                  onClick={() => handleStatusFilter('unsolved')}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    statusFilter === 'unsolved' 
                      ? 'bg-destructive text-destructive-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Unsolved
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Support Queries */}
        <div className="bg-card rounded-lg shadow-sm border border-primary/20 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
          <div className="px-4 sm:px-6 py-4 border-b border-border">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Support Queries</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="medium" variant="primary" />
              <p className="mt-2 text-muted-foreground">Loading support queries...</p>
            </div>
          ) : queries.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📧</div>
              <p className="text-muted-foreground">No support queries found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {queries.map((query) => (
                <div key={query.id} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="text-base sm:text-lg font-medium text-foreground truncate">
                          {query.subject || 'No Subject'}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md ${
                            getStatusBadgeColor(query.status)
                          }`}>
                            {query.status || 'pending'}
                          </span>
                          {query.priority && (
                            <span className={`text-xs sm:text-sm font-medium ${getPriorityColor(query.priority)}`}>
                              {query.priority} priority
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-3 space-y-1">
                        <p><strong className="text-foreground">From:</strong> {query.user_name || 'Unknown'} ({query.user_email || 'No email'})</p>
                        <p><strong className="text-foreground">Submitted:</strong> {formatDate(query.created_at)}</p>
                        {query.admin_response_at && (
                          <p><strong className="text-foreground">Responded:</strong> {formatDate(query.admin_response_at)}</p>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-foreground whitespace-pre-wrap text-sm sm:text-base">{query.message}</p>
                      </div>
                      
                      {query.admin_response && (
                        <div className="bg-primary/5 border-l-4 border-primary p-4 mb-4 rounded-r-md">
                          <p className="text-sm font-medium text-primary mb-1">Admin Response:</p>
                          <p className="text-foreground whitespace-pre-wrap text-sm">{query.admin_response}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedQuery(query);
                          setResponseText(query.admin_response || '');
                          setResponseStatus(query.status === 'pending' ? 'solved' : query.status);
                          setShowResponseModal(true);
                        }}
                        className="w-full lg:w-auto bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm transition-colors cursor-pointer"
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
            <div className="px-4 sm:px-6 py-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {currentPage * queriesPerPage + 1} to {Math.min((currentPage + 1) * queriesPerPage, totalQueries)} of {totalQueries} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-2 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors cursor-pointer text-sm"
                    style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-muted-foreground">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-2 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors cursor-pointer text-sm"
                    style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border shadow-lg">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Respond to Support Query
            </h3>
            
            <div className="mb-4 p-4 bg-muted/30 rounded-md border border-border">
              <p className="text-sm font-medium text-foreground mb-1">Original Query:</p>
              <p className="text-sm text-primary font-medium">{selectedQuery.subject}</p>
              <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{selectedQuery.message}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={responseStatus}
                onChange={(e) => setResponseStatus(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
              >
                <option value="solved">Solved</option>
                <option value="unsolved">Unsolved</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Response
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
                placeholder="Enter your response to the user..."
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedQuery(null);
                  setResponseText('');
                  setResponseStatus('solved');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                style={{ backgroundColor: 'hsl(var(--background))' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRespond}
                disabled={actionLoading || !responseText.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
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