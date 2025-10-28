'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminMiddleware from '../../../components/AdminMiddleware';
import { getUsers, updateUserRole, deleteUser, logAdminAction } from '../../../lib/adminAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../components/ThemeProvider';

const UsersManagement = ({ adminData }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const usersPerPage = 20;

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { users: fetchedUsers, total } = await getUsers(currentPage, usersPerPage, searchTerm);
      setUsers(fetchedUsers);
      setTotalUsers(total);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleRoleChange = async (newRole) => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      const success = await updateUserRole(selectedUser.id, newRole);
      
      if (success) {
        setSuccess(`User role updated to ${newRole}`);
        setShowRoleModal(false);
        setSelectedUser(null);
        loadUsers(); // Refresh the list
      } else {
        setError('Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      const success = await deleteUser(selectedUser.id);
      
      if (success) {
        setSuccess('User deleted successfully');
        setShowDeleteModal(false);
        setSelectedUser(null);
        loadUsers(); // Refresh the list
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-destructive/10 text-destructive border border-destructive/20';
      case 'admin': return 'bg-primary/10 text-primary border border-primary/20';
      case 'student': return 'bg-accent/10 text-accent border border-accent/20';
      default: return 'bg-muted/50 text-muted-foreground border border-border';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

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
                <span className="hidden sm:inline">User Management</span>
                <span className="sm:hidden">Users</span>
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
        {/* Search and Filters */}
        <div className="bg-card rounded-lg shadow-sm border border-primary/20 mb-6 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
                />
              </div>
              <div className="text-sm text-muted-foreground flex items-center whitespace-nowrap">
                <span className="font-medium text-primary">{totalUsers}</span> users total
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-lg shadow-sm border border-primary/20 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
          <div className="px-4 sm:px-6 py-4 border-b border-border">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Users</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="medium" variant="primary" />
              <p className="mt-2 text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Programme
                    </th>
                    <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md ${
                          getRoleBadgeColor(user.role)
                        }`}>
                          {user.role || 'student'}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-sm text-foreground">
                        <div className="max-w-[150px] truncate" title={user.programme || 'Not set'}>
                          {user.programme || 'Not set'}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                            }}
                            className="text-primary hover:text-primary/80 transition-colors cursor-pointer text-xs sm:text-sm"
                          >
                            Edit Role
                          </button>
                          {adminData?.role === 'super_admin' && user.role !== 'super_admin' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="text-destructive hover:text-destructive/80 transition-colors cursor-pointer text-xs sm:text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {currentPage * usersPerPage + 1} to {Math.min((currentPage + 1) * usersPerPage, totalUsers)} of {totalUsers} results
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

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border shadow-lg">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Change Role for {selectedUser.name || selectedUser.email}
            </h3>
            <div className="space-y-3">
              {['student', 'admin', ...(adminData?.role === 'super_admin' ? ['super_admin'] : [])].map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  disabled={actionLoading || selectedUser.role === role}
                  className={`w-full text-left px-4 py-3 rounded-md border transition-colors cursor-pointer ${
                    selectedUser.role === role
                      ? 'bg-muted/50 text-muted-foreground cursor-not-allowed border-border'
                      : 'hover:bg-muted/30 border-border hover:border-primary/30'
                  }`}
                  style={{ backgroundColor: selectedUser.role === role ? 'hsl(var(--muted))' : 'hsl(var(--background))' }}
                >
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md mr-2 ${
                    getRoleBadgeColor(role)
                  }`}>
                    {role}
                  </span>
                  <span className="text-foreground">
                    {role === 'student' && 'Regular student access'}
                    {role === 'admin' && 'Admin panel access'}
                    {role === 'super_admin' && 'Full system access'}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                style={{ backgroundColor: 'hsl(var(--background))' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border shadow-lg">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Delete User
            </h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete <strong className="text-foreground">{selectedUser.name || selectedUser.email}</strong>? 
              This action cannot be undone and will remove all user data.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                style={{ backgroundColor: 'hsl(var(--background))' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UsersManagementPage = () => {
  return (
    <AdminMiddleware requiredPermission="view_dashboard">
      {(adminData) => <UsersManagement adminData={adminData} />}
    </AdminMiddleware>
  );
};

export default UsersManagementPage;