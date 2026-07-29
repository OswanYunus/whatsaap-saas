import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AuthUser } from "@waas/types";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Placeholder client-side auth state. Real implementations will likely
 * persist the access token in memory only (refresh token in an
 * httpOnly cookie) rather than localStorage, to reduce XSS exposure —
 * left as a TODO for the auth pages that consume this context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      setSession: (nextUser, nextToken) => {
        setUser(nextUser);
        setAccessToken(nextToken);
      },
      clearSession: () => {
        setUser(null);
        setAccessToken(null);
      }
    }),
    [user, accessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}