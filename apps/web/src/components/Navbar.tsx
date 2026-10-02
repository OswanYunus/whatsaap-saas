import { useState } from "react";
import { Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import MobileNav from "./MobileNav";
import SpookyHeaderWidget from "./spooky/SpookyHeaderWidget";

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
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500 shadow-sm shadow-orange-500/30">
              <span className="text-[12px]">🎃</span>
            </div>
            <span className="text-[13px] font-bold text-ink-900 dark:text-white" style={{ letterSpacing: "-0.02em" }}>
              Tukonnect
            </span>
          </div>

          {/* Desktop: workspace badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-1.5 dark:border-orange-400/20 dark:bg-orange-400/5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[13px] font-semibold text-ink-700 dark:text-ink-200" style={{ letterSpacing: "-0.01em" }}>
              {workspaceName}
            </span>
          </div>
        </div>

        {/* Right: Spooky header widget + theme toggle */}
        <div className="flex items-center gap-2">
          <SpookyHeaderWidget />

          <button
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            className="btn-ghost h-9 w-9 p-0 rounded-xl"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}