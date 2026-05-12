import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import MentorPanel from "./pages/MentorPanel";
import StudentPanel from "./pages/StudentPanel";
import SubmitComplaint from "./pages/SubmitComplaint";
import GroupManagement from "./pages/GroupManagement";
import Announcements from "./pages/Announcements";
import ManageAnnouncements from "./pages/ManageAnnouncements";
import Chat from "./pages/Chat/Chat";
import ProtectedRoute from "./components/ProtectedRoute";

// ✅ FIXED: Capitalized component names (REQUIRED)
import StudentLeave from "./pages/studentLeave";
import EmployeeLeave from "./pages/employeeLeave";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Any authenticated user can see the dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Role-restricted panels */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentor"
        element={
          <ProtectedRoute allowedRoles={["MENTOR"]}>
            <MentorPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/submit-complaint"
        element={
          <ProtectedRoute allowedRoles={["STUDENT", "MENTOR", "ADMIN"]}>
            <SubmitComplaint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <GroupManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/announcements"
        element={
          <ProtectedRoute allowedRoles={["STUDENT", "MENTOR", "ADMIN"]}>
            <Announcements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute allowedRoles={["STUDENT", "MENTOR", "ADMIN"]}>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manage-announcements"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ManageAnnouncements />
          </ProtectedRoute>
        }
      />

      {/* ================= NEW ROUTES ADDED ================= */}

      <Route
        path="/studentLeave"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentLeave />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employeeLeave"
        element={
          <ProtectedRoute allowedRoles={["MENTOR", "ADMIN"]}>
            <EmployeeLeave />
          </ProtectedRoute>
        }
      />

      {/* =================================================== */}
    </Routes>
  );
}

export default App;
