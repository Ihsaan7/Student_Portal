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

  const getVariantStyles = (variant) => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 0.75rem',
      borderRadius: '0.375rem',
      fontWeight: '500',
      fontSize: '0.875rem',
      transition: 'all 0.2s',
      border: '1px solid',
      cursor: 'pointer'
    };

    const variants = {
      primary: {
        ...baseStyle,
        backgroundColor: 'hsl(var(--destructive))',
        color: 'hsl(var(--destructive-foreground))',
        borderColor: 'hsl(var(--destructive))'
      },
      secondary: {
        ...baseStyle,
        backgroundColor: 'hsl(var(--secondary))',
        color: 'hsl(var(--secondary-foreground))',
        borderColor: 'hsl(var(--secondary))'
      },
      outline: {
        ...baseStyle,
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--destructive))',
        borderColor: 'hsl(var(--destructive))'
      },
      ghost: {
        ...baseStyle,
        backgroundColor: 'transparent',
        color: 'hsl(var(--destructive))',
        borderColor: 'transparent'
      }
    };

    return variants[variant] || variants.primary;
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
      style={getVariantStyles(variant)}
      className={className}
      title={`${title} (Admin Only)`}
      onMouseEnter={(e) => {
        e.target.style.opacity = '0.9';
        if (variant === 'outline' || variant === 'ghost') {
          e.target.style.backgroundColor = 'hsl(var(--destructive) / 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.opacity = '1';
        if (variant === 'outline') {
          e.target.style.backgroundColor = 'hsl(var(--background))';
        } else if (variant === 'ghost') {
          e.target.style.backgroundColor = 'transparent';
        }
      }}
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