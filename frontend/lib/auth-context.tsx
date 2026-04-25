"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<AuthUser | null>;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch /auth/me with the stored token
  const fetchMe = useCallback(async (jwt: string) => {
    try {
      const res = await api.get<AuthUser>("/auth/me", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setUser(res.data);
      setToken(jwt);
      return res.data;
    } catch {
      // Token invalid/expired — clear storage
      localStorage.removeItem("token");
      setUser(null);
      setToken(null);
      return null;
    }
  }, []);

  // On mount: restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) {
      fetchMe(stored).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchMe]);

  const login = useCallback(
    async (jwt: string) => {
      localStorage.setItem("token", jwt);
      return await fetchMe(jwt);
    },
    [fetchMe]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
