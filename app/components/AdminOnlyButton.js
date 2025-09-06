"use client";
import { useState, useEffect } from "react";

// Utility function to check if admin is in user mode
const isAdminMode = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_mode') === 'true';
  }
  return false;
};

export const getAdminData = () => {
  try {
    const adminMode = localStorage.getItem('admin_mode');
    const adminUserId = localStorage.getItem('admin_user_id');
    const role = localStorage.getItem('admin_role');
    
    return adminMode === 'true' ? { userId: adminUserId, role } : null;
  } catch (error) {
    return null;
  }
};

export default function AdminOnlyButton({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary",
  title = "Admin Only Action",
  ...props 
}) {
  const [adminMode, setAdminMode] = useState(false);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const isAdmin = isAdminMode();
    setAdminMode(isAdmin);
    if (isAdmin) {
      setAdminData(getAdminData());
    }
  }, []);

  // Don't render if not in admin mode
  if (!adminMode) {
    return null;
  }

  const baseClasses = "inline-flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 border";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 hover:from-red-600 hover:to-red-700 hover:border-red-700 shadow-md hover:shadow-lg",
    secondary: "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600 hover:from-orange-600 hover:to-orange-700 hover:border-orange-700 shadow-md hover:shadow-lg",
    outline: "bg-white text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400",
    ghost: "bg-transparent text-red-600 border-transparent hover:bg-red-50"
  };

  const handleClick = (e) => {
    console.log(`Admin action triggered by: ${adminData?.userId} (${adminData?.role})`);
    if (onClick) {
      onClick(e, adminData);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      title={`${title} (Admin Only)`}
      {...props}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      {children}
    </button>
  );
}

// Export utility functions for use in other components
export { isAdminMode };