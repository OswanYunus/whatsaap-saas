import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { apiFetch } from "../lib/api";

export interface AuthUser {
  id: string;
  email: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
}

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

interface MeResponse {
  id: string;
  email: string;
  workspaces: WorkspaceSummary[];
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  workspaces: WorkspaceSummary[];
  /** The workspace every other module's API calls should scope to. */
  workspaceId: string | null;
  /** True while restoring a session from a stored token on first load. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, workspaceName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = "waas-access-token";

/**
 * Owns the whole auth lifecycle: login/register calls, session
 * restoration on page load, and exposes `workspaceId` so every other
 * module (Contacts, Campaigns, Dashboard, ...) can read it directly
 * from useAuth() instead of threading it through props.
 *
 * The access token is persisted in localStorage so a page refresh
 * doesn't log the user out. The backend only issues a short-lived
 * (15m) access token with no refresh-token/rotation endpoint yet —
 * that's a known gap (see README "stubbed" list), so sessions will
 * silently expire after 15 minutes until that's built. Storing in
 * localStorage (vs. memory-only) is a deliberate tradeoff for a
 * usable MVP; moving to an httpOnly refresh cookie is the natural
 * next step once the backend supports it.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((nextUser: AuthUser, token: string, me: MeResponse) => {
    setUser(nextUser);
    setAccessToken(token);
    setWorkspaces(me.workspaces);
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setWorkspaces([]);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  // On first load, try to restore a session from a previously stored
  // token. GET /users/me both validates the token and returns the
  // profile in one call.
  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    apiFetch<MeResponse>("/api/users/me", { accessToken: stored })
      .then((me) => applySession({ id: me.id, email: me.email }, stored, me))
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: loggedInUser, accessToken: token } = await apiFetch<LoginResponse>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      );
      const me = await apiFetch<MeResponse>("/api/users/me", { accessToken: token });
      applySession(loggedInUser, token, me);
    },
    [applySession]
  );

  const register = useCallback(
    async (email: string, password: string, workspaceName: string) => {
      const { user: newUser, accessToken: token } = await apiFetch<LoginResponse>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify({ email, password, workspaceName }) }
      );
      const me = await apiFetch<MeResponse>("/api/users/me", { accessToken: token });
      applySession(newUser, token, me);
    },
    [applySession]
  );

  const logout = useCallback(() => clearSession(), [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      workspaces,
      workspaceId: workspaces[0]?.id ?? null,
      isLoading,
      login,
      register,
      logout
    }),
    [user, accessToken, workspaces, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}