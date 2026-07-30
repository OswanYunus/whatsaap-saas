import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

/**
 * Top navbar: workspace selector, notifications, dark-mode toggle,
 * and profile/logout menu. Sits above the routed page content inside
 * DashboardLayout (not shown on the auth pages).
 */
export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, workspaces, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-ink-100 bg-white px-6 dark:border-ink-700 dark:bg-ink-800">
      <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-100 dark:text-ink-100 dark:hover:bg-ink-700">
        {workspaces[0]?.name ?? "Workspace"}
        <ChevronDown size={14} />
      </button>

      <div className="flex items-center gap-1.5">
        <button
          aria-label="Notifications"
          className="btn-ghost h-9 w-9 p-0"
        >
          <Bell size={18} />
        </button>

        <button
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
          className="btn-ghost h-9 w-9 p-0"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-ink-100 dark:hover:bg-ink-700"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-white dark:bg-accent-500 dark:text-ink-900">
              {(user?.email?.[0] ?? "U").toUpperCase()}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-lg border border-ink-100 bg-white py-1 shadow-card dark:border-ink-700 dark:bg-ink-800">
              <div className="border-b border-ink-100 px-3 py-2 text-xs text-ink-400 dark:border-ink-700">
                {user?.email ?? "Not signed in"}
              </div>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-100 dark:hover:bg-ink-700">
                <User size={14} /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}