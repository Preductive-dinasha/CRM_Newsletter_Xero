import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, logout as apiLogout } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await getMe();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => setUser(null);
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, [refresh]);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch {}
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
