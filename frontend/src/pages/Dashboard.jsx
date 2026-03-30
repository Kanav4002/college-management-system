import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import api from "../api/api";

const PANEL_CONFIG = {
  ADMIN: {
    title: "Admin Panel",
    description: "Manage users, courses, and system settings.",
    path: "/admin",
  },
  MENTOR: {
    title: "Mentor Panel",
    description: "View assigned students, track progress, and give feedback.",
    path: "/mentor",
  },
  STUDENT: {
    title: "Student Panel",
    description: "View courses, attendance, grades, and announcements.",
    path: "/student",
  },

  // ================= DUTY LEAVE PANEL CONFIG =================
  DUTY_LEAVE: {
    title: "Duty Leave Panel",
    description: "Apply and track your duty leaves and approvals.",
    path: "/studentLeave",
  },
  // ==========================================================
};

const STATS_ENDPOINT = {
  ADMIN:   "/complaints/stats/admin",
  MENTOR:  "/complaints/stats/mentor",
  STUDENT: "/complaints/stats/student",
};

function Dashboard() {
  const { auth } = useAuth();
  const [stats, setStats] = useState(null);

  const role = auth?.role;
  const panel = PANEL_CONFIG[role];

  useEffect(() => {
    if (!role || !STATS_ENDPOINT[role]) return;
    api.get(STATS_ENDPOINT[role])
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, [role]);

  const quickStats = (() => {
    if (!stats) return [];
    switch (role) {
      case "STUDENT":
        return [
          { label: "My Complaints", value: stats.total,    icon: "📋", color: "var(--text-primary)"  },
          { label: "Pending",       value: stats.pending,  icon: "⏳", color: "#ca8a04" },
          { label: "Resolved",      value: stats.resolved, icon: "🎉", color: "#16a34a" },
        ];
      case "MENTOR":
        return [
          { label: "To Review",  value: stats.pending,  icon: "⏳", color: "#ca8a04" },
          { label: "Approved",   value: stats.approved, icon: "✅", color: "#2563eb" },
          { label: "Rejected",   value: stats.rejected, icon: "❌", color: "#ef4444" },
        ];
      case "ADMIN":
        return [
          { label: "Total Complaints", value: stats.total,    icon: "📋", color: "var(--text-primary)" },
          { label: "Pending",          value: stats.pending,  icon: "⏳", color: "#ca8a04" },
          { label: "Approved",         value: stats.approved, icon: "✅", color: "#2563eb" },
          { label: "Resolved",         value: stats.resolved, icon: "🎉", color: "#16a34a" },
        ];
      default:
        return [];
    }
  })();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-body)" }}>
      <Navbar title="Dashboard" />

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Welcome back!
        </h2>

        {quickStats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickStats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl shadow-sm p-5"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    {s.label}
                  </span>
                </div>
                <p className="text-3xl font-extrabold" style={{ color: s.color }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* ================= STUDENT PANEL ================= */}
          {panel && (
            <Link
              to={panel.path}
              className="block rounded-2xl shadow-sm hover:shadow-md transition p-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--accent)" }}>
                {panel.title}
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {panel.description}
              </p>
              <span className="inline-block mt-4 text-xs font-medium" style={{ color: "var(--accent)" }}>
                Go to panel →
              </span>
            </Link>
          )}
          {/* ================================================= */}


          {/* ================= DUTY LEAVE PANEL ================= */}
          {role === "STUDENT" && (
            <Link
              to="/studentLeave"
              className="block rounded-2xl shadow-sm hover:shadow-md transition p-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--accent)" }}>
                Duty Leave Panel
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Apply and track your duty leaves and approvals.
              </p>
              <span className="inline-block mt-4 text-xs font-medium" style={{ color: "var(--accent)" }}>
                Go to panel →
              </span>
            </Link>
          )}
          {/* ==================================================== */}


          {/* Group Management link — Admin only */}
          {role === "ADMIN" && (
            <Link
              to="/groups"
              className="block rounded-2xl shadow-sm hover:shadow-md transition p-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--accent)" }}>
                Group Management
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Create and manage student groups, assign mentors, and organize batches.
              </p>
              <span className="inline-block mt-4 text-xs font-medium" style={{ color: "var(--accent)" }}>
                Manage groups →
              </span>
            </Link>
          )}

          {/* Group info card — Students and Mentors */}
          {auth?.groupName && (
            <div
              className="rounded-2xl shadow-sm p-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-bold" style={{ color: "var(--accent)" }}>
                  My Group
                </h3>
              </div>
              <p className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {auth.groupName}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {role === "STUDENT" ? "Your assigned class/batch group." : "The group you mentor."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;