"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminMiddleware from "../../../components/AdminMiddleware";
import { logAdminAction } from "../../../lib/adminAuth";
import { supabase } from "../../../lib/supabase";
import LoadingSpinner from "../../components/LoadingSpinner";

const AdminSettings = ({ adminData }) => {
  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [saveLoading, setSaveLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadSettingsData();
    logAdminAction("view_settings");
  }, []);

  const loadSettingsData = async () => {
    try {
      setLoading(true);

      // Load admin settings
      const { data: adminSettings, error: settingsError } = await supabase
        .from("admin_settings")
        .select("*")
        .order("created_at", { ascending: false });

      if (settingsError) {
        console.error("Error fetching settings:", settingsError);
      }

      // Convert settings array to object for easier handling
      const settingsObj = {};
      if (adminSettings) {
        adminSettings.forEach((setting) => {
          settingsObj[setting.setting_key] = setting.setting_value;
        });
      }
      setSettings(settingsObj);

      // Load recent admin logs
      const { data: adminLogs, error: logsError } = await supabase
        .from("admin_logs")
        .select(
          `
          *,
          admin:admin_id(name, email)
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsError) {
        console.error("Error fetching logs:", logsError);
      } else {
        setLogs(adminLogs || []);
      }
    } catch (err) {
      console.error("Error loading settings data:", err);
      setError("Failed to load settings data");
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key, value) => {
    try {
      setSaveLoading(true);

      const { error } = await supabase.from("admin_settings").upsert(
        {
          setting_key: key,
          setting_value: value,
          updated_by: adminData?.user?.id,
        },
        {
          onConflict: "setting_key",
        }
      );

      if (error) {
        console.error("Error saving setting:", error);
        setError("Failed to save setting");
        return false;
      }

      // Update local state
      setSettings((prev) => ({ ...prev, [key]: value }));

      // Log the action
      await logAdminAction("update_setting", "setting", key, { value });

      setSuccess("Setting saved successfully");
      return true;
    } catch (err) {
      console.error("Error saving setting:", err);
      setError("Failed to save setting");
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    await saveSetting(key, value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action) => {
    const icons = {
      view_dashboard: "📊",
      update_user_role: "👤",
      delete_user: "🗑️",
      update_support_query: "💬",
      admin_login: "🔐",
      admin_logout: "🚪",
      view_settings: "⚙️",
      update_setting: "🔧",
    };
    return icons[action] || "📝";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" variant="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/admin")}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                System Settings
              </h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                Super Admin Only
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
            <button
              onClick={() => setError("")}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
            <button
              onClick={() => setSuccess("")}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab("general")}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === "general"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                General Settings
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === "logs"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Admin Logs
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "general" ? (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                General Settings
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* System Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Name
                </label>
                <input
                  type="text"
                  value={settings.system_name || "StudentNest Admin"}
                  onChange={(e) =>
                    handleSettingChange("system_name", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter system name"
                />
              </div>

              {/* Maintenance Mode */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode === "true"}
                    onChange={(e) =>
                      handleSettingChange(
                        "maintenance_mode",
                        e.target.checked.toString()
                      )
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Maintenance Mode
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  When enabled, only admins can access the system
                </p>
              </div>

              {/* User Registration */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allow_user_registration !== "false"}
                    onChange={(e) =>
                      handleSettingChange(
                        "allow_user_registration",
                        e.target.checked.toString()
                      )
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Allow User Registration
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Allow new users to register accounts
                </p>
              </div>

              {/* Max Users */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Users
                </label>
                <input
                  type="number"
                  value={settings.max_users || "1000"}
                  onChange={(e) =>
                    handleSettingChange("max_users", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter maximum number of users"
                  min="1"
                />
              </div>

              {/* Support Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.support_email || ""}
                  onChange={(e) =>
                    handleSettingChange("support_email", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter support email address"
                />
              </div>

              {/* Session Timeout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.session_timeout || "60"}
                  onChange={(e) =>
                    handleSettingChange("session_timeout", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter session timeout in minutes"
                  min="5"
                  max="1440"
                />
              </div>

              {saveLoading && (
                <div className="text-center">
                  <LoadingSpinner size="small" variant="primary" />
                  <p
                    className="text-sm mt-2"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Saving...
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Admin Activity Logs
              </h2>
            </div>
            <div className="p-6">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No admin logs found
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded"
                    >
                      <span className="text-2xl">
                        {getActionIcon(log.action)}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {log.admin?.name ||
                              log.admin?.email ||
                              "Unknown Admin"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(log.created_at)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Action:{" "}
                          <span className="font-medium">
                            {log.action.replace("_", " ")}
                          </span>
                        </p>
                        {log.target_type && (
                          <p className="text-xs text-gray-500">
                            Target: {log.target_type}{" "}
                            {log.target_id && `(${log.target_id})`}
                          </p>
                        )}
                        {log.details && (
                          <p className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border">
                            {JSON.stringify(log.details, null, 2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const AdminSettingsPage = () => {
  return (
    <AdminMiddleware requiredPermission="system_settings">
      {(adminData) => <AdminSettings adminData={adminData} />}
    </AdminMiddleware>
  );
};

export default AdminSettingsPage;
