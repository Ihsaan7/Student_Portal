"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useTheme } from "./ThemeProvider";

// Utility function to check if admin is in user mode
const isAdminMode = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("admin_mode") === "true";
  }
  return false;
};

const getAdminData = () => {
  try {
    const adminMode = localStorage.getItem("admin_mode");
    const adminUserId = localStorage.getItem("admin_user_id");
    const role = localStorage.getItem("admin_role");
    const name = localStorage.getItem("admin_name");

    return adminMode === "true" ? { userId: adminUserId, role, name } : null;
  } catch (error) {
    return null;
  }
};

const clearAdminMode = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_mode");
    localStorage.removeItem("admin_user_id");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_name");
  }
};

const navItems = [
  {
    name: "Home",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
    route: "/home",
  },
  {
    name: "Calendar",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    route: "/calendar",
  },
  {
    name: "Progress",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    route: "/progress",
  },
  {
    name: "Chat",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    route: "/chat",
  },
  {
    name: "AI Assistant",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    route: "/ai-chat",
  },
  {
    name: "Notes",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
    route: "/notes",
  },
  {
    name: "Course Selection",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
    route: "/course-selection",
  },
  {
    name: "Student Services",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    route: "/student-services",
  },
];

export default function DashboardLayout({ children, currentPage }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Get user profile
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        setUserProfile(profile);

        // Check if admin is in user mode
        const isAdmin = isAdminMode();
        setAdminMode(isAdmin);
        if (isAdmin) {
          setAdminData(getAdminData());
        }

        // Load unread announcement count
        await loadUnreadAnnouncementCount(user.id);
      }
    };
    getUser();
  }, []);

  // Load unread announcement count
  const loadUnreadAnnouncementCount = async (userId) => {
    try {
      const { data, error } = await supabase.rpc(
        "get_unread_announcements_count",
        {
          user_uuid: userId,
        }
      );

      if (error) {
        console.error("Error loading unread announcement count:", error);
        return;
      }

      setUnreadAnnouncementCount(data || 0);
    } catch (error) {
      console.error("Error loading unread announcement count:", error);
    }
  };

  // Handle bell notification click
  const handleBellClick = async () => {
    // Navigate to calendar page with announcement section
    router.push("/calendar#announcements");

    // Mark all announcements as read for this user
    if (user && unreadAnnouncementCount > 0) {
      try {
        const { data: announcements } = await supabase
          .from("announcements")
          .select("id")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (announcements) {
          for (const announcement of announcements) {
            await supabase.rpc("mark_announcement_read", {
              announcement_uuid: announcement.id,
              user_uuid: user.id,
            });
          }
        }

        // Reset unread count
        setUnreadAnnouncementCount(0);
      } catch (error) {
        console.error("Error marking announcements as read:", error);
      }
    }
  };

  const studentName = userProfile?.name || user?.email || "Student Name";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleReturnToAdmin = () => {
    clearAdminMode();
    setAdminMode(false);
    setAdminData(null);
    router.push("/admin");
  };

  const handleAdminAction = (action, data) => {
    console.log(`Admin action: ${action}`, data);
    // This function can be used for admin-only actions
    // You can expand this based on specific requirements
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-screen w-20 md:w-64 flex flex-col justify-between z-30 transition-all duration-300 border-r"
        style={{
          backgroundColor: "hsl(var(--sidebar))",
          borderColor: "hsl(var(--sidebar-border))",
          boxShadow:
            theme === "dark" ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 px-4 py-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg"
              style={{
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              V
            </div>
            <span
              className="hidden md:inline font-bold text-lg"
              style={{ color: "hsl(var(--sidebar-foreground))" }}
            >
              StudentNest
            </span>
          </div>
          <nav className="flex-1">
            <ul className="space-y-3 mt-6 px-3">
              {navItems.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.route}
                    className={`flex items-center gap-4 px-4 py-4 rounded-lg transition-all duration-200 group ${
                      currentPage === item.route
                        ? "shadow-sm font-medium"
                        : "hover:shadow-sm"
                    }`}
                    style={{
                      backgroundColor:
                        currentPage === item.route
                          ? "hsl(var(--sidebar-accent))"
                          : "transparent",
                      color:
                        currentPage === item.route
                          ? "hsl(var(--sidebar-primary))"
                          : "hsl(var(--sidebar-foreground))",
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== item.route) {
                        e.target.style.backgroundColor =
                          "hsl(var(--sidebar-accent) / 0.5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== item.route) {
                        e.target.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <span className="w-6 h-6 flex items-center justify-center">
                      {item.icon}
                    </span>
                    <span className="hidden md:inline text-base font-medium">
                      {item.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div
          className="px-4 py-6 text-xs border-t hidden md:block"
          style={{
            color: "hsl(var(--sidebar-muted))",
            borderColor: "hsl(var(--sidebar-border))",
            backgroundColor:
              theme === "dark"
                ? "hsl(var(--sidebar) / 0.8)"
                : "linear-gradient(to top, #f8fafc, transparent)",
          }}
        >
          <div
            className="font-bold"
            style={{ color: "hsl(var(--sidebar-primary))" }}
          >
            StudentNest — Your learning hub
          </div>
          <div>Learn , Grow and Help others</div>
        </div>
      </aside>

      {/* Main content area (with top navbar) */}
      <div className="flex-1 min-h-screen md:ml-64 ml-20 flex flex-col">
        {/* Top Navbar */}
        <header
          className="flex items-center justify-between h-20 px-4 border-b sticky top-0 z-20 backdrop-blur-sm"
          style={{
            backgroundColor: "hsl(var(--header))",
            borderColor: "hsl(var(--border))",
            boxShadow:
              theme === "dark" ? "none" : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            className="font-bold text-xl tracking-wide"
            style={{ color: "hsl(var(--foreground))" }}
          >
            <span className="hidden sm:inline">
              LMS Learning Management System
            </span>
            <span className="sm:hidden">LMS</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200 hover:shadow-sm"
              style={{
                backgroundColor: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "hsl(var(--muted) / 0.8)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "hsl(var(--muted))";
              }}
            >
              {theme === "dark" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
            {/* Bell Notification Icon */}
            <button
              className="relative p-2 rounded-lg transition-all duration-200 hover:shadow-sm"
              onClick={handleBellClick}
              aria-label="Announcements"
              style={{
                backgroundColor: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "hsl(var(--muted) / 0.8)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "hsl(var(--muted))";
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadAnnouncementCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                  style={{ backgroundColor: "hsl(var(--destructive))" }}
                >
                  {unreadAnnouncementCount > 9 ? "9+" : unreadAnnouncementCount}
                </span>
              )}
            </button>
            {/* Student Name Only */}
            <div className="hidden sm:block text-right">
              <div
                className="font-medium"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {studentName}
              </div>
            </div>
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:shadow-sm"
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="Profile"
                style={{
                  borderColor: "hsl(var(--border))",
                  backgroundColor: "hsl(var(--muted))",
                  color: "hsl(var(--muted-foreground))",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "hsl(var(--primary))";
                  e.target.style.backgroundColor = "hsl(var(--muted) / 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "hsl(var(--border))";
                  e.target.style.backgroundColor = "hsl(var(--muted))";
                }}
              >
                <svg
                  className="w-7 h-7"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.7 0 4.5-1.8 4.5-4.5S14.7 3 12 3 7.5 4.8 7.5 7.5 9.3 12 12 12zm0 2c-3 0-9 1.5-9 4.5V21h18v-2.5c0-3-6-4.5-9-4.5z" />
                </svg>
              </button>
              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg py-2 z-50"
                  style={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <div
                    className="px-4 py-2 border-b"
                    style={{ borderColor: "hsl(var(--border))" }}
                  >
                    <div
                      className="font-medium"
                      style={{ color: "hsl(var(--popover-foreground))" }}
                    >
                      {studentName}
                    </div>
                    {adminMode && (
                      <div
                        className="text-xs font-medium mt-1"
                        style={{ color: "hsl(var(--destructive))" }}
                      >
                        Admin Mode Active
                      </div>
                    )}
                  </div>
                  <a
                    href="/profile"
                    className="block px-4 py-2 transition-colors hover:shadow-sm rounded-md mx-1"
                    style={{ color: "hsl(var(--popover-foreground))" }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "hsl(var(--muted))";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    Profile
                  </a>
                  {adminMode && (
                    <button
                      onClick={handleReturnToAdmin}
                      className="w-full text-left px-4 py-2 font-medium transition-colors hover:shadow-sm rounded-md mx-1"
                      style={{ color: "hsl(var(--destructive))" }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor =
                          "hsl(var(--destructive) / 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "transparent";
                      }}
                    >
                      Return to Admin Panel
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 transition-colors hover:shadow-sm rounded-md mx-1"
                    style={{ color: "hsl(var(--popover-foreground))" }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor =
                        "hsl(var(--destructive) / 0.1)";
                      e.target.style.color = "hsl(var(--destructive))";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "hsl(var(--popover-foreground))";
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Admin Mode Banner */}
        {adminMode && (
          <div
            className="border-l-4 p-4 mx-6 mt-4 rounded-lg"
            style={{
              backgroundColor: "hsl(var(--destructive) / 0.1)",
              borderColor: "hsl(var(--destructive))",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{ color: "hsl(var(--destructive))" }}
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span
                  className="font-medium"
                  style={{ color: "hsl(var(--destructive))" }}
                >
                  Admin Mode: Viewing as User | Admin:{" "}
                  {adminData?.role === "super_admin" ? "Super Admin" : "Admin"}{" "}
                  ({adminData?.name || "Loading..."})
                </span>
              </div>
              <button
                onClick={handleReturnToAdmin}
                className="font-medium transition-colors px-4 py-1 rounded-md"
                style={{
                  color: "hsl(var(--destructive))",
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--destructive))",
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = "0.8";
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = "1";
                }}
              >
                ← Return to Admin Panel
              </button>
            </div>
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
