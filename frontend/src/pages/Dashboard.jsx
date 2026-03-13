import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

const PANEL_CONFIG = {
  ADMIN: {
    title: "Admin Panel",
    description: "Manage users, courses, and system settings.",
    path: "/admin",
    accent: "blue",
  },
  MENTOR: {
    title: "Mentor Panel",
    description: "View assigned students, track progress, and give feedback.",
    path: "/mentor",
    accent: "indigo",
  },
  STUDENT: {
    title: "Student Panel",
    description: "View courses, attendance, grades, and announcements.",
    path: "/student",
    accent: "emerald",
  },
};

const STATS_ENDPOINT = {
  ADMIN:   "/complaints/stats/admin",
  MENTOR:  "/complaints/stats/mentor",
  STUDENT: "/complaints/stats/student",
};

function Dashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  const role = auth?.role;
  const panel = PANEL_CONFIG[role];

  useEffect(() => {
    if (!role || !STATS_ENDPOINT[role]) return;
    api.get(STATS_ENDPOINT[role])
      .then((res) => setStats(res.data))
      .catch(() => {}); // silently fail — stats are nice-to-have here
  }, [role]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* Build quick-glance cards depending on role */
  const quickStats = (() => {
    if (!stats) return [];
    switch (role) {
      case "STUDENT":
        return [
          { label: "My Complaints", value: stats.total,    icon: "📋", color: "text-gray-700"  },
          { label: "Pending",       value: stats.pending,  icon: "⏳", color: "text-yellow-600" },
          { label: "Resolved",      value: stats.resolved, icon: "🎉", color: "text-green-600" },
        ];
      case "MENTOR":
        return [
          { label: "To Review",  value: stats.pending,  icon: "⏳", color: "text-yellow-600" },
          { label: "Approved",   value: stats.approved, icon: "✅", color: "text-blue-600"   },
          { label: "Rejected",   value: stats.rejected, icon: "❌", color: "text-red-500"    },
        ];
      case "ADMIN":
        return [
          { label: "Total Complaints", value: stats.total,    icon: "📋", color: "text-gray-700"   },
          { label: "Pending",          value: stats.pending,  icon: "⏳", color: "text-yellow-600" },
          { label: "Approved",         value: stats.approved, icon: "✅", color: "text-blue-600"   },
          { label: "Resolved",         value: stats.resolved, icon: "🎉", color: "text-green-600"  },
        ];
      default:
        return [];
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {auth?.email}{" "}
              <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {role}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        <h2 className="text-xl font-semibold text-gray-800">
          Welcome back!
        </h2>

        {/* Quick Stats */}
        {quickStats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickStats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs font-medium text-gray-500">{s.label}</span>
                </div>
                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Panel Link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {panel && (
            <Link
              to={panel.path}
              className="block bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition p-6"
            >
              <h3 className="text-lg font-bold text-blue-600 mb-2">
                {panel.title}
              </h3>
              <p className="text-sm text-gray-500">{panel.description}</p>
              <span className="inline-block mt-4 text-xs font-medium text-blue-500">
                Go to panel →
              </span>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
