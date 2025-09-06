"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { performConnectivityCheck, addNetworkListeners } from "../../lib/networkUtils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [networkStatus, setNetworkStatus] = useState("online");
  const [connectivityIssue, setConnectivityIssue] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Add network event listeners
    const cleanup = addNetworkListeners(
      () => {
        setNetworkStatus("online");
        setConnectivityIssue(false);
      },
      () => {
        setNetworkStatus("offline");
        setConnectivityIssue(true);
        setError("You appear to be offline. Please check your internet connection.");
      }
    );
    
    return cleanup;
  }, []);

  const checkConnectivity = async () => {
    const report = await performConnectivityCheck();
    
    if (!report.browserOnline) {
      setConnectivityIssue(true);
      setError("Your browser reports you are offline. Please check your internet connection.");
      return false;
    }
    
    if (!report.internetConnectivity) {
      setConnectivityIssue(true);
      setError("Cannot reach the internet. Please check your network connection.");
      return false;
    }
    
    if (!report.supabaseConnectivity) {
      setConnectivityIssue(true);
      setError("Cannot reach authentication servers. Please try again in a moment.");
      return false;
    }
    
    return true;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    setConnectivityIssue(false);

    // First check connectivity
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      setIsLoading(false);
      return;
    }

    // Retry logic for network issues
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          // Check if it's a network error that we should retry
          if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
            retryCount++;
            if (retryCount < maxRetries) {
              setError(`Connection failed. Retrying... (${retryCount}/${maxRetries})`);
              
              // Check connectivity again before retrying
              const stillConnected = await checkConnectivity();
              if (!stillConnected) {
                setIsLoading(false);
                return;
              }
              
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              continue;
            }
          }
          setError(`Login failed: ${error.message}`);
          setIsLoading(false);
          return;
        }

        // Success - break out of retry loop
        break;
      } catch (networkError) {
        retryCount++;
        if (retryCount < maxRetries) {
          setError(`Network error. Retrying... (${retryCount}/${maxRetries})`);
          
          // Check connectivity again before retrying
          const stillConnected = await checkConnectivity();
          if (!stillConnected) {
            setIsLoading(false);
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        } else {
          setConnectivityIssue(true);
          setError('Network connection failed. Please check your internet connection and try again.');
          setIsLoading(false);
          return;
        }
      }
    }

    // If we get here, login was successful
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData.user) {
        // Try to get user profile data, but don't fail if it doesn't exist
        let profileData = null;
        let isAdmin = false;
        
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('programme, role')
            .eq('id', userData.user.id)
            .single();
          profileData = profile;
          isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
        } catch (profileError) {
          // If users table doesn't exist or user not found, create a basic entry
          console.log('No profile found, creating basic user entry');
          
          try {
            await supabase
              .from('users')
              .insert({
                id: userData.user.id,
                email: userData.user.email,
                name: userData.user.email,
                role: 'student',
                programme: 'CS'
              })
              .single();
          } catch (insertError) {
            console.log('Could not create user entry, proceeding without profile');
          }
        }
        
        if (isAdmin) {
          setSuccess("Admin login successful! Redirecting to admin panel...");
          
          // Log admin login (optional, don't fail if it doesn't work)
          try {
            const { logAdminAction } = await import('../../lib/adminAuth');
            await logAdminAction('admin_login');
          } catch (logError) {
            console.error('Error logging admin action:', logError);
          }
          
          // Redirect to admin panel
          setTimeout(() => {
            router.push('/admin');
          }, 2000);
        } else {
          setSuccess("Login successful! Redirecting to dashboard...");
          
          if (profileData?.programme) {
            localStorage.setItem('selectedProgramme', profileData.programme);
          } else {
            // Default to CS program if no profile
            localStorage.setItem('selectedProgramme', 'CS');
          }
          
          // Redirect to student dashboard
          setTimeout(() => {
            router.push('/home');
          }, 2000);
        }
      }

    } catch (error) {
      setError("Login failed: Database error granting user");
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    setIsResending(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        setError("Error resending confirmation: " + error.message);
      } else {
        setSuccess("Confirmation email sent! Please check your inbox and spam folder.");
      }
    } catch (error) {
      setError("An unexpected error occurred: " + error.message);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="mainScreen min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Enhanced Study-themed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Geometric shapes for academic feel */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-400/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-full blur-3xl"></div>
        
        {/* Educational symbols */}
        <div className="absolute top-20 left-20 text-6xl text-white/10 animate-pulse">📚</div>
        <div className="absolute top-40 right-32 text-5xl text-white/10 animate-pulse" style={{animationDelay: '1s'}}>🎓</div>
        <div className="absolute bottom-32 left-32 text-7xl text-white/10 animate-pulse" style={{animationDelay: '2s'}}>✏️</div>
        <div className="absolute bottom-20 right-20 text-4xl text-white/10 animate-pulse" style={{animationDelay: '3s'}}>📝</div>
        <div className="absolute top-1/2 left-1/4 text-5xl text-white/10 animate-pulse" style={{animationDelay: '4s'}}>🔬</div>
        <div className="absolute top-1/3 right-1/4 text-4xl text-white/10 animate-pulse" style={{animationDelay: '5s'}}>💻</div>
        <div className="absolute top-2/3 left-1/3 text-6xl text-white/10 animate-pulse" style={{animationDelay: '6s'}}>📖</div>
        <div className="absolute bottom-1/3 right-1/3 text-5xl text-white/10 animate-pulse" style={{animationDelay: '7s'}}>🎯</div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-white/30 rounded-full animate-bounce"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 bg-white/25 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 right-1/2 w-1 h-1 bg-white/35 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md mx-4 relative z-10 border border-white/20">
        <div className="flex items-center justify-between mb-8">
          {/* Logo on the left */}
          <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12">
              <Image
                src="/R.jpg"
                alt="Logo"
                fill
                className="rounded-lg object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-indigo-700">Student Portal</h1>
              <p className="text-sm text-gray-500">Welcome back</p>
              
              {/* Network Status Indicator */}
              <div className="mt-1 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  networkStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-xs ${
                  networkStatus === 'online' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {networkStatus === 'online' ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Decorative element on the right */}
          <div className="hidden md:block">
            <div className="text-4xl">🎓</div>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-indigo-700 mb-2">Sign In</div>
          <div className="text-sm text-gray-500">Access your student account</div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className={`text-sm p-3 rounded-lg border ${
              connectivityIssue 
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'bg-red-50 border-red-200 text-red-500'
            }`}>
              {connectivityIssue && (
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Connection Issue</span>
                </div>
              )}
              {error}
              {connectivityIssue && (
                <div className="mt-2 text-sm">
                  <p>Try:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Checking your internet connection</li>
                    <li>Refreshing the page</li>
                    <li>Trying again in a few moments</li>
                  </ul>
                </div>
              )}
            </div>
          )}
          {success && <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">{success}</div>}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl ${
              isLoading 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        {/* Resend Confirmation Button */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={isResending || !email}
            className={`text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors ${
              isResending || !email ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isResending ? 'Sending...' : 'Resend Confirmation Email'}
          </button>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account? <a href="/signup" className="text-indigo-600 hover:underline font-medium">Sign Up</a>
        </div>
      </div>
    </div>
  );
}