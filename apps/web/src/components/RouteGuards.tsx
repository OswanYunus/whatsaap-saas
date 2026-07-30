import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function FullscreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-ink-400 dark:bg-canvas-dark">
      Loading...
    </div>
  );
}

/**
 * Guards every dashboard route. While a stored token is still being
 * verified against GET /users/me, shows a loader rather than
 * flashing the login page. Once resolved, redirects to /login if
 * there's no authenticated user.
 */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullscreenLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

/**
 * Guards /login and /register: an already-authenticated user hitting
 * either page is bounced straight to the dashboard instead of being
 * shown a login form they don't need.
 */
export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullscreenLoader />;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
}