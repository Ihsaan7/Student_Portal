"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export function useAuthRedirect(redirectTo = '/home') {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const handleRedirect = (targetUrl) => {
      if (!mounted) return;
      
      console.log('Redirecting to:', targetUrl);
      
      // Use a small delay to ensure the auth state is properly updated
      setTimeout(() => {
        if (!mounted) return;
        
        try {
          // Try router.replace first
          router.replace(targetUrl);
        } catch (error) {
          console.error('Router replace failed, using window.location:', error);
          // Fallback to window.location
          window.location.href = targetUrl;
        }
      }, 100);
    };

    // Check current auth status
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth check error:', error);
          return;
        }
        
        if (session && mounted) {
          const targetUrl = redirectTo === '/login' ? '/home' : redirectTo;
          handleRedirect(targetUrl);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session ? 'authenticated' : 'not authenticated');
        
        if (event === 'SIGNED_IN' && session && mounted) {
          const targetUrl = redirectTo === '/login' ? '/home' : redirectTo;
          handleRedirect(targetUrl);
        }
      }
    );

    checkAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [redirectTo, router]);
}
