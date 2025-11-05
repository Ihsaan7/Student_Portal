'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminMiddleware from '../../components/AdminMiddleware';
import HandoutApprovalPanel from '../components/HandoutApprovalPanel';
import AdminCourseGuidancePanel from '../components/AdminCourseGuidancePanel';
import CareerDevelopmentAdminPanel from '../components/CareerDevelopmentAdminPanel';
import AnnouncementAdminPanel from '../components/AnnouncementAdminPanel';
import VUTipsAdminPanel from '../components/VUTipsAdminPanel';
import { getAdminStats, updateSystemStats, logAdminAction } from '../../lib/adminAuth';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../components/ThemeProvider';

const AdminDashboard = ({ adminData }) => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Check for error messages from URL params
    const errorParam = searchParams.get('error');
    if (errorParam === 'insufficient_permissions') {
      setError('You don\'t have sufficient permissions for that action.');
    }

    loadDashboardData();
    logAdminAction('view_dashboard');
  }, [searchParams]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Update stats first
      await updateSystemStats();
      
      // Get dashboard data
      const data = await getAdminStats();
      
      if (data) {
        setStats(data);
        setRecentActivity(data.recentActivity);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAsUser = async () => {
    try {
      // Set admin mode flag in localStorage
      localStorage.setItem('admin_mode', 'true');
      localStorage.setItem('admin_user_id', adminData.user.id);
      localStorage.setItem('admin_role', adminData.role);
      localStorage.setItem('admin_name', adminData.user.profile?.name || adminData.user.email || 'Admin');
      
      // Log the action
      await logAdminAction('test_as_user', 'user_panel', null, {
        admin_id: adminData.user.id,
        timestamp: new Date().toISOString()
      });
      
      // Redirect to user home page
      router.push('/home');
    } catch (err) {
      console.error('Error switching to user mode:', err);
      setError('Failed to switch to user mode');
    }
  };

  const handleLogout = async () => {
    try {
      await logAdminAction('admin_logout');
      
      // CRITICAL: Clear all admin mode data on logout
      localStorage.removeItem("admin_mode");
      localStorage.removeItem("admin_user_id");
      localStorage.removeItem("admin_role");
      localStorage.removeItem("admin_name");
      
      // Clear any other admin-related localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('admin_') || key.includes('admin')) {
          localStorage.removeItem(key);
        }
      });
      
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action) => {
    const icons = {
      'view_dashboard': '📊',
      'update_user_role': '👤',
      'delete_user': '🗑️',
      'update_support_query': '💬',
      'admin_login': '🔐',
      'admin_logout': '🚪'
    };
    return icons[action] || '📝';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" variant="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                <span className="hidden sm:inline">Admin Dashboard</span>
                <span className="sm:hidden">Admin</span>
              </h1>
              <span className="ml-2 sm:ml-3 px-2 sm:px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
                {adminData?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-sm text-muted-foreground hidden lg:block">
                Welcome, {adminData?.user?.profile?.name || adminData?.user?.email}
              </span>
              
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
              
              <button
                onClick={handleTestAsUser}
                className="bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-xs sm:text-sm font-medium cursor-pointer border border-primary/20 hover:border-primary/40"
              >
                <span className="hidden sm:inline">Test as User</span>
                <span className="sm:hidden">Test</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-destructive text-destructive-foreground px-3 sm:px-4 py-2 rounded-md hover:bg-destructive/90 transition-colors text-xs sm:text-sm font-medium cursor-pointer border border-destructive/20 hover:border-destructive/40"
              >
                Logout
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
          </div>
        </div>
      )}
      
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-md">
            {success}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div 
            onClick={() => router.push('/admin/users')}
            className="bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-primary/20 hover:border-primary/40 group border-l-4"
            style={{ borderLeftColor: 'hsl(var(--primary))' }}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">👥</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Users</h3>
                <p className="text-sm text-muted-foreground">Manage user accounts</p>
                {stats && (
                  <p className="text-2xl font-bold text-primary mt-2">
                    {stats.stats?.total_users || 0}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div 
            onClick={() => router.push('/admin/support')}
            className="bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-primary/20 hover:border-primary/40 group border-l-4"
            style={{ borderLeftColor: 'hsl(var(--primary))' }}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">💬</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Support</h3>
                <p className="text-sm text-muted-foreground">Handle support queries</p>
                {stats && (
                  <p className="text-2xl font-bold text-primary mt-2">
                    {stats.stats?.support_queries_pending || 0}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div 
            onClick={() => router.push('/admin/courses')}
            className="bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-primary/20 hover:border-primary/40 group border-l-4"
            style={{ borderLeftColor: 'hsl(var(--primary))' }}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">📚</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Courses</h3>
                <p className="text-sm text-muted-foreground">Manage courses</p>
                {stats && (
                  <p className="text-2xl font-bold text-primary mt-2">
                    {stats.stats?.total_courses || 0}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('handouts')}
            className={`bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border group border-l-4 ${
              activeTab === 'handouts' 
                ? 'border-primary bg-primary/5' 
                : 'border-primary/20 hover:border-primary/40'
            }`}
            style={{ borderLeftColor: 'hsl(var(--primary))' }}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">📄</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Handouts</h3>
                <p className="text-sm text-muted-foreground">Approve handout uploads</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('course-guidance')}
            className={`bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border group border-l-4 ${
              activeTab === 'course-guidance' 
                ? 'border-primary bg-primary/5' 
                : 'border-primary/20 hover:border-primary/40'
            }`}
            style={{ borderLeftColor: 'hsl(var(--primary))' }}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">🎯</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Course Guidance</h3>
                <p className="text-sm text-muted-foreground">Manage course guidance content</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('career-development')}
            className={`bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border group border-l-4 ${
              activeTab === 'career-development' 
                ? 'border-primary bg-primary/5' 
                : 'border-primary/20 hover:border-primary/40'
            }`}
            style={{ borderLeftColor: 'hsl(var(--primary))' }}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">🚀</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Career Development</h3>
                <p className="text-sm text-muted-foreground">Manage career path content</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('announcements')}
            className={`bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border group border-l-4 ${
              activeTab === 'announcements' 
                ? 'border-primary bg-primary/5' 
                : 'border-primary/20 hover:border-primary/40'
            }`}
            style={{ borderLeftColor: 'hsl(var(--primary))' }}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">📢</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Announcements</h3>
                <p className="text-sm text-muted-foreground">Manage system announcements</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('vu-tips')}
            className={`bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border group border-l-4 ${
              activeTab === 'vu-tips' 
                ? 'border-primary bg-primary/5' 
                : 'border-primary/20 hover:border-primary/40'
            }`}
            style={{ borderLeftColor: 'hsl(var(--primary))' }}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">💡</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">VU Tips</h3>
                <p className="text-sm text-muted-foreground">Manage VU Tips video sections</p>
              </div>
            </div>
          </div>

          {adminData?.role === 'super_admin' && (
            <div 
              onClick={() => router.push('/admin/settings')}
              className="bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-primary/20 hover:border-primary/40 group border-l-4"
              style={{ borderLeftColor: 'hsl(var(--primary))' }}
            >
              <div className="flex items-center">
                <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">⚙️</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Settings</h3>
                  <p className="text-sm text-muted-foreground">System configuration</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('handouts')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'handouts'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Handout Approvals
              </button>
              <button
                onClick={() => setActiveTab('course-guidance')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'course-guidance'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Course Guidance
              </button>
              <button
                onClick={() => setActiveTab('career-development')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'career-development'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Career Development
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'announcements'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Announcements
              </button>
              <button
                onClick={() => setActiveTab('vu-tips')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'vu-tips'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                VU Tips
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Statistics Overview */}
            {stats && (
              <div className="bg-card rounded-lg shadow-sm border border-border mb-8">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground">System Overview</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-3xl font-bold text-primary mb-1">{stats.stats?.total_users || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-3xl font-bold text-primary mb-1">{stats.stats?.total_courses || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Courses</p>
                    </div>
                    <div className="text-center p-4 bg-accent/5 rounded-lg border border-accent/10">
                      <p className="text-3xl font-bold text-accent mb-1">{stats.stats?.support_queries_pending || 0}</p>
                      <p className="text-sm text-muted-foreground">Pending Support</p>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-3xl font-bold text-primary mb-1">{stats.stats?.total_enrollments || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Enrollments</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'dashboard' && (
          /* Recent Activity */
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Recent Admin Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                      <span className="text-2xl">{getActionIcon(activity.action)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.admin?.name || 'Unknown Admin'} - {activity.action.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.created_at)}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 px-2 py-1 rounded">
                            {JSON.stringify(activity.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'handouts' && (
          <HandoutApprovalPanel user={adminData.user} />
        )}

        {activeTab === 'course-guidance' && (
          <AdminCourseGuidancePanel user={adminData.user} />
        )}

        {activeTab === 'career-development' && (
          <CareerDevelopmentAdminPanel user={adminData.user} />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementAdminPanel />
        )}

        {activeTab === 'vu-tips' && (
          <VUTipsAdminPanel user={adminData.user} />
        )}
      </main>
    </div>
  );
};

const AdminDashboardPage = () => {
  return (
    <AdminMiddleware>
      {(adminData) => <AdminDashboard adminData={adminData} />}
    </AdminMiddleware>
  );
};

export default AdminDashboardPage;