import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { login as apiLogin, setUnauthorizedHandler } from "../api/client";
import { tokenStore } from "../api/token";

interface AuthContextValue {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "qai-shop-user";

function getStoredUser(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

function setStoredUser(username: string): void {
  try {
    localStorage.setItem(USER_KEY, username);
  } catch {
    /* ignore */
  }
}

function clearStoredUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [username, setUsername] = useState<string | null>(() => getStoredUser());

  const logout = () => {
    tokenStore.clear();
    clearStoredUser();
    setToken(null);
    setUsername(null);
  };

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (user: string, password: string) => {
    const res = await apiLogin(user, password);
    // We store the token SYNCHRONOUSLY (not in useEffect) so it is available
    // for requests made immediately after login (e.g. fetching products).
    tokenStore.set(res.token);
    setStoredUser(res.user.username);
    setToken(res.token);
    setUsername(res.user.username);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ token, username, isAuthenticated: Boolean(token), login, logout }),
    [token, username],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth musi być użyty wewnątrz <AuthProvider>");
  return ctx;
}
