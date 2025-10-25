"use client";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import StudyBuddyLogo from "../components/StudyBuddyLogo";
import {
  performConnectivityCheck,
  addNetworkListeners,
} from "../../lib/networkUtils";
import {
  sanitizeInput,
  isValidEmail,
  checkRateLimit,
} from "../../lib/security";

function LoginPageComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [networkStatus, setNetworkStatus] = useState("online");
  const [connectivityIssue, setConnectivityIssue] = useState(false);
  const [sessionDebug, setSessionDebug] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";

  useEffect(() => {
    let isMounted = true;

    // Simple auth check on page load - if already logged in, redirect
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session && isMounted) {
          window.location.href = redirectTo;
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth();

    // Add network event listeners
    const cleanup = addNetworkListeners(
      () => {
        setNetworkStatus("online");
        setConnectivityIssue(false);
      },
      () => {
        setNetworkStatus("offline");
        setConnectivityIssue(true);
        setError(
          "You appear to be offline. Please check your internet connection."
        );
      }
    );

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [redirectTo, router]);

  // Debug function to check current session
  const checkCurrentSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        setSessionDebug(`Error: ${error.message}`);
      } else if (session) {
        setSessionDebug(`Logged in as: ${session.user.email}`);
      } else {
        setSessionDebug("No active session");
      }
    } catch (err) {
      setSessionDebug(`Exception: ${err.message}`);
    }
  };

  const checkConnectivity = async () => {
    // Simplified check - only verify browser online status
    if (!navigator.onLine) {
      setConnectivityIssue(true);
      setError(
        "You appear to be offline. Please check your internet connection."
      );
      return false;
    }
    return true;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Rate limiting check
    if (!checkRateLimit("login", 5, 60000)) {
      setError("Too many login attempts. Please wait a minute.");
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

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
        console.log("Attempting login with email:", email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        console.log("Login response:", {
          data: !!data.user,
          error: error?.message,
        });

        if (error) {
          // Check if it's a network error that we should retry
          if (
            error.message.includes("Failed to fetch") ||
            error.message.includes("Network")
          ) {
            retryCount++;
            if (retryCount < maxRetries) {
              setError(
                `Connection failed. Retrying... (${retryCount}/${maxRetries})`
              );

              // Check connectivity again before retrying
              const stillConnected = await checkConnectivity();
              if (!stillConnected) {
                setIsLoading(false);
                return;
              }

              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount)
              ); // Exponential backoff
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

          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
          continue;
        } else {
          setConnectivityIssue(true);
          setError(
            "Network connection failed. Please check your internet connection and try again."
          );
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
            .from("users")
            .select("programme, role")
            .eq("id", userData.user.id)
            .single();
          profileData = profile;
          isAdmin =
            profile?.role === "admin" || profile?.role === "super_admin";
        } catch (profileError) {
          // If users table doesn't exist or user not found, create a basic entry
          console.log("No profile found, creating basic user entry");

          try {
            await supabase
              .from("users")
              .insert({
                id: userData.user.id,
                email: userData.user.email,
                name: userData.user.email,
                role: "student",
                programme: "CS",
              })
              .single();
          } catch (insertError) {
            console.log(
              "Could not create user entry, proceeding without profile"
            );
          }
        }

        if (isAdmin) {
          setSuccess("Admin login successful! Redirecting to admin panel...");

          // Log admin login (optional, don't fail if it doesn't work)
          try {
            const { logAdminAction } = await import("../../lib/adminAuth");
            await logAdminAction("admin_login");
          } catch (logError) {
            console.error("Error logging admin action:", logError);
          }

          // Immediate redirect to admin panel
          setTimeout(() => {
            window.location.href = "/admin";
          }, 500);
        } else {
          setSuccess("Login successful! Redirecting to dashboard...");

          if (profileData?.programme) {
            localStorage.setItem("selectedProgramme", profileData.programme);
          } else {
            // Default to CS program if no profile
            localStorage.setItem("selectedProgramme", "CS");
          }

          // Immediate redirect to dashboard or redirect URL
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 500);
        }
      }
    } catch (error) {
      setError("Login failed: Database error granting user");
      console.error("Login error:", error);
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
        type: "signup",
        email: email,
      });

      if (error) {
        setError("Error resending confirmation: " + error.message);
      } else {
        setSuccess(
          "Confirmation email sent! Please check your inbox and spam folder."
        );
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
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 50%, hsl(var(--accent)) 100%)`,
        }}
      ></div>

      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Geometric shapes for academic feel */}
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, transparent 100%)`,
          }}
        ></div>
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(225deg, hsl(var(--secondary) / 0.2) 0%, transparent 100%)`,
          }}
        ></div>
        <div
          className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(45deg, hsl(var(--accent) / 0.2) 0%, transparent 100%)`,
          }}
        ></div>

        {/* Educational symbols */}
        <div className="absolute top-20 left-20 text-6xl text-white/10 animate-pulse">
          📚
        </div>
        <div
          className="absolute top-40 right-32 text-5xl text-white/10 animate-pulse"
          style={{ animationDelay: "1s" }}
        >
          🎓
        </div>
        <div
          className="absolute bottom-32 left-32 text-7xl text-white/10 animate-pulse"
          style={{ animationDelay: "2s" }}
        >
          ✏️
        </div>
        <div
          className="absolute bottom-20 right-20 text-4xl text-white/10 animate-pulse"
          style={{ animationDelay: "3s" }}
        >
          📝
        </div>
        <div
          className="absolute top-1/2 left-1/4 text-5xl text-white/10 animate-pulse"
          style={{ animationDelay: "4s" }}
        >
          🔬
        </div>
        <div
          className="absolute top-1/3 right-1/4 text-4xl text-white/10 animate-pulse"
          style={{ animationDelay: "5s" }}
        >
          💻
        </div>
        <div
          className="absolute top-2/3 left-1/3 text-6xl text-white/10 animate-pulse"
          style={{ animationDelay: "6s" }}
        >
          📖
        </div>
        <div
          className="absolute bottom-1/3 right-1/3 text-5xl text-white/10 animate-pulse"
          style={{ animationDelay: "7s" }}
        >
          🎯
        </div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-white/30 rounded-full animate-bounce"></div>
        <div
          className="absolute top-3/4 right-1/4 w-1 h-1 bg-white/40 rounded-full animate-bounce"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-1.5 h-1.5 bg-white/25 rounded-full animate-bounce"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/2 w-1 h-1 bg-white/35 rounded-full animate-bounce"
          style={{ animationDelay: "1.5s" }}
        ></div>
      </div>

      <div
        className="backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md mx-4 relative z-10"
        style={{
          backgroundColor: `hsl(var(--card) / 0.95)`,
          border: `1px solid hsl(var(--border) / 0.2)`,
        }}
      >
        <div className="flex items-center justify-between mb-8">
          {/* StudyBuddy Logo */}
          <StudyBuddyLogo size="medium" showText={true} />
          <div>
            <h1
              className="text-2xl font-bold"
                style={{ color: `hsl(var(--primary))` }}
              >
                Student Portal
              </h1>
              <p
                className="text-sm"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                Welcome back
              </p>

              {/* Network Status Indicator */}
              <div className="mt-1 flex items-center">
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{
                    backgroundColor:
                      networkStatus === "online"
                        ? "hsl(var(--success))"
                        : "hsl(var(--destructive))",
                  }}
                ></div>
                <span
                  className="text-xs"
                  style={{
                    color:
                      networkStatus === "online"
                        ? "hsl(var(--success))"
                        : "hsl(var(--destructive))",
                  }}
                >
                  {networkStatus === "online" ? "Connected" : "Offline"}
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
          <div
            className="text-3xl font-bold mb-2"
            style={{ color: `hsl(var(--primary))` }}
          >
            Sign In
          </div>
          <div
            className="text-sm"
            style={{ color: `hsl(var(--muted-foreground))` }}
          >
            Access your student account
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block font-medium mb-1"
              style={{ color: `hsl(var(--card-foreground))` }}
            >
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
              style={{
                border: `1px solid hsl(var(--border))`,
                backgroundColor: `hsl(var(--background))`,
                color: `hsl(var(--foreground))`,
                "--tw-ring-color": `hsl(var(--ring))`,
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              className="block font-medium mb-1"
              style={{ color: `hsl(var(--card-foreground))` }}
            >
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
              style={{
                border: `1px solid hsl(var(--border))`,
                backgroundColor: `hsl(var(--background))`,
                color: `hsl(var(--foreground))`,
                "--tw-ring-color": `hsl(var(--ring))`,
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          {error && (
            <div
              className="text-sm p-3 rounded-lg border"
              style={{
                color: connectivityIssue
                  ? `hsl(var(--warning))`
                  : `hsl(var(--destructive))`,
                backgroundColor: connectivityIssue
                  ? `hsl(var(--warning) / 0.1)`
                  : `hsl(var(--destructive) / 0.1)`,
                borderColor: connectivityIssue
                  ? `hsl(var(--warning) / 0.2)`
                  : `hsl(var(--destructive) / 0.2)`,
              }}
            >
              {connectivityIssue && (
                <div className="flex items-center mb-2">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
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
          {success && (
            <div
              className="text-sm p-3 rounded-lg border"
              style={{
                color: `hsl(var(--success))`,
                backgroundColor: `hsl(var(--success) / 0.1)`,
                borderColor: `hsl(var(--success) / 0.2)`,
              }}
            >
              {success}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            style={{
              backgroundColor: isLoading
                ? `hsl(var(--muted))`
                : `hsl(var(--primary))`,
              color: isLoading
                ? `hsl(var(--muted-foreground))`
                : `hsl(var(--primary-foreground))`,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = `hsl(var(--primary) / 0.9)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = `hsl(var(--primary))`;
              }
            }}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Debug section */}
        <div
          className="mt-4 p-3 rounded-lg border"
          style={{
            backgroundColor: "hsl(var(--muted) / 0.1)",
            borderColor: "hsl(var(--border))",
          }}
        >
          <button
            type="button"
            onClick={checkCurrentSession}
            className="text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: "hsl(var(--secondary))",
              color: "hsl(var(--secondary-foreground))",
            }}
          >
            Check Session
          </button>
          {sessionDebug && (
            <div
              className="mt-2 text-xs"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {sessionDebug}
            </div>
          )}
        </div>

        {/* Resend Confirmation Button */}
        {!success && (
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={isLoading}
            className="w-full mt-2 font-medium py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: isLoading
                ? `hsl(var(--muted))`
                : `hsl(var(--secondary))`,
              color: isLoading
                ? `hsl(var(--muted-foreground))`
                : `hsl(var(--secondary-foreground))`,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = `hsl(var(--secondary) / 0.8)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = `hsl(var(--secondary))`;
              }
            }}
          >
            Resend Confirmation Email
          </button>
        )}

        <div
          className="mt-6 text-center text-sm"
          style={{ color: `hsl(var(--muted-foreground))` }}
        >
          Don't have an account?{" "}
          <a
            href="/signup"
            className="hover:underline font-medium"
            style={{ color: `hsl(var(--primary))` }}
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mainScreen min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginPageComponent />
    </Suspense>
  );
}
