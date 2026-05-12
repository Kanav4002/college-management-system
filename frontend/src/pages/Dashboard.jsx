import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import api from "../api/api";

const PANEL_CONFIG = {
  ADMIN: {
    title: "Admin Panel",
    description: "Manage users, courses, and system settings.",
    path: "/admin",
    icon: "admin_panel_settings",
  },
  MENTOR: {
    title: "Mentor Panel",
    description: "View assigned students, track progress, and give feedback.",
    path: "/mentor",
    icon: "groups",
  },
  STUDENT: {
    title: "Student Panel",
    description: "View courses, attendance, grades, and announcements.",
    path: "/student",
    icon: "school",
  },
};

const STATS_ENDPOINT = {
  ADMIN: "/complaints/stats/admin",
  MENTOR: "/complaints/stats/mentor",
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
          { label: "My Complaints", value: stats.total, icon: "receipt_long", color: "var(--primary)" },
          { label: "Pending", value: stats.pending, icon: "pending", color: "var(--error)" },
          { label: "Resolved", value: stats.resolved, icon: "task_alt", color: "var(--primary)" },
        ];
      case "MENTOR":
        return [
          { label: "To Review", value: stats.pending, icon: "pending_actions", color: "var(--tertiary)" },
          { label: "Approved", value: stats.approved, icon: "check_circle", color: "var(--primary)" },
          { label: "Rejected", value: stats.rejected, icon: "cancel", color: "var(--error)" },
        ];
      case "ADMIN":
        return [
          { label: "Total Complaints", value: stats.total, icon: "analytics", color: "var(--primary)" },
          { label: "Pending", value: stats.pending, icon: "pending", color: "var(--error)" },
          { label: "Resolved", value: stats.resolved, icon: "task_alt", color: "var(--primary)" },
        ];
      default:
        return [];
    }
  })();

  return (
    <AppShell title="Dashboard">
      <main className="max-w-7xl mx-auto px-2 py-3 space-y-8">
        <div>
          <h2 className="text-3xl font-semibold mb-1" style={{ color: "var(--on-surface)" }}>
            Welcome back!
          </h2>
          <p className="text-base" style={{ color: "var(--on-surface-variant)" }}>
            {auth?.name || auth?.email}
          </p>
        </div>

        {quickStats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {quickStats.map((s) => (
              <div
                key={s.label}
                className="stat-card group"
              >
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>
                    {s.label}
                  </p>
                  <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform" style={{ color: s.color }}>
                    {s.icon}
                  </span>
                </div>
                <p className="text-4xl font-semibold" style={{ color: "var(--on-surface)" }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Role Panel Card */}
          {panel && (
            <Link
              to={panel.path}
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary-container) 10%, transparent)" }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: "var(--primary-container)" }}>
                    {panel.icon}
                  </span>
                </div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
                  {panel.title}
                </h3>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
                {panel.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: "var(--primary)" }}>
                Go to panel
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </span>
            </Link>
          )}

          {/* Announcements Card */}
          <Link
            to="/announcements"
            className="card p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--tertiary-container) 10%, transparent)" }}>
                <span className="material-symbols-outlined text-2xl" style={{ color: "var(--tertiary-container)" }}>
                  campaign
                </span>
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
                Announcements
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
              Browse college announcements, events, and exam updates.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: "var(--primary)" }}>
              View announcements
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </span>
          </Link>

          {/* Leave Panel - Students only */}
          {role === "STUDENT" && (
            <Link
              to="/studentLeave"
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--secondary-container) 30%, transparent)" }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: "var(--secondary)" }}>
                    calendar_today
                  </span>
                </div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
                  Leave Panel
                </h3>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
                Apply and track your leaves and approvals.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: "var(--primary)" }}>
                Go to panel
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </span>
            </Link>
          )}

          {/* Admin: Manage Announcements */}
          {role === "ADMIN" && (
            <Link
              to="/manage-announcements"
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary-container) 10%, transparent)" }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: "var(--primary-container)" }}>
                    edit_calendar
                  </span>
                </div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
                  Manage Announcements
                </h3>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
                Create, edit, and publish announcements for students and mentors.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: "var(--primary)" }}>
                Manage announcements
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </span>
            </Link>
          )}

          {/* Admin: Group Management */}
          {role === "ADMIN" && (
            <Link
              to="/groups"
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--secondary-container) 30%, transparent)" }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: "var(--secondary)" }}>
                    group
                  </span>
                </div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
                  Group Management
                </h3>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
                Create and manage student groups, assign mentors, and organize batches.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: "var(--primary)" }}>
                Manage groups
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </span>
            </Link>
          )}

          {/* Group info card - Students and Mentors */}
          {auth?.groupName && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: "var(--primary)" }}>
                    groups
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
                    My Group
                  </h3>
                  <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                    {auth.groupName}
                  </p>
                </div>
              </div>
              <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                {role === "STUDENT" ? "Your assigned class/batch group." : "The group you mentor."}
              </p>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}

export default Dashboard;