"use client";
import { useState } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

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

  // Virtual University Programs (BSSE and BSCS are the only active ones for now)
  const programmes = {
    "2-Year Programs": [
      { name: "Associate Degree in Commerce (ADC)", disabled: true },
      { name: "Associate Degree in Computer Science (ADCS)", disabled: true },
      { name: "Associate Degree in Business Administration (ADBA)", disabled: true },
      { name: "Associate Degree in Arts (ADA)", disabled: true },
      { name: "Associate Degree in Science (ADS)", disabled: true },
      { name: "Associate Degree in Education (ADE)", disabled: true },
      { name: "Associate Degree in Library and Information Science (ADLIS)", disabled: true },
      { name: "Associate Degree in Mass Communication (ADMC)", disabled: true },
      { name: "Associate Degree in Public Administration (ADPA)", disabled: true },
      { name: "Associate Degree in Islamic Studies (ADIS)", disabled: true },
      { name: "Associate Degree in Economics (ADE)", disabled: true },
      { name: "Associate Degree in Mathematics (ADM)", disabled: true },
      { name: "Associate Degree in Statistics (ADS)", disabled: true },
      { name: "Associate Degree in Psychology (ADP)", disabled: true },
      { name: "Associate Degree in Sociology (ADS)", disabled: true }
    ],
    "4-Year Programs": [
      { name: "Bachelor of Science in Software Engineering (BSSE)", disabled: false },
      { name: "Bachelor of Science in Computer Science (BSCS)", disabled: false },
      { name: "Bachelor of Business Administration (BBA)", disabled: true },
      { name: "Bachelor of Science in Information Technology (BSIT)", disabled: true },
      { name: "Bachelor of Science in Data Science (BSDS)", disabled: true },
      { name: "Bachelor of Science in Artificial Intelligence (BSAI)", disabled: true },
      { name: "Bachelor of Commerce (B.Com)", disabled: true },
      { name: "Bachelor of Arts (BA)", disabled: true },
      { name: "Bachelor of Science (BS)", disabled: true },
      { name: "Bachelor of Education (B.Ed)", disabled: true },
      { name: "Bachelor of Library and Information Science (BLIS)", disabled: true },
      { name: "Bachelor of Mass Communication (BMC)", disabled: true },
      { name: "Bachelor of Public Administration (BPA)", disabled: true },
      { name: "Bachelor of Islamic Studies (BIS)", disabled: true },
      { name: "Bachelor of Economics (BE)", disabled: true },
      { name: "Bachelor of Mathematics (BM)", disabled: true },
      { name: "Bachelor of Statistics (BS)", disabled: true },
      { name: "Bachelor of Psychology (BP)", disabled: true },
      { name: "Bachelor of Sociology (BS)", disabled: true },
      { name: "Bachelor of English (BA English)", disabled: true },
      { name: "Bachelor of Urdu (BA Urdu)", disabled: true },
      { name: "Bachelor of Arabic (BA Arabic)", disabled: true },
      { name: "Bachelor of Persian (BA Persian)", disabled: true },
      { name: "Bachelor of History (BA History)", disabled: true },
      { name: "Bachelor of Political Science (BA Political Science)", disabled: true },
      { name: "Bachelor of International Relations (BA IR)", disabled: true },
      { name: "Bachelor of Media Studies (BMS)", disabled: true },
      { name: "Bachelor of Fine Arts (BFA)", disabled: true },
      { name: "Bachelor of Design (BD)", disabled: true }
    ]
  };

  function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
  }
  function isStrongPassword(password) {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validation
    if (!name.trim()) {
      setError("Name is required");
      setIsLoading(false);
      return;
    }
    if (!isValidEmail(email)) {
      setError("Invalid email address");
      setIsLoading(false);
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Password must be at least 8 characters, include an uppercase letter, a number, and a symbol.");
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
          .from('users')
          .insert([
            {
              id: authData.user.id,
              name: name,
              email: email,
              programme: programme,
            }
          ])
          .select();

        if (profileError) {
          setError("Error saving user profile: " + profileError.message);
          setIsLoading(false);
          return;
        }
      }

      setSuccess("Registration successful! Redirecting to course selection...");
      
      // Store programme in localStorage for course selection
      localStorage.setItem('selectedProgramme', programme);
      
      // Redirect to course selection after 2 seconds
      setTimeout(() => {
        router.push(`/course-selection?programme=${encodeURIComponent(programme)}`);
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
      
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 relative z-10 border border-white/20">
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
              <p className="text-sm text-gray-500">Join our learning community</p>
            </div>
          </div>
          
          {/* Decorative element on the right */}
          <div className="hidden md:block">
            <div className="text-4xl">🎓</div>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-indigo-700 mb-2">Sign Up</div>
          <div className="text-sm text-gray-500">Create your student account</div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
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
            <label className="block text-gray-700 font-medium mb-1">Programme</label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
              value={programme}
              onChange={e => setProgramme(e.target.value)}
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
            <span className="text-xs text-gray-400 mt-1">Currently only BSSE and BSCS are available for enrollment</span>
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
            <span className="text-xs text-gray-400">Min 8 chars, 1 uppercase, 1 number, 1 symbol</span>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
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
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <a href="/login" className="text-indigo-600 hover:underline font-medium">Sign In</a>
        </div>
      </div>
    </div>
  );
} 