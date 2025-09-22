'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminMiddleware from '../../components/AdminMiddleware';
import HandoutApprovalPanel from '../components/HandoutApprovalPanel';
import AdminCourseGuidancePanel from '../components/AdminCourseGuidancePanel';
import CareerDevelopmentAdminPanel from '../components/CareerDevelopmentAdminPanel';
import AnnouncementAdminPanel from '../components/AnnouncementAdminPanel';
import { getAdminStats, updateSystemStats, logAdminAction } from '../../lib/adminAuth';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';

const AdminDashboard = ({ adminData }) => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();
  const searchParams = useSearchParams();

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {adminData?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {adminData?.user?.profile?.name || adminData?.user?.email}
              </span>
              <button
                onClick={handleTestAsUser}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Test as User
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}
      
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div 
            onClick={() => router.push('/admin/users')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 border-blue-500"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Users</h3>
                <p className="text-sm text-gray-600">Manage user accounts</p>
                {stats && (
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {stats.stats?.total_users || 0}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div 
            onClick={() => router.push('/admin/support')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 border-green-500"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">💬</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Support</h3>
                <p className="text-sm text-gray-600">Handle support queries</p>
                {stats && (
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {stats.stats?.support_queries_pending || 0}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div 
            onClick={() => router.push('/admin/courses')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 border-purple-500"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">📚</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Courses</h3>
                <p className="text-sm text-gray-600">Manage courses</p>
                {stats && (
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {stats.stats?.total_courses || 0}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('handouts')}
            className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
              activeTab === 'handouts' ? 'border-red-500 bg-red-50' : 'border-red-500'
            }`}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">📄</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Handouts</h3>
                <p className="text-sm text-gray-600">Approve handout uploads</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('course-guidance')}
            className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
              activeTab === 'course-guidance' ? 'border-indigo-500 bg-indigo-50' : 'border-indigo-500'
            }`}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎯</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Course Guidance</h3>
                <p className="text-sm text-gray-600">Manage course guidance content</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('career-development')}
            className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
              activeTab === 'career-development' ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-500'
            }`}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">🚀</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Career Development</h3>
                <p className="text-sm text-gray-600">Manage career path content</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('announcements')}
            className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
              activeTab === 'announcements' ? 'border-yellow-500 bg-yellow-50' : 'border-yellow-500'
            }`}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">📢</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
                <p className="text-sm text-gray-600">Manage system announcements</p>
              </div>
            </div>
          </div>

          {adminData?.role === 'super_admin' && (
            <div 
              onClick={() => router.push('/admin/settings')}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 border-orange-500"
            >
              <div className="flex items-center">
                <div className="text-3xl mr-4">⚙️</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                  <p className="text-sm text-gray-600">System configuration</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('handouts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'handouts'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Handout Approvals
              </button>
              <button
                onClick={() => setActiveTab('course-guidance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'course-guidance'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Course Guidance
              </button>
              <button
                onClick={() => setActiveTab('career-development')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'career-development'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Career Development
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'announcements'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Announcements
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Statistics Overview */}
            {stats && (
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.stats?.total_users || 0}</p>
                      <p className="text-sm text-gray-600">Total Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.stats?.total_courses || 0}</p>
                      <p className="text-sm text-gray-600">Total Courses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{stats.stats?.support_queries_pending || 0}</p>
                      <p className="text-sm text-gray-600">Pending Support</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{stats.stats?.total_enrollments || 0}</p>
                      <p className="text-sm text-gray-600">Total Enrollments</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'dashboard' && (
          /* Recent Activity */
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Admin Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                      <span className="text-2xl">{getActionIcon(activity.action)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.admin?.name || 'Unknown Admin'} - {activity.action.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.created_at)}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-gray-600 mt-1">
                            {JSON.stringify(activity.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
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