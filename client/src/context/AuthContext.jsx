import { createContext, useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import api from "../hooks/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  const checkSession = async () => {
    try {
      const { data } = await api.get("/admin/auth/me");
      if (data.success && data.admin) {
        setAdmin(data.admin);
      }
    } catch {
      // Ignore errors during check — just means not logged in
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    // Register global handler for unauthorized requests
    window.handleUnauthorized = () => {
      localStorage.removeItem("admin_token");
      setAdmin(null);
      toast.error("Session expired. Please log in again.");
    };

    return () => {
      window.handleUnauthorized = null;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/admin/auth/login", { email, password });
      if (data.success && data.admin) {
        if (data.token) {
          localStorage.setItem("admin_token", data.token);
        }
        setAdmin(data.admin);
        toast.success(`Welcome back, ${data.admin.name}!`);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please check credentials.";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post("/admin/auth/logout");
    } catch {
      // Ignore network errors on logout to ensure client states are cleaned up
    } finally {
      localStorage.removeItem("admin_token");
      setAdmin(null);
      toast.success("Logged out successfully.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        isAuthenticated: !!admin,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
