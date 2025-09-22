"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "./components/LoadingSpinner";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to signup page when user visits the root
    router.push("/signup");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Redirecting to Sign Up...</h1>
        <LoadingSpinner size="large" variant="primary" />
      </div>
    </div>
  );
}