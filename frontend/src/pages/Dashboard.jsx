import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
};

function Dashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const role = auth?.role;
  const panel = PANEL_CONFIG[role];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
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
      <main className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Welcome back!
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Only show the panel matching the user's role */}
          {panel && (
            <Link
              to={panel.path}
              className="block bg-white rounded-2xl shadow hover:shadow-md transition p-6"
            >
              <h3 className="text-lg font-bold text-blue-600 mb-2">
                {panel.title}
              </h3>
              <p className="text-sm text-gray-500">{panel.description}</p>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
