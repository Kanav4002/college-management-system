import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { auth } = useAuth();

  // Not logged in → redirect to login
  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but role not permitted → redirect to dashboard
  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
