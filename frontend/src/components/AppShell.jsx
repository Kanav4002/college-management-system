import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notificationApi";

const ROLE_LABELS = {
  STUDENT: "Student",
  MENTOR: "Mentor",
  ADMIN: "Admin",
};

function Icon({ path }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default function AppShell({ title, children }) {
  const { auth, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const role = auth?.role;
  const roleLabel = ROLE_LABELS[role] || role || "";

  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!auth) {
      setNotifications([]);
      return;
    }

    async function loadNotifications() {
      try {
        const response = await getNotifications();
        setNotifications(response.data.data || []);
      } catch {
        setNotifications([]);
      }
    }

    loadNotifications();
  }, [auth]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((items) =>
        items.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
    } catch {
      // ignore
    }
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
    { to: "/announcements", label: "Announcements", icon: "M12 8v8m-4-4h8" },
  ];

  if (role === "STUDENT") {
    navItems.push(
      { to: "/student", label: "Student Panel", icon: "M15 19a6 6 0 10-12 0m12 0h3m-3 0a3 3 0 003-3v-1a3 3 0 00-3-3m-6-4a3 3 0 100-6 3 3 0 000 6z" },
      { to: "/studentLeave", label: "Leaves", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
      { to: "/submit-complaint", label: "Raise Complaint", icon: "M12 4v16m8-8H4" }
    );
  }

  if (role === "MENTOR") {
    navItems.push(
      { to: "/mentor", label: "Mentor Panel", icon: "M12 14l9-5-9-5-9 5 9 5z" },
      { to: "/employeeLeave", label: "Leaves", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
      { to: "/submit-complaint", label: "Raise Complaint", icon: "M12 4v16m8-8H4" }
    );
  }

  if (role === "ADMIN") {
    navItems.push(
      { to: "/admin", label: "Admin Panel", icon: "M9 17v-2a4 4 0 014-4h4" },
      { to: "/manage-announcements", label: "Manage Announcements", icon: "M5 13l4 4L19 7" },
      { to: "/groups", label: "Group Management", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857" },
      { to: "/employeeLeave", label: "Leaves", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
      { to: "/submit-complaint", label: "Create Complaint", icon: "M12 4v16m8-8H4" }
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="shell-sidebar">
        <div className="sidebar-brand">
          <div className="brand-dot" />
          <div>
            <p className="brand-title">Student Portal</p>
            <p className="brand-subtitle">{roleLabel} Workspace</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
            >
              <Icon path={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button onClick={handleLogout} className="side-link side-logout" type="button">
          <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          <span>Log out</span>
        </button>
      </aside>

      <section className="shell-main">
        <header className="shell-topbar">
          <h1 className="shell-title">{title}</h1>

          <div className="topbar-right">
            <div className="topbar-user">
              <div className="avatar" />
              <span className="user-email">{auth?.email}</span>
              <span className="pill role-pill">{roleLabel}</span>
              {auth?.groupName && <span className="pill group-pill">{auth.groupName}</span>}
            </div>

            <div className="notification-wrapper">
              <button
                type="button"
                className="icon-btn relative"
                title="Notifications"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              {notificationsOpen && (
                <div className="notification-menu glass-card">
                  <div className="notification-header">
                    <span>Notifications</span>
                    <button type="button" className="text-xs text-slate-500" onClick={handleMarkAllRead}>
                      Mark all as read
                    </button>
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 && <p className="notification-empty">No notifications yet.</p>}
                    {notifications.map((notification) => (
                      <button
                        type="button"
                        key={notification._id}
                        className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                        onClick={() => handleMarkRead(notification._id)}
                      >
                        <p>{notification.message}</p>
                        <span className="text-[11px] text-slate-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button type="button" onClick={toggleTheme} className="icon-btn" title={dark ? "Switch to light mode" : "Switch to dark mode"}>
              {dark ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button type="button" onClick={handleLogout} className="icon-btn" title="Logout">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <main className="shell-content">{children}</main>
      </section>
    </div>
  );
}
