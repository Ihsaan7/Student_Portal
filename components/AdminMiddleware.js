'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAdminStatus } from '../lib/adminAuth';

/**
 * Admin Middleware Component
 * Protects admin routes by checking user authentication and admin privileges
 */
const AdminMiddleware = ({ children, requiredPermission = null }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsLoading(true);
        
        const { isAdmin, role, user } = await checkAdminStatus();
        
        if (!isAdmin) {
          // Redirect to login if not admin
          router.push('/login?error=unauthorized&redirect=admin');
          return;
        }

        // Check specific permission if required
        if (requiredPermission) {
          const { hasAdminPermission } = await import('../lib/adminAuth');
          const hasPermission = await hasAdminPermission(requiredPermission);
          
          if (!hasPermission) {
            // Redirect to admin dashboard if no permission
            router.push('/admin?error=insufficient_permissions');
            return;
          }
        }

        setAdminData({ role, user });
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/login?error=auth_error');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [router, requiredPermission]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this area.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Pass admin data to children components
  return (
    <div className="admin-wrapper">
      {typeof children === 'function' ? children(adminData) : children}
    </div>
  );
};

export default AdminMiddleware;

/**
 * Higher-order component for protecting admin pages
 * @param {React.Component} WrappedComponent - Component to protect
 * @param {string} requiredPermission - Required permission level
 * @returns {React.Component} Protected component
 */
export const withAdminAuth = (WrappedComponent, requiredPermission = null) => {
  return function AdminProtectedComponent(props) {
    return (
      <AdminMiddleware requiredPermission={requiredPermission}>
        {(adminData) => <WrappedComponent {...props} adminData={adminData} />}
      </AdminMiddleware>
    );
  };
};

/**
 * Hook for accessing admin data in components
 * @returns {object} Admin data and utilities
 */
export const useAdminAuth = () => {
  const [adminData, setAdminData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getAdminData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await checkAdminStatus();
        
        if (result.isAdmin) {
          setAdminData(result);
        } else {
          setError('Not authorized as admin');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    getAdminData();
  }, []);

  const refreshAdminData = async () => {
    try {
      const result = await checkAdminStatus();
      setAdminData(result.isAdmin ? result : null);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  return {
    adminData,
    isLoading,
    error,
    refreshAdminData,
    isAdmin: adminData?.isAdmin || false,
    role: adminData?.role || null
  };
};