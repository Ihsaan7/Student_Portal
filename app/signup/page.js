"use client";
import { useState } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import StudyBuddyLogo from "../components/StudyBuddyLogo";
import {
  sanitizeInput,
  isValidEmail as validateEmail,
  isStrongPassword as validatePassword,
  checkRateLimit,
} from "../../lib/security";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [programme, setProgramme] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // StudentNest Programs - Only BSSE and BSCS available
  const programmes = {
    "4-Year Programs": [
      {
        name: "Bachelor of Science in Software Engineering (BSSE)",
        disabled: false,
      },
      {
        name: "Bachelor of Science in Computer Science (BSCS)",
        disabled: false,
      },
    ],
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Rate limiting check
    if (!checkRateLimit("signup", 3, 60000)) {
      setError("Too many signup attempts. Please wait a minute.");
      return;
    }

    setIsLoading(true);

    // Validation with sanitization
    const sanitizedName = sanitizeInput(name);
    if (!sanitizedName.trim() || sanitizedName.length < 2) {
      setError("Please enter a valid name (at least 2 characters)");
      setIsLoading(false);
      return;
    }
    if (!validateEmail(email)) {
      setError("Invalid email address");
      setIsLoading(false);
      return;
    }
    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 characters with uppercase, lowercase, and numbers"
      );
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    if (!programme) {
      setError("Please select your programme");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      // 2. Save additional user data to our users table
      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .insert([
            {
              id: authData.user.id,
              name: name,
              email: email,
              programme: programme,
            },
          ])
          .select();

        if (profileError) {
          setError("Error saving user profile: " + profileError.message);
          setIsLoading(false);
          return;
        }
      }

      setSuccess("Registration successful! Redirecting to home...");

      // Store programme in localStorage for course selection
      localStorage.setItem("selectedProgramme", programme);

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/home");
      }, 2000);
    } catch (error) {
      setError("An unexpected error occurred: " + error.message);
    } finally {
      setIsLoading(false);
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
        className="backdrop-blur-md p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl mx-4 relative z-10"
        style={{
          backgroundColor: `hsl(var(--card) / 0.95)`,
          border: `1px solid hsl(var(--border) / 0.2)`,
        }}
      >
        {/* Header Section - Responsive Layout */}
        <div className="mb-8">
          {/* Logo and Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            {/* Logo - Responsive sizing */}
            <div className="flex justify-center sm:justify-start mb-4 sm:mb-0">
              <StudyBuddyLogo 
                size="medium" 
                showText={true} 
                className="scale-90 sm:scale-100" 
              />
            </div>
            
            {/* Decorative element - Hidden on small screens */}
            <div className="hidden lg:block">
              <div className="text-4xl">🎓</div>
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center sm:text-left">
            <h1
              className="text-xl sm:text-2xl font-bold mb-1"
              style={{ color: `hsl(var(--primary))` }}
            >
              Student Portal
            </h1>
            <p
              className="text-sm"
              style={{ color: `hsl(var(--muted-foreground))` }}
            >
              Join our learning community
            </p>
          </div>
        </div>

        <div className="text-center mb-6">
          <div
            className="text-3xl font-bold mb-2"
            style={{ color: `hsl(var(--primary))` }}
          >
            Sign Up
          </div>
          <div
            className="text-sm"
            style={{ color: `hsl(var(--muted-foreground))` }}
          >
            Create your student account
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block font-medium mb-1"
              style={{ color: `hsl(var(--card-foreground))` }}
            >
              Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
              style={{
                border: `1px solid hsl(var(--border))`,
                backgroundColor: `hsl(var(--background))`,
                color: `hsl(var(--foreground))`,
                "--tw-ring-color": `hsl(var(--ring))`,
              }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
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
              Programme
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
              style={{
                border: `1px solid hsl(var(--border))`,
                backgroundColor: `hsl(var(--background))`,
                color: `hsl(var(--foreground))`,
                "--tw-ring-color": `hsl(var(--ring))`,
              }}
              value={programme}
              onChange={(e) => setProgramme(e.target.value)}
              required
              disabled={isLoading}
            >
              <option value="">Select your programme</option>
              {Object.entries(programmes).map(([duration, programList]) => (
                <optgroup key={duration} label={duration}>
                  {programList.map((program) => (
                    <option
                      key={program.name}
                      value={program.name}
                      disabled={program.disabled}
                      className={program.disabled ? "text-gray-400" : ""}
                    >
                      {program.name} {program.disabled ? "(Coming Soon)" : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span
              className="text-xs mt-1"
              style={{ color: `hsl(var(--muted-foreground))` }}
            >
              Currently only BSSE and BSCS are available for enrollment
            </span>
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
            <span
              className="text-xs"
              style={{ color: `hsl(var(--muted-foreground))` }}
            >
              Min 8 chars, 1 uppercase, 1 number, 1 symbol
            </span>
          </div>
          <div>
            <label
              className="block font-medium mb-1"
              style={{ color: `hsl(var(--card-foreground))` }}
            >
              Confirm Password
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          {error && (
            <div
              className="text-sm p-3 rounded-lg"
              style={{
                color: `hsl(var(--destructive))`,
                backgroundColor: `hsl(var(--destructive) / 0.1)`,
                border: `1px solid hsl(var(--destructive) / 0.2)`,
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="text-sm p-3 rounded-lg"
              style={{
                color: `hsl(var(--success))`,
                backgroundColor: `hsl(var(--success) / 0.1)`,
                border: `1px solid hsl(var(--success) / 0.2)`,
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
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
        <div
          className="mt-6 text-center text-sm"
          style={{ color: `hsl(var(--muted-foreground))` }}
        >
          Already have an account?{" "}
          <a
            href="/login"
            className="hover:underline font-medium"
            style={{ color: `hsl(var(--primary))` }}
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
