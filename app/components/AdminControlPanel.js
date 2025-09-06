"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { isAdminMode, getAdminData } from "./AdminOnlyButton";

// Confirmation Dialog Component
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, type = "warning" }) => {
  if (!isOpen) return null;

  const typeStyles = {
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    danger: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className={`p-4 rounded-lg border ${typeStyles[type]} mb-4`}>
          <h3 className="font-bold text-lg mb-2">{title}</h3>
          <p>{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md transition ${
              type === "danger" 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement = ({ userId, userProfile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });

  const handleEditProfile = () => {
    setEditData({
      name: userProfile?.name || '',
      email: userProfile?.email || '',
      programme: userProfile?.programme || '',
      status: userProfile?.status || 'active'
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update(editData)
        .eq('id', userId);
      
      if (error) throw error;
      
      console.log('Admin updated user profile:', userId, editData);
      onUpdate?.();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleResetPassword = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Reset User Password",
      message: "This will send a password reset email to the user. Continue?",
      type: "warning",
      onConfirm: async () => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(userProfile?.email);
          if (error) throw error;
          console.log('Admin triggered password reset for:', userProfile?.email);
          setConfirmDialog({ isOpen: false });
        } catch (error) {
          console.error('Error resetting password:', error);
        }
      }
    });
  };

  const handleToggleAccount = () => {
    const newStatus = userProfile?.status === 'active' ? 'suspended' : 'active';
    setConfirmDialog({
      isOpen: true,
      title: `${newStatus === 'suspended' ? 'Suspend' : 'Activate'} User Account`,
      message: `This will ${newStatus === 'suspended' ? 'suspend' : 'activate'} the user account. Continue?`,
      type: newStatus === 'suspended' ? "danger" : "info",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('users')
            .update({ status: newStatus })
            .eq('id', userId);
          
          if (error) throw error;
          
          console.log(`Admin ${newStatus} user account:`, userId);
          onUpdate?.();
          setConfirmDialog({ isOpen: false });
        } catch (error) {
          console.error('Error updating account status:', error);
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-orange-200 p-4 mb-4">
      <h3 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        User Management (Admin Only)
      </h3>
      
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Name"
            value={editData.name}
            onChange={(e) => setEditData({...editData, name: e.target.value})}
            className="w-full p-2 border rounded-md"
          />
          <input
            type="email"
            placeholder="Email"
            value={editData.email}
            onChange={(e) => setEditData({...editData, email: e.target.value})}
            className="w-full p-2 border rounded-md"
          />
          <input
            type="text"
            placeholder="Programme"
            value={editData.programme}
            onChange={(e) => setEditData({...editData, programme: e.target.value})}
            className="w-full p-2 border rounded-md"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveProfile}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleEditProfile}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
          >
            Edit Profile
          </button>
          <button
            onClick={handleResetPassword}
            className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition text-sm"
          >
            Reset Password
          </button>
          <button
            onClick={handleToggleAccount}
            className={`px-3 py-2 rounded-md transition text-sm ${
              userProfile?.status === 'active'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {userProfile?.status === 'active' ? 'Suspend Account' : 'Activate Account'}
          </button>
        </div>
      )}
      
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
};

// System Administration Component
const SystemAdmin = () => {
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [dbQuery, setDbQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);

  const handleClearCache = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Clear User Cache",
      message: "This will clear all cached data for this user session. Continue?",
      type: "warning",
      onConfirm: () => {
        localStorage.clear();
        sessionStorage.clear();
        console.log('Admin cleared user cache');
        setConfirmDialog({ isOpen: false });
        window.location.reload();
      }
    });
  };

  const handleMaintenanceMode = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Toggle Maintenance Mode",
      message: "This will put the current user account in maintenance mode. Continue?",
      type: "warning",
      onConfirm: () => {
        localStorage.setItem('maintenance_mode', 'true');
        console.log('Admin enabled maintenance mode for user');
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleDbQuery = async () => {
    if (!dbQuery.trim()) return;
    
    try {
      // This is a simplified example - in production, you'd want more security
      const { data, error } = await supabase.rpc('admin_query', { query: dbQuery });
      if (error) throw error;
      setQueryResult(data);
      console.log('Admin executed database query:', dbQuery);
    } catch (error) {
      console.error('Database query error:', error);
      setQueryResult({ error: error.message });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-red-200 p-4 mb-4">
      <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
        System Administration (Admin Only)
      </h3>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleClearCache}
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-sm"
          >
            Clear Cache
          </button>
          <button
            onClick={handleMaintenanceMode}
            className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition text-sm"
          >
            Maintenance Mode
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
          >
            Refresh Data
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Database Query (Admin Only)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={dbQuery}
              onChange={(e) => setDbQuery(e.target.value)}
              placeholder="SELECT * FROM users LIMIT 5"
              className="flex-1 p-2 border rounded-md text-sm"
            />
            <button
              onClick={handleDbQuery}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
            >
              Execute
            </button>
          </div>
          {queryResult && (
            <pre className="mt-2 p-3 bg-gray-100 rounded-md text-xs overflow-auto max-h-32">
              {JSON.stringify(queryResult, null, 2)}
            </pre>
          )}
        </div>
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
};

// Data Generation Component
const DataGeneration = () => {
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [generationStatus, setGenerationStatus] = useState('');

  const generateTestData = async (type) => {
    setConfirmDialog({
      isOpen: true,
      title: `Generate Test ${type}`,
      message: `This will create fake ${type.toLowerCase()} data for testing. Continue?`,
      type: "info",
      onConfirm: async () => {
        try {
          setGenerationStatus(`Generating ${type}...`);
          
          // Example test data generation
          if (type === 'Courses') {
            const testCourses = [
              { name: 'Test Course 1', code: 'TEST101', credits: 3 },
              { name: 'Test Course 2', code: 'TEST102', credits: 4 }
            ];
            
            for (const course of testCourses) {
              await supabase.from('courses').insert(course);
            }
          }
          
          console.log(`Admin generated test ${type}`);
          setGenerationStatus(`${type} generated successfully!`);
          setConfirmDialog({ isOpen: false });
          
          setTimeout(() => setGenerationStatus(''), 3000);
        } catch (error) {
          console.error(`Error generating ${type}:`, error);
          setGenerationStatus(`Error generating ${type}`);
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-green-200 p-4 mb-4">
      <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Data Generation (Admin Only)
      </h3>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => generateTestData('Courses')}
          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
        >
          Generate Test Courses
        </button>
        <button
          onClick={() => generateTestData('Assignments')}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
        >
          Generate Test Assignments
        </button>
        <button
          onClick={() => generateTestData('Grades')}
          className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-sm"
        >
          Generate Test Grades
        </button>
      </div>
      
      {generationStatus && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          {generationStatus}
        </div>
      )}
      
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
};

// Main Admin Control Panel
export default function AdminControlPanel({ userId, userProfile, onUpdate }) {
  const [adminMode, setAdminMode] = useState(false);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const isAdmin = isAdminMode();
    setAdminMode(isAdmin);
    if (isAdmin) {
      setAdminData(getAdminData());
    }
  }, []);

  if (!adminMode) {
    return null;
  }

  return (
    <div className="space-y-4">
      <UserManagement 
        userId={userId} 
        userProfile={userProfile} 
        onUpdate={onUpdate} 
      />
      <SystemAdmin />
      <DataGeneration />
    </div>
  );
}

// Export individual components for use elsewhere
export { ConfirmationDialog, UserManagement, SystemAdmin, DataGeneration };