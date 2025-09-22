"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AIChatInterface from '../components/AIChatInterface';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../components/ThemeProvider';

export default function AIChatPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-inter" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="text-center">
          <LoadingSpinner size="large" variant="primary" />
          <p className="text-lg mt-4" style={{ color: 'hsl(var(--foreground))' }}>Loading StudyBuddy AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center font-inter" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-3xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>StudyBuddy AI</h1>
          <p className="mb-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Please sign in to access your AI-powered study companion.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/login'}
              className="block w-full py-3 px-6 rounded-lg transition-colors font-medium shadow-md"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Sign In
            </button>
            <button
              onClick={() => window.location.href = '/signup'}
              className="block w-full py-3 px-6 rounded-lg transition-colors font-medium shadow-md border"
              style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))', borderColor: 'hsl(var(--border))' }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-inter" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Header */}
      <div className="shadow-sm border-b" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="w-full px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 rounded-lg transition-colors font-medium"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--card-foreground))' }}>
                  StudyBuddy AI
                </h1>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Your AI-powered study companion
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-all duration-200 hover:shadow-sm"
                style={{ 
                  backgroundColor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'hsl(var(--muted) / 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'hsl(var(--muted))';
                }}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Welcome, {user.email}
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-4 py-2 rounded-lg transition-colors font-medium"
                style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Screen Chat */}
      <div className="h-[calc(100vh-80px)] w-full">
        <div className="h-full" style={{ backgroundColor: 'hsl(var(--background))' }}>
          {/* Chat Interface */}
          <div className="h-full">
            <AIChatInterface user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}