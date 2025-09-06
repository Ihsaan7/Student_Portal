"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { isAdminMode, getAdminData } from "./AdminOnlyButton";
import { ConfirmationDialog } from "./AdminControlPanel";

export default function AdvancedAdminPanel({ userId, userProfile }) {
  const [adminMode, setAdminMode] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');
  const [userActivity, setUserActivity] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [errorLogs, setErrorLogs] = useState([]);
  const [apiTestResult, setApiTestResult] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('/api/user/profile');
  const [featureToggles, setFeatureToggles] = useState({});
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAdminMode(isAdminMode());
    if (isAdminMode()) {
      loadUserActivity();
      loadPerformanceMetrics();
      loadErrorLogs();
      loadFeatureToggles();
    }
  }, [userId]);

  const loadUserActivity = async () => {
    try {
      // Simulate user activity data
      const mockActivity = [
        { id: 1, action: 'Login', timestamp: new Date().toISOString(), details: 'Successful login from Chrome' },
        { id: 2, action: 'Course View', timestamp: new Date(Date.now() - 300000).toISOString(), details: 'Viewed Computer Science course' },
        { id: 3, action: 'Assignment Submit', timestamp: new Date(Date.now() - 600000).toISOString(), details: 'Submitted Assignment 1' },
        { id: 4, action: 'Profile Update', timestamp: new Date(Date.now() - 900000).toISOString(), details: 'Updated profile picture' },
        { id: 5, action: 'Course Enroll', timestamp: new Date(Date.now() - 1200000).toISOString(), details: 'Enrolled in Mathematics course' }
      ];
      setUserActivity(mockActivity);
    } catch (error) {
      console.error('Error loading user activity:', error);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      // Simulate performance metrics
      const metrics = {
        sessionDuration: '45 minutes',
        pageViews: 23,
        apiCalls: 156,
        averageResponseTime: '245ms',
        errorRate: '0.3%',
        lastActive: new Date().toISOString(),
        deviceInfo: 'Windows 11, Chrome 120.0',
        networkLatency: '12ms'
      };
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  };

  const loadErrorLogs = async () => {
    try {
      // Simulate error logs
      const mockErrors = [
        { id: 1, level: 'warning', message: 'Slow API response detected', timestamp: new Date().toISOString(), component: 'CourseList' },
        { id: 2, level: 'error', message: 'Failed to load user preferences', timestamp: new Date(Date.now() - 600000).toISOString(), component: 'UserSettings' },
        { id: 3, level: 'info', message: 'Cache miss for user data', timestamp: new Date(Date.now() - 1200000).toISOString(), component: 'UserProfile' }
      ];
      setErrorLogs(mockErrors);
    } catch (error) {
      console.error('Error loading error logs:', error);
    }
  };

  const loadFeatureToggles = async () => {
    try {
      // Simulate feature toggles
      const toggles = {
        newDashboard: true,
        betaFeatures: false,
        advancedAnalytics: true,
        experimentalUI: false,
        mobileOptimization: true
      };
      setFeatureToggles(toggles);
    } catch (error) {
      console.error('Error loading feature toggles:', error);
    }
  };

  const handleApiTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      const data = await response.json();
      setApiTestResult(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        data: data
      }, null, 2));
      
      console.log('Admin API test:', apiEndpoint, response.status);
    } catch (error) {
      setApiTestResult(JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureToggle = (feature) => {
    setConfirmDialog({
      isOpen: true,
      title: "Toggle Feature",
      message: `This will ${featureToggles[feature] ? 'disable' : 'enable'} the "${feature}" feature for this user. Continue?`,
      type: "warning",
      onConfirm: () => {
        setFeatureToggles(prev => ({
          ...prev,
          [feature]: !prev[feature]
        }));
        console.log('Admin toggled feature:', feature, !featureToggles[feature]);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleMaintenanceToggle = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Toggle Maintenance Mode",
      message: `This will ${maintenanceMode ? 'disable' : 'enable'} maintenance mode for this user account. Continue?`,
      type: "danger",
      onConfirm: () => {
        setMaintenanceMode(!maintenanceMode);
        console.log('Admin toggled maintenance mode:', !maintenanceMode);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleClearUserCache = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Clear User Cache",
      message: "This will clear all cached data for this user. Continue?",
      type: "warning",
      onConfirm: () => {
        // Clear localStorage and sessionStorage
        localStorage.removeItem(`user_cache_${userId}`);
        sessionStorage.clear();
        console.log('Admin cleared user cache for:', userId);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const generateTestData = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Generate Test Data",
      message: "This will create test courses, assignments, and grades for this user. Continue?",
      type: "info",
      onConfirm: async () => {
        try {
          // Simulate test data generation
          const testCourses = [
            { name: 'Test Course A', code: 'TEST101', credits: 3 },
            { name: 'Test Course B', code: 'TEST102', credits: 4 }
          ];
          
          console.log('Admin generated test data for user:', userId, testCourses);
          setConfirmDialog({ isOpen: false });
        } catch (error) {
          console.error('Error generating test data:', error);
        }
      }
    });
  };

  if (!adminMode) {
    return null;
  }

  const tabs = [
    { id: 'activity', label: 'User Activity', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'errors', label: 'Error Logs', icon: '🐛' },
    { id: 'features', label: 'Feature Toggles', icon: '🎛️' },
    { id: 'api', label: 'API Testing', icon: '🔧' },
    { id: 'system', label: 'System Control', icon: '⚙️' }
  ];

  return (
    <div className="bg-white rounded-lg border border-purple-200 p-4 mb-4">
      <h3 className="text-lg font-semibold text-purple-700 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
        Advanced Admin Panel
      </h3>
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-4 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition ${
              activeTab === tab.id
                ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-500'
                : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'activity' && (
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Real-time User Activity</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {userActivity.map((activity) => (
                <div key={activity.id} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.details}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'performance' && (
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Performance Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(performanceMetrics).map(([key, value]) => (
                <div key={key} className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-lg font-bold text-blue-600">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'errors' && (
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Error Logs</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {errorLogs.map((error) => (
                <div key={error.id} className={`p-3 rounded-lg border ${
                  error.level === 'error' ? 'bg-red-50 border-red-200' :
                  error.level === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-medium ${
                        error.level === 'error' ? 'text-red-800' :
                        error.level === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {error.level.toUpperCase()}: {error.message}
                      </p>
                      <p className="text-sm text-gray-600">Component: {error.component}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'features' && (
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Feature Toggles</h4>
            <div className="space-y-3">
              {Object.entries(featureToggles).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFeatureToggle(feature)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      enabled
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-400 text-white hover:bg-gray-500'
                    }`}
                  >
                    {enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'api' && (
          <div>
            <h4 className="font-medium text-gray-800 mb-3">API Testing</h4>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="API Endpoint (e.g., /api/user/profile)"
                  className="flex-1 p-2 border rounded-md text-sm"
                />
                <button
                  onClick={handleApiTest}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm disabled:opacity-50"
                >
                  {isLoading ? 'Testing...' : 'Test API'}
                </button>
              </div>
              
              {apiTestResult && (
                <div className="p-3 bg-gray-900 text-green-400 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                  <pre>{apiTestResult}</pre>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'system' && (
          <div>
            <h4 className="font-medium text-gray-800 mb-3">System Control</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-800">Maintenance Mode</p>
                  <p className="text-sm text-yellow-600">
                    Status: {maintenanceMode ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <button
                  onClick={handleMaintenanceToggle}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    maintenanceMode
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  {maintenanceMode ? 'Disable' : 'Enable'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleClearUserCache}
                  className="p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm"
                >
                  Clear User Cache
                </button>
                
                <button
                  onClick={generateTestData}
                  className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  Generate Test Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
}