"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function AuthGuard({ children, fallback = null }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        // Handle specific auth errors
        if (error) {
          if (error.message.includes('Auth session missing')) {
            console.log('Auth guard: No active session');
          } else {
            console.error('Auth guard error:', error);
          }
          setIsAuthenticated(false);
          setShowLoginMessage(true);
          setTimeout(() => {
            if (isMounted) {
              router.push('/login');
            }
          }, 1500); // Show message for 1.5 seconds before redirect
          return;
        }

        if (session) {
          console.log('Auth guard: User authenticated');
          setIsAuthenticated(true);
        } else {
          console.log('Auth guard: No session, redirecting to login');
          setIsAuthenticated(false);
          setShowLoginMessage(true);
          setTimeout(() => {
            if (isMounted) {
              router.push('/login');
            }
          }, 1500);
        }
      } catch (err) {
        console.log('Auth guard: Session check failed, likely not logged in');
        if (isMounted) {
          setIsAuthenticated(false);
          setShowLoginMessage(true);
          setTimeout(() => {
            if (isMounted) {
              router.push('/login');
            }
          }, 1500);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth guard - Auth state change:', event, session ? 'authenticated' : 'not authenticated');
        
        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          setIsAuthenticated(false);
          router.push('/login');
        } else if (session) {
          setIsAuthenticated(true);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  if (isLoading || showLoginMessage) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="text-center max-w-md mx-auto px-4">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg" style={{ color: 'hsl(var(--foreground))' }}>Checking authentication...</p>
            </>
          ) : showLoginMessage ? (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                  <svg className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V7a4 4 0 118 0v4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>Authentication Required</h2>
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>You need to log in to access this page.</p>
              <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Redirecting to login...</div>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect will happen in useEffect
  }

  return children;
}
