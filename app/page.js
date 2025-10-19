"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndRedirect = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) return; // Prevent state updates if component unmounted

        if (error) {
          console.error("Auth error:", error);
          setIsChecking(false);
          return;
        }

        // Add a delay to prevent rapid redirects
        setTimeout(() => {
          if (!isMounted) return;

          if (session) {
            console.log("User authenticated, redirecting to home");
            router.replace("/home");
          } else {
            console.log("User not authenticated, redirecting to signup");
            router.replace("/signup");
          }
        }, 200);
      } catch (error) {
        console.error("Unexpected error checking auth:", error);
        if (isMounted) {
          router.replace("/signup");
        }
      } finally {
        if (isMounted) {
          setTimeout(() => setIsChecking(false), 300);
        }
      }
    };

    checkAuthAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return null; // This should not render as we redirect above
}
