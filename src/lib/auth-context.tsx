"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { UserRole } from "@/types";
import { apiClient } from "@/lib/api-client";

interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, role?: UserRole, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in via HTTP-only cookie
    apiClient.get<AuthUser>("/api/auth/me")
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const nextUser = await apiClient.post<AuthUser>("/api/auth/login", { email, password });
    setUser(nextUser);
  };

  const signOut = async () => {
    try {
      await apiClient.post("/api/auth/logout", {});
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      signIn,
      signOut,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
