"use client";
import { useState } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        setSuccess("Login successful! Redirecting to dashboard...");
        
        // Get user profile data
        const { data: profileData } = await supabase
          .from('users')
          .select('programme')
          .eq('id', data.user.id)
          .single();

        if (profileData?.programme) {
          localStorage.setItem('selectedProgramme', profileData.programme);
        }
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }

    } catch (error) {
      setError("An unexpected error occurred: " + error.message);
    } finally {
      setIsLoading(false);
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
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}
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
        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account? <a href="/signup" className="text-indigo-600 hover:underline font-medium">Sign Up</a>
        </div>
      </div>
    </div>
  );
} 