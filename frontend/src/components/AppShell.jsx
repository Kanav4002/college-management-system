import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notificationApi";
import logo from "../assets/logo-removebg-preview.png";

const ROLE_LABELS = {
  STUDENT: "Student",
  MENTOR: "Mentor",
  ADMIN: "Admin",
};

export default function AppShell({ title, children }) {
  const { auth, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const role = auth?.role;
  const roleLabel = ROLE_LABELS[role] || role || "";

  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!auth) {
      setNotifications([]);
      return;
    }

    async function loadNotifications() {
      try {
        const response = await getNotifications();
        const items = (response.data.data || []).filter((item) => !item.isRead);
        setNotifications(items);
      } catch {
        setNotifications([]);
      }
    }

    loadNotifications();
  }, [auth]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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

  const handleToggleNotifications = async () => {
    if (notificationsOpen) {
      try {
        await handleMarkAllRead();
      } catch {
        // ignore
      }
      setNotifications([]);
    }
    setNotificationsOpen((open) => !open);
  };

  const handleNotificationClick = async (notification) => {
    const announcementId = notification.announcementId?._id || notification.announcementId;
    try {
      await handleMarkRead(notification._id);
      setNotifications((items) => items.filter((item) => item._id !== notification._id));
    } catch {
      // ignore
    }

    setNotificationsOpen(false);
    if (announcementId) {
      navigate(`/announcements?announcementId=${encodeURIComponent(announcementId)}`);
    }
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  ];

  if (role === "STUDENT") {
    navItems.push(
      { to: "/announcements", label: "Announcements", icon: "campaign" },
      { to: "/student", label: "Student Panel", icon: "school" },
      { to: "/studentLeave", label: "Leaves", icon: "calendar_today" },
      { to: "/submit-complaint", label: "Raise Complaint", icon: "add_circle" }
    );
  }

  if (role === "MENTOR") {
    navItems.push(
      { to: "/announcements", label: "Announcements", icon: "campaign" },
      { to: "/mentor", label: "Mentor Panel", icon: "groups" },
      { to: "/employeeLeave", label: "Leaves", icon: "calendar_today" },
      { to: "/submit-complaint", label: "Raise Complaint", icon: "add_circle" }
    );
  }

  if (role === "ADMIN") {
    navItems.push(
      { to: "/announcements", label: "Announcements", icon: "campaign" },
      { to: "/admin", label: "Admin Panel", icon: "admin_panel_settings" },
      { to: "/manage-announcements", label: "Manage Announcements", icon: "edit_calendar" },
      { to: "/groups", label: "Groups", icon: "group" },
      { to: "/employeeLeave", label: "Leaves", icon: "calendar_today" },
      { to: "/submit-complaint", label: "Create Complaint", icon: "add_circle" }
    );
  }

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside className="shell-sidebar hidden md:flex">
        <div className="sidebar-brand">
          <img src={logo} alt="UniSphere" className="brand-logo" />
          <div>
            <p className="brand-title">UniSphere</p>
            <p className="brand-subtitle">College Management</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <nav className="sidebar-nav flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile */}
          <div className="px-3 py-3 mx-2 rounded-xl" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl" style={{ color: "var(--on-surface-variant)" }}>person</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: "var(--on-surface)" }}>{auth?.name || auth?.email?.split('@')[0] || "User"}</p>
                <p className="text-xs truncate" style={{ color: "var(--on-surface-variant)" }}>{roleLabel}</p>
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className="side-link side-logout" type="button">
            <span className="material-symbols-outlined">logout</span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-in Menu */}
      <aside className={`mobile-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="mobile-sidebar-header">
          <div className="sidebar-brand">
            <img src={logo} alt="UniSphere" className="brand-logo" />
            <div>
              <p className="brand-title">UniSphere</p>
              <p className="brand-subtitle">College Management</p>
            </div>
          </div>
          <button
            type="button"
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="mobile-sidebar-nav flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `mobile-side-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mobile-sidebar-footer">
          <div className="mobile-user-info">
            <span className="material-symbols-outlined text-2xl" style={{ color: "var(--on-surface-variant)" }}>person</span>
            <div className="mobile-user-details">
              <span className="user-email">{auth?.email}</span>
              <div className="flex gap-2 mt-1">
                <span className="pill role-pill">{roleLabel}</span>
                {auth?.groupName && <span className="pill group-pill">{auth.groupName}</span>}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="mobile-side-link mobile-logout" type="button">
            <span className="material-symbols-outlined">logout</span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <section className="shell-main">
        <header className="shell-topbar">
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="mobile-menu-btn md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <h1 className="shell-title">{title}</h1>

          <div className="topbar-right flex items-center gap-3">
            {/* User Profile Icon */}
            <div className="hidden md:flex items-center gap-2">
              <span className="material-symbols-outlined text-xl" style={{ color: "var(--on-surface-variant)" }}>person</span>
              <span className="text-sm font-medium hidden lg:block" style={{ color: "var(--on-surface)" }}>{auth?.name || auth?.email?.split('@')[0] || "User"}</span>
            </div>

            {/* Notifications */}
            <div className="notification-wrapper relative" style={{ zIndex: 99999 }}>
              <button
                type="button"
                className="icon-btn"
                title="Notifications"
                onClick={handleToggleNotifications}
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && !notificationsOpen && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0"
                  style={{
                    top: '100%',
                    marginTop: '8px',
                    width: '360px',
                    borderRadius: '16px',
                    border: '1px solid var(--outline-variant)',
                    background: 'var(--surface-container-lowest)',
                    zIndex: 99999,
                    maxHeight: '420px',
                    overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    animation: 'dropdownFade 200ms ease-out',
                  }}
                >
                  <div
                    className="p-4 border-b flex justify-between items-center"
                    style={{ borderColor: 'var(--outline-variant}' }}
                  >
                    <span className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>
                      Notifications
                    </span>
                    <button
                      className="text-xs hover:underline"
                      style={{ color: 'var(--primary)' }}
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-center" style={{ color: 'var(--on-surface-variant)' }}>
                      No new notifications.
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const announcementTitle = notification.announcementTitle || notification.announcementId?.title || 'Announcement';
                      const message = notification.message || 'New announcement posted.';
                      const createdAt = notification.createdAt || notification.created_at;

                      return (
                        <button
                          type="button"
                          key={notification._id}
                          className="w-full text-left p-4 border-b transition-colors"
                          style={{
                            background: notification.isRead ? 'transparent' : 'color-mix(in srgb, var(--primary) 5%, transparent)',
                            borderColor: 'var(--outline-variant)',
                            color: 'var(--on-surface)',
                          }}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="font-semibold text-sm mb-1">
                            {announcementTitle}
                          </div>
                          <div className="text-sm mb-1" style={{ color: 'var(--on-surface-variant)' }}>
                            {message}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>
                            {new Date(createdAt).toLocaleString()}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle - Mobile only (desktop uses dropdown) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="icon-btn md:hidden"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="material-symbols-outlined">{dark ? "light_mode" : "dark_mode"}</span>
            </button>
          </div>
        </header>

        <main className="shell-content">{children}</main>
      </section>
    </div>
  );
}