// Network utility functions for debugging connection issues

/**
 * Check if the browser is online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Test basic network connectivity
 */
export const testNetworkConnectivity = async () => {
  try {
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Test Supabase connectivity specifically
 */
export const testSupabaseConnectivity = async (supabaseUrl) => {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Supabase connectivity test failed:', error);
    return false;
  }
};

/**
 * Get detailed network information
 */
export const getNetworkInfo = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 'unknown',
    rtt: connection?.rtt || 'unknown',
    saveData: connection?.saveData || false
  };
};

/**
 * Comprehensive connectivity check
 */
export const performConnectivityCheck = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    browserOnline: isOnline(),
    networkInfo: getNetworkInfo()
  };

  try {
    results.internetConnectivity = await testNetworkConnectivity();
  } catch (error) {
    results.internetConnectivity = false;
    results.internetError = error.message;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      results.supabaseConnectivity = await testSupabaseConnectivity(supabaseUrl);
    } else {
      results.supabaseConnectivity = false;
      results.supabaseError = 'Supabase URL not configured';
    }
  } catch (error) {
    results.supabaseConnectivity = false;
    results.supabaseError = error.message;
  }

  return results;
};

/**
 * Add network event listeners
 */
export const addNetworkListeners = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};