"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { name: "Home", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v6a2 2 0 002 2h2a2 2 0 002-2v-6m-6 0h6" /></svg>
  ), route: "/dashboard" },
  { name: "Calendar", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
  ), route: "/calendar" },
  { name: "Progress", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  ), route: "/progress" },
  { name: "Chat", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
  ), route: "/chat" },
  { name: "Notes", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
  ), route: "/notes" },
  { name: "Course Selection", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
  ), route: "/course-selection" },
  { name: "Student Services", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  ), route: "/student-services" },
  { name: "Contact Us", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  ), route: "/contact" },
];

export default function DashboardLayout({ children, currentPage }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  const studentName = session?.user?.name || "Student Name";
  const studentProgramme = session?.user?.programme || "Bachelor of Computer Science (BCS)";
  const studentSemester = session?.user?.semester || "Semester 3";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-20 md:w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 flex flex-col justify-between z-30 transition-all duration-200 shadow-lg">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 px-4 py-6">
            <span className="font-bold text-indigo-700 text-lg md:text-xl text-center md:text-left">Virtual University</span>
          </div>
          <nav className="flex-1">
            <ul className="space-y-1 mt-4">
              {navItems.map(item => (
                <li key={item.name}>
                  <a 
                    href={item.route} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group mx-2 ${
                      currentPage === item.route 
                        ? 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700' 
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 hover:text-indigo-700'
                    }`}
                  >
                    <span className={`w-7 h-7 flex items-center justify-center ${
                      currentPage === item.route ? 'text-indigo-800' : 'text-indigo-600 group-hover:text-indigo-800'
                    }`}>
                      {item.icon}
                    </span>
                    <span className="hidden md:inline text-base font-medium">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="px-4 py-6 text-xs text-gray-500 border-t border-gray-100 hidden md:block bg-gradient-to-t from-gray-50 to-transparent">
          <div className="font-bold text-indigo-700">Virtual University of Pakistan</div>
          <div>Federal Government University</div>
        </div>
      </aside>

      {/* Main content area (with top navbar) */}
      <div className="flex-1 min-h-screen md:ml-64 ml-20 flex flex-col">
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-20 px-4 bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 shadow-sm sticky top-0 z-20">
          <div className="font-bold text-xl text-indigo-700 tracking-wide">
            <span className="hidden sm:inline">LMS Learning Management System</span>
            <span className="sm:hidden">LMS</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Icon */}
            <button
              className="relative p-2 rounded-full hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 transition"
              onClick={() => router.push("/notifications")}
              aria-label="Notifications"
            >
              <svg className="w-7 h-7 text-indigo-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
            {/* Student Info */}
            <div className="hidden sm:block text-right">
              <div className="font-medium text-gray-700">{studentName}</div>
              <div className="text-xs text-gray-500">{studentProgramme}</div>
              <div className="text-xs text-gray-500">{studentSemester}</div>
            </div>
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                className="w-10 h-10 rounded-full border-2 border-indigo-200 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-200 hover:border-indigo-400 hover:from-indigo-200 hover:to-indigo-300 transition"
                onClick={() => setProfileOpen(v => !v)}
                aria-label="Profile"
              >
                <svg className="w-7 h-7 text-indigo-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.5-1.8 4.5-4.5S14.7 3 12 3 7.5 4.8 7.5 7.5 9.3 12 12 12zm0 2c-3 0-9 1.5-9 4.5V21h18v-2.5c0-3-6-4.5-9-4.5z" /></svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 bg-gradient-to-b from-white to-gray-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="font-medium text-gray-900">{studentName}</div>
                    <div className="text-sm text-gray-600">{studentProgramme}</div>
                    <div className="text-sm text-gray-600">{studentSemester}</div>
                  </div>
                  <a href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100">Profile</a>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100"
                  >Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>
        {/* Main content area */}
        <main className="flex-1 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
} 