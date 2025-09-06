// Admin Authentication Utilities
import { supabase } from './supabase';

/**
 * Check if the current user is an admin
 * @returns {Promise<{isAdmin: boolean, role: string|null, user: object|null}>}
 */
export const checkAdminStatus = async () => {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { isAdmin: false, role: null, user: null };
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { isAdmin: false, role: null, user };
    }

    const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
    
    return {
      isAdmin,
      role: profile.role,
      user: {
        ...user,
        profile
      }
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return { isAdmin: false, role: null, user: null };
  }
};

/**
 * Check if user has specific admin permission
 * @param {string} permission - The permission to check
 * @returns {Promise<boolean>}
 */
export const hasAdminPermission = async (permission) => {
  const { isAdmin, role } = await checkAdminStatus();
  
  if (!isAdmin) return false;
  
  // Super admin has all permissions
  if (role === 'super_admin') return true;
  
  // Define permission levels
  const permissions = {
    'view_dashboard': ['admin', 'super_admin'],
    'manage_users': ['super_admin'],
    'manage_courses': ['admin', 'super_admin'],
    'view_support': ['admin', 'super_admin'],
    'manage_support': ['admin', 'super_admin'],
    'view_analytics': ['admin', 'super_admin'],
    'system_settings': ['super_admin'],
    'view_logs': ['super_admin']
  };
  
  return permissions[permission]?.includes(role) || false;
};

/**
 * Log admin action for audit trail
 * @param {string} action - The action performed
 * @param {string} targetType - Type of target (user, course, etc.)
 * @param {string} targetId - ID of the target
 * @param {object} details - Additional details
 */
export const logAdminAction = async (action, targetType = null, targetId = null, details = null) => {
  try {
    const { data, error } = await supabase.rpc('log_admin_action', {
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_details: details
    });
    
    if (error) {
      console.error('Error logging admin action:', error);
    }
    
    return data;
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

/**
 * Get admin dashboard statistics
 * @returns {Promise<object>}
 */
export const getAdminStats = async () => {
  try {
    // Get latest system stats
    const { data: stats, error: statsError } = await supabase
      .from('system_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (statsError) {
      console.error('Error fetching stats:', statsError);
      return null;
    }

    // Get recent activity
    const { data: recentLogs, error: logsError } = await supabase
      .from('admin_logs')
      .select(`
        *,
        admin:admin_id(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('Error fetching recent logs:', logsError);
    }

    return {
      stats,
      recentActivity: recentLogs || []
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return null;
  }
};

/**
 * Update system statistics
 * @returns {Promise<boolean>}
 */
export const updateSystemStats = async () => {
  try {
    const { error } = await supabase.rpc('update_system_stats');
    
    if (error) {
      console.error('Error updating system stats:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating system stats:', error);
    return false;
  }
};

/**
 * Get all users with pagination
 * @param {number} page - Page number (0-based)
 * @param {number} limit - Number of users per page
 * @param {string} search - Search term
 * @returns {Promise<{users: array, total: number}>}
 */
export const getUsers = async (page = 0, limit = 20, search = '') => {
  try {
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      console.error('Error fetching users:', error);
      return { users: [], total: 0 };
    }

    return { users: users || [], total: count || 0 };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { users: [], total: 0 };
  }
};

/**
 * Update user role
 * @param {string} userId - User ID
 * @param {string} newRole - New role (student, admin, super_admin)
 * @returns {Promise<boolean>}
 */
export const updateUserRole = async (userId, newRole) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }

    // Log the action
    await logAdminAction('update_user_role', 'user', userId, { new_role: newRole });
    
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const deleteUser = async (userId) => {
  try {
    // First delete from users table (this will cascade to other tables)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    // Log the action
    await logAdminAction('delete_user', 'user', userId);
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

/**
 * Get support queries with pagination
 * @param {number} page - Page number (0-based)
 * @param {number} limit - Number of queries per page
 * @param {string} status - Filter by status (pending, solved, unsolved)
 * @returns {Promise<{queries: array, total: number}>}
 */
export const getSupportQueries = async (page = 0, limit = 20, status = '') => {
  try {
    let query = supabase
      .from('support_queries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: queries, error, count } = await query
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      console.error('Error fetching support queries:', error);
      return { queries: [], total: 0 };
    }

    return { queries: queries || [], total: count || 0 };
  } catch (error) {
    console.error('Error fetching support queries:', error);
    return { queries: [], total: 0 };
  }
};

/**
 * Update support query status and response
 * @param {string} queryId - Query ID
 * @param {string} status - New status
 * @param {string} response - Admin response
 * @returns {Promise<boolean>}
 */
export const updateSupportQuery = async (queryId, status, response = '') => {
  try {
    const updateData = {
      status,
      admin_response: response,
      admin_response_at: new Date().toISOString()
    };

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      updateData.admin_id = user.id;
    }

    const { error } = await supabase
      .from('support_queries')
      .update(updateData)
      .eq('id', queryId);

    if (error) {
      console.error('Error updating support query:', error);
      return false;
    }

    // Log the action
    await logAdminAction('update_support_query', 'support_query', queryId, { status, response });
    
    return true;
  } catch (error) {
    console.error('Error updating support query:', error);
    return false;
  }
};