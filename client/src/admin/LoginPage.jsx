// 📁 File: client/src/admin/LoginPage.jsx
import { useState } from "react";
import { useAdminAuth } from "../auth/useAdminAuth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      login(data.token);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-lg w-full max-w-sm space-y-4 shadow-xl"
      >
        <h1 className="text-xl font-bold">Admin Login</h1>
        {error && <p className="text-red-500">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
        />

        <button
          type="submit"
          className="w-full bg-accent hover:bg-accent-dark text-white py-2 rounded-md transition"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
