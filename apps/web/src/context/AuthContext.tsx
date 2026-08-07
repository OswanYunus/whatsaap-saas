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
  name?: string;
  phoneNumber?: string;
  isAdmin?: boolean;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
}

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

interface RegisterResponse {
  user: { id: string; email: string; name: string; isVerified: boolean };
  message: string;
}

interface MeResponse {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  isAdmin: boolean;
  workspaces: WorkspaceSummary[];
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  workspaces: WorkspaceSummary[];
  workspaceId: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, workspaceName: string, name: string, phoneNumber: string) => Promise<{ email: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (phoneNumber: string) => Promise<void>;
  verifyResetCode: (phoneNumber: string, code: string) => Promise<void>;
  resetPassword: (phoneNumber: string, code: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = "waas-access-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((nextUser: AuthUser, token: string, me: MeResponse) => {
    setUser({ ...nextUser, name: me.name, phoneNumber: me.phoneNumber, isAdmin: me.isAdmin });
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
    async (email: string, password: string, workspaceName: string, name: string, phoneNumber: string) => {
      const result = await apiFetch<RegisterResponse>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify({ email, password, workspaceName, name, phoneNumber }) }
      );
      // Return email so frontend can redirect to verify page
      return { email: result.user.email };
    },
    []
  );

  const verifyEmail = useCallback(
    async (email: string, code: string) => {
      const { user: verifiedUser, accessToken: token } = await apiFetch<LoginResponse>(
        "/api/auth/verify-email",
        { method: "POST", body: JSON.stringify({ email, code }) }
      );
      const me = await apiFetch<MeResponse>("/api/users/me", { accessToken: token });
      applySession(verifiedUser, token, me);
    },
    [applySession]
  );

  const resendVerification = useCallback(
    async (email: string) => {
      await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email })
      });
    },
    []
  );

  const forgotPassword = useCallback(
    async (phoneNumber: string) => {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ phoneNumber })
      });
    },
    []
  );

  const verifyResetCode = useCallback(
    async (phoneNumber: string, code: string) => {
      await apiFetch("/api/auth/verify-reset-code", {
        method: "POST",
        body: JSON.stringify({ phoneNumber, code })
      });
    },
    []
  );

  const resetPassword = useCallback(
    async (phoneNumber: string, code: string, password: string) => {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ phoneNumber, code, password })
      });
    },
    []
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
      verifyEmail,
      resendVerification,
      forgotPassword,
      verifyResetCode,
      resetPassword,
      logout
    }),
    [user, accessToken, workspaces, isLoading, login, register, verifyEmail, resendVerification, forgotPassword, verifyResetCode, resetPassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}