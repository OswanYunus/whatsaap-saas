import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3, Code2, LayoutDashboard, ListTree,
  MessageCircle, Settings, Shield, Smartphone, Users, LogOut, X, Moon, Sun
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const mainNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/instances", label: "Instances", icon: Smartphone },
  { to: "/campaigns", label: "Campaigns", icon: MessageCircle },
  { to: "/contacts", label: "Contacts", icon: Users },
];

const toolNav = [
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/queue", label: "Queue", icon: ListTree },
  { to: "/developer-api", label: "Developer API", icon: Code2 },
];

const systemNav = [
  { to: "/settings", label: "Settings", icon: Settings },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

function Section({ label, items, onClose }: { label?: string; items: typeof mainNav; onClose: () => void }) {
  return (
    <div className="space-y-0.5">
      {label && (
        <p className="mb-1.5 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-ink-300 dark:text-ink-600">
          {label}
        </p>
      )}
      {items.map(({ to, label: itemLabel, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={"end" in { end } ? end : undefined} onClick={onClose} className="block">
          {({ isActive }) => (
            <span className={`nav-item ${isActive ? "nav-item-active" : "nav-item-inactive"}`}>
              {isActive && <span className="nav-indicator" aria-hidden />}
              <Icon size={16} strokeWidth={isActive ? 2.25 : 1.75} className="shrink-0" />
              <span>{itemLabel}</span>
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
}

export default function MobileNav({ open, onClose }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isAdmin = user?.isAdmin ?? false;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    onClose();
  };

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : (user?.email?.[0] ?? "U").toUpperCase();

  const displayName = user?.name
    ? user.name.split(" ")[0]
    : user?.email?.split("@")[0] ?? "User";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-surface shadow-elevated animate-slide-in-left dark:bg-surface-dark dark:shadow-elevated-dark">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-ink-100 px-4 dark:border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent-500">
              <MessageCircle size={13} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="text-[13px] font-bold text-ink-900 dark:text-white" style={{ letterSpacing: "-0.02em" }}>
              Tukonnect Digital
            </span>
          </div>
          <button onClick={onClose} className="btn-ghost h-8 w-8 p-0" aria-label="Close menu">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <Section items={mainNav} onClose={onClose} />
          <Section label="Tools" items={toolNav} onClose={onClose} />
          <Section label="System" items={systemNav} onClose={onClose} />

          {isAdmin && (
            <div className="mt-3">
              <div className="divider my-3" />
              <NavLink to="/admin" onClick={onClose} className="block">
                {({ isActive }) => (
                  <span className={`nav-item ${isActive ? "nav-item-active" : "nav-item-inactive"}`}>
                    {isActive && <span className="nav-indicator" aria-hidden />}
                    <Shield size={16} strokeWidth={isActive ? 2.25 : 1.75} className="shrink-0 text-accent-500" />
                    Admin
                  </span>
                )}
              </NavLink>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-ink-100 p-3 dark:border-white/[0.07] space-y-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="nav-item nav-item-inactive w-full"
          >
            {theme === "dark" ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>

          {/* User row */}
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-500/15 text-[12px] font-bold text-accent-700 dark:bg-accent-500/20 dark:text-accent-400">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink-800 dark:text-ink-100" style={{ letterSpacing: "-0.01em" }}>
                {displayName}
              </p>
              <p className="truncate text-[10px] text-ink-400 dark:text-ink-500">{user?.email ?? ""}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-500 transition-colors dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
