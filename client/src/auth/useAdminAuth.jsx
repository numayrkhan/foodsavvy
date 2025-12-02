import { useContext } from "react";
import { AdminAuthContext } from "./AdminAuthContext";

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
// This hook provides access to the admin authentication context, allowing components to use admin auth features like login and logout.
// It simplifies the process of accessing admin auth state and actions throughout the application.