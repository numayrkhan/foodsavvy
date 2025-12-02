import { useState } from "react";
import { AdminAuthContext } from "./AdminAuthContext";

export default function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("admin_token"));

  const login = (token) => {
    localStorage.setItem("admin_token", token);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  const isAdmin = Boolean(token);

  return (
    <AdminAuthContext.Provider value={{ token, isAdmin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
