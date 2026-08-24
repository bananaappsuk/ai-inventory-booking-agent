import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types";

export function ProtectedRoute({ role }: { role?: Role }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return <Outlet />;
}
