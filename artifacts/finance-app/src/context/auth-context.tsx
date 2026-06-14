import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth, hasFirebaseConfig } from "../lib/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { setAuthTokenGetter } from "@workspace/api-client-react";

type Role = "admin" | "user";

interface AuthState {
  user: any | null;
  role: Role;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<Role>("user");
  const [isLoading, setIsLoading] = useState(true);

  const getToken = useCallback(async () => {
    if (hasFirebaseConfig && auth && auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return "mock-token";
  }, []);

  useEffect(() => {
    setAuthTokenGetter(getToken);
  }, [getToken]);

  useEffect(() => {
    if (hasFirebaseConfig && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setUser(fbUser);
        if (fbUser) {
          setRole("admin");
        } else {
          setRole("user");
        }
        setIsLoading(false);
      });
      return unsubscribe;
    } else {
      const mockSession = localStorage.getItem("mock_admin_session");
      if (mockSession === "true") {
        setUser({ email: "admin@keuangan.com", uid: "mock-admin" });
        setRole("admin");
      } else {
        setUser(null);
        setRole("user");
      }
      setIsLoading(false);
      return;
    }
  }, [getToken]);

  const login = useCallback(async (email: string, password: string) => {
    if (hasFirebaseConfig && auth) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return { ok: true };
      } catch (error: any) {
        return { ok: false, error: error.message || "Login gagal" };
      }
    } else {
      const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
      if (password === expectedPassword) {
        localStorage.setItem("mock_admin_session", "true");
        setUser({ email: "admin@keuangan.com", uid: "mock-admin" });
        setRole("admin");
        return { ok: true };
      } else {
        return { ok: false, error: "Password admin salah" };
      }
    }
  }, []);

  const logout = useCallback(async () => {
    if (hasFirebaseConfig && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem("mock_admin_session");
      setUser(null);
      setRole("user");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, isLoading, isAdmin: role === "admin", login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
