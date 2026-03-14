import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const ROLE_LABELS = {
  STUDENT: "Student",
  MENTOR: "Mentor",
  ADMIN: "Admin",
};

/**
 * Shared glassmorphism navbar used across Dashboard + all role panels.
 *
 * @param {string}  title        — Page title shown on the left (e.g. "Admin Analytics Dashboard")
 * @param {boolean} showBack     — Show a "← Back to Dashboard" link (default: false)
 */
export default function Navbar({ title, showBack = false }) {
  const { auth, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabel = ROLE_LABELS[auth?.role] || auth?.role || "";

  return (
    <>
      {/* Accent stripe */}
      <div className="accent-stripe" />

      {/* Glassy navbar */}
      <header className="glass-navbar sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left — Title */}
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--accent)" }}
          >
            {title}
          </h1>

          {/* Right — profile, theme toggle, back link, logout */}
          <div className="flex items-center gap-5">
            {/* Back to dashboard */}
            {showBack && (
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-1 text-sm hover:underline"
                style={{ color: "var(--text-secondary)" }}
              >
                ← Dashboard
              </Link>
            )}

            {/* Profile cluster — avatar + email + role + group badge (single line) */}
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gray-400 dark:bg-gray-600 shrink-0" />
              <span
                className="text-sm font-medium whitespace-nowrap"
                style={{ color: "var(--text-primary)" }}
              >
                {auth?.email}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#0088D1] text-white shrink-0">
                {roleLabel}
              </span>
              {auth?.groupName && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
                  style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                >
                  {auth.groupName}
                </span>
              )}
            </div>

            {/* Dark / Light toggle */}
            <button
              onClick={toggleTheme}
              className="relative h-8 w-8 flex items-center justify-center rounded-lg transition cursor-pointer"
              style={{
                background: "var(--bg-input)",
                color: "var(--text-secondary)",
              }}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? (
                /* Sun icon */
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                /* Moon icon */
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm cursor-pointer hover:opacity-80 transition"
              style={{ color: "var(--text-secondary)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
