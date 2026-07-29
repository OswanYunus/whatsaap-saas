import { useState } from "react";
import { Bell, ChevronDown, LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { workspace } from "../lib/mockData";

/**
 * Top navbar: workspace selector, notifications, dark-mode toggle,
 * and profile/logout menu. Sits above the routed page content inside
 * DashboardLayout (not shown on the auth pages).
 */
export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, clearSession } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-ink-100/80 bg-surface/80 px-5 backdrop-blur-md dark:border-white/10 dark:bg-surface-dark/80 lg:px-6">
      <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-ink-600 transition-colors duration-150 hover:bg-ink-100/60 dark:text-ink-200 dark:hover:bg-white/10">
        <span className="max-w-[180px] truncate">{workspace.name}</span>
        <ChevronDown size={13} className="shrink-0 opacity-50" />
      </button>

      <div className="flex items-center gap-0.5">
        <button aria-label="Notifications" className="btn-ghost h-8 w-8 p-0">
          <Bell size={16} strokeWidth={1.75} />
        </button>

        <button
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
          className="btn-ghost h-8 w-8 p-0"
        >
          {theme === "dark" ? (
            <Sun size={16} strokeWidth={1.75} />
          ) : (
            <Moon size={16} strokeWidth={1.75} />
          )}
        </button>

        <div className="relative ml-1">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center rounded-md p-1 transition-colors duration-150 hover:bg-ink-100/60 dark:hover:bg-white/10"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-700 text-2xs font-semibold text-white dark:bg-accent-500 dark:text-ink-900">
              {(user?.email?.[0] ?? "U").toUpperCase()}
            </span>
          </button>

          {profileOpen && (
            <div className="dropdown right-0 w-48">
              <div className="border-b border-ink-100/60 px-3 py-2 dark:border-white/10">
                <p className="truncate text-2xs font-medium text-ink-600 dark:text-ink-300">
                  {user?.email ?? "Not signed in"}
                </p>
              </div>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-ink-600 transition-colors duration-150 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-white/10">
                <User size={14} strokeWidth={1.75} /> Profile
              </button>
              <button
                onClick={clearSession}
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-red-600 transition-colors duration-150 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <LogOut size={14} strokeWidth={1.75} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
