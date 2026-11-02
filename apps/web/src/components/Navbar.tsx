import { useState } from "react";
import { Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import MobileNav from "./MobileNav";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { workspaces } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const workspaceName = workspaces[0]?.name ?? "Workspace";

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-ink-100 bg-surface/90 px-4 backdrop-blur-sm sm:px-6 dark:border-white/[0.07] dark:bg-surface-dark/90">
        {/* Left: hamburger (mobile) + workspace name */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="btn-ghost h-9 w-9 p-0 sm:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Mobile: logo name */}
          <div className="flex items-center gap-2 sm:hidden">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span className="text-[13px] font-bold text-ink-900 dark:text-white" style={{ letterSpacing: "-0.02em" }}>
              Tukonnect
            </span>
          </div>

          {/* Desktop: workspace badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-1.5 dark:border-white/[0.07] dark:bg-white/[0.04]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            <span className="text-[13px] font-semibold text-ink-700 dark:text-ink-200" style={{ letterSpacing: "-0.01em" }}>
              {workspaceName}
            </span>
          </div>
        </div>

        {/* Right: theme toggle */}
        <div className="flex items-center gap-1">
          <button
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            className="btn-ghost h-9 w-9 p-0"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}