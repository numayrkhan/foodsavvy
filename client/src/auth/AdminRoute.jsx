import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "./useAdminAuth";

export default function AdminRoute() {
  const { isAdmin } = useAdminAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/admin/login" replace />;
}