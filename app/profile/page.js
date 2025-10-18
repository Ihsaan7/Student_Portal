"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "../components/ThemeProvider";

export default function ProfilePage() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Available animated avatars
  const avatars = [
    { id: 1, name: "Avatar 1", path: "/avatars/avatar1.svg" },
    { id: 2, name: "Avatar 2", path: "/avatars/avatar2.svg" },
    { id: 3, name: "Avatar 3", path: "/avatars/avatar3.svg" },
    { id: 4, name: "Avatar 4", path: "/avatars/avatar4.svg" },
    { id: 5, name: "Avatar 5", path: "/avatars/avatar5.svg" },
    { id: 6, name: "Avatar 6", path: "/avatars/avatar6.svg" },
    { id: 7, name: "Avatar 7", path: "/avatars/avatar7.svg" },
    { id: 8, name: "Avatar 8", path: "/avatars/avatar8.svg" },
  ];

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      setUser(authUser);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfile(profileData);
        setSelectedAvatar(profileData.avatar_url || "/avatars/avatar1.svg");
        setNewUsername(profileData.name || "");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAvatarUpdate() {
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("users")
        .update({ avatar_url: selectedAvatar })
        .eq("id", user.id);

      if (error) throw error;

      setProfile({ ...profile, avatar_url: selectedAvatar });
      setSuccess("Avatar updated successfully!");
      setShowAvatarModal(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to update avatar: " + error.message);
    }
  }

  async function handleUsernameUpdate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newUsername.trim()) {
      setError("Username cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ name: newUsername })
        .eq("id", user.id);

      if (error) throw error;

      setProfile({ ...profile, name: newUsername });
      setSuccess("Username updated successfully!");
      setShowUsernameModal(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to update username: " + error.message);
    }
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess("Password updated successfully!");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to update password: " + error.message);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: `hsl(var(--background))` }}
      >
        <div className="text-2xl" style={{ color: `hsl(var(--foreground))` }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: `hsl(var(--background))` }}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/home")}
            className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
            style={{
              backgroundColor: `hsl(var(--primary))`,
              color: `hsl(var(--primary-foreground))`,
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = `hsl(var(--primary) / 0.9)`;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = `hsl(var(--primary))`;
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </button>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: `hsl(var(--muted))`,
                color: `hsl(var(--muted-foreground))`,
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = `hsl(var(--muted) / 0.8)`;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = `hsl(var(--muted))`;
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
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
              style={{
                backgroundColor: `hsl(var(--destructive))`,
                color: `hsl(var(--destructive-foreground))`,
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = `hsl(var(--destructive) / 0.9)`;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = `hsl(var(--destructive))`;
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-100 border border-green-400 text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-100 border border-red-400 text-red-700">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div
          className="backdrop-blur-md rounded-3xl shadow-2xl p-8"
          style={{ backgroundColor: `hsl(var(--card) / 0.95)` }}
        >
          <h1
            className="text-3xl font-bold mb-8"
            style={{ color: `hsl(var(--primary))` }}
          >
            My Profile
          </h1>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative w-32 h-32 mb-4 cursor-pointer group"
              onClick={() => setShowAvatarModal(true)}
            >
              <div
                className="w-full h-full rounded-full overflow-hidden border-4"
                style={{ borderColor: `hsl(var(--primary))` }}
              >
                <img
                  src={profile?.avatar_url || "/avatars/avatar1.svg"}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <span className="text-white text-sm">Change Avatar</span>
              </div>
            </div>
            <button
              onClick={() => setShowAvatarModal(true)}
              className="px-6 py-2 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: `hsl(var(--primary))`,
                color: `hsl(var(--primary-foreground))`,
              }}
            >
              Choose Avatar
            </button>
          </div>

          {/* User Information */}
          <div className="space-y-6">
            {/* Username */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: `hsl(var(--muted) / 0.3)` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <label
                    className="text-sm font-medium"
                    style={{ color: `hsl(var(--muted-foreground))` }}
                  >
                    Username
                  </label>
                  <p
                    className="text-lg font-semibold"
                    style={{ color: `hsl(var(--foreground))` }}
                  >
                    {profile?.name || "No name set"}
                  </p>
                </div>
                <button
                  onClick={() => setShowUsernameModal(true)}
                  className="px-4 py-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: `hsl(var(--secondary))`,
                    color: `hsl(var(--secondary-foreground))`,
                  }}
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Email */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: `hsl(var(--muted) / 0.3)` }}
            >
              <label
                className="text-sm font-medium"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                Email
              </label>
              <p
                className="text-lg font-semibold"
                style={{ color: `hsl(var(--foreground))` }}
              >
                {user?.email}
              </p>
            </div>

            {/* Programme */}
            {profile?.programme && (
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: `hsl(var(--muted) / 0.3)` }}
              >
                <label
                  className="text-sm font-medium"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                >
                  Programme
                </label>
                <p
                  className="text-lg font-semibold"
                  style={{ color: `hsl(var(--foreground))` }}
                >
                  {profile.programme}
                </p>
              </div>
            )}

            {/* Password Reset */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: `hsl(var(--muted) / 0.3)` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <label
                    className="text-sm font-medium"
                    style={{ color: `hsl(var(--muted-foreground))` }}
                  >
                    Password
                  </label>
                  <p
                    className="text-lg font-semibold"
                    style={{ color: `hsl(var(--foreground))` }}
                  >
                    ••••••••
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: `hsl(var(--secondary))`,
                    color: `hsl(var(--secondary-foreground))`,
                  }}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Selection Modal */}
        {showAvatarModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAvatarModal(false)}
          >
            <div
              className="backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-2xl w-full"
              style={{ backgroundColor: `hsl(var(--card) / 0.95)` }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: `hsl(var(--primary))` }}
              >
                Choose Your Avatar
              </h2>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {avatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    className={`cursor-pointer rounded-lg p-2 transition-all duration-200 ${
                      selectedAvatar === avatar.path
                        ? "ring-4"
                        : "hover:scale-105"
                    }`}
                    style={{
                      borderColor:
                        selectedAvatar === avatar.path
                          ? `hsl(var(--primary))`
                          : "transparent",
                      ringColor: `hsl(var(--primary))`,
                    }}
                    onClick={() => setSelectedAvatar(avatar.path)}
                  >
                    <img
                      src={avatar.path}
                      alt={avatar.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleAvatarUpdate}
                  className="flex-1 py-3 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: `hsl(var(--primary))`,
                    color: `hsl(var(--primary-foreground))`,
                  }}
                >
                  Save Avatar
                </button>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="flex-1 py-3 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: `hsl(var(--secondary))`,
                    color: `hsl(var(--secondary-foreground))`,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Username Update Modal */}
        {showUsernameModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUsernameModal(false)}
          >
            <div
              className="backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-md w-full"
              style={{ backgroundColor: `hsl(var(--card) / 0.95)` }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: `hsl(var(--primary))` }}
              >
                Update Username
              </h2>
              <form onSubmit={handleUsernameUpdate} className="space-y-4">
                <div>
                  <label
                    className="block font-medium mb-2"
                    style={{ color: `hsl(var(--card-foreground))` }}
                  >
                    New Username
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      border: `1px solid hsl(var(--border))`,
                      backgroundColor: `hsl(var(--background))`,
                      color: `hsl(var(--foreground))`,
                    }}
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-lg transition-all duration-200"
                    style={{
                      backgroundColor: `hsl(var(--primary))`,
                      color: `hsl(var(--primary-foreground))`,
                    }}
                  >
                    Update Username
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUsernameModal(false)}
                    className="flex-1 py-3 rounded-lg transition-all duration-200"
                    style={{
                      backgroundColor: `hsl(var(--secondary))`,
                      color: `hsl(var(--secondary-foreground))`,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Update Modal */}
        {showPasswordModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <div
              className="backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-md w-full"
              style={{ backgroundColor: `hsl(var(--card) / 0.95)` }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: `hsl(var(--primary))` }}
              >
                Change Password
              </h2>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label
                    className="block font-medium mb-2"
                    style={{ color: `hsl(var(--card-foreground))` }}
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      border: `1px solid hsl(var(--border))`,
                      backgroundColor: `hsl(var(--background))`,
                      color: `hsl(var(--foreground))`,
                    }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label
                    className="block font-medium mb-2"
                    style={{ color: `hsl(var(--card-foreground))` }}
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      border: `1px solid hsl(var(--border))`,
                      backgroundColor: `hsl(var(--background))`,
                      color: `hsl(var(--foreground))`,
                    }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-lg transition-all duration-200"
                    style={{
                      backgroundColor: `hsl(var(--primary))`,
                      color: `hsl(var(--primary-foreground))`,
                    }}
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-3 rounded-lg transition-all duration-200"
                    style={{
                      backgroundColor: `hsl(var(--secondary))`,
                      color: `hsl(var(--secondary-foreground))`,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
