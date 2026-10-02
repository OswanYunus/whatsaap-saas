import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3, Code2, LayoutDashboard, ListTree,
  MessageCircle, Settings, Shield, Smartphone, Users, LogOut, Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

function NavSection({ label, items }: { label?: string; items: typeof mainNav }) {
  return (
    <div className="space-y-0.5">
      {label && (
        <p className="mb-1.5 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-ink-300 dark:text-ink-600">
          {label}
        </p>
      )}
      {items.map(({ to, label: itemLabel, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={"end" in { end } ? end : undefined} className="block">
          {({ isActive }) => (
            <span className={`nav-item ${isActive ? "nav-item-active !bg-orange-500/10 !text-orange-600 dark:!text-orange-400" : "nav-item-inactive hover:!text-orange-400"}`}>
              {isActive && <span className="nav-indicator !bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" aria-hidden />}
              <Icon
                size={16}
                strokeWidth={isActive ? 2.25 : 1.75}
                className={`shrink-0 ${isActive ? "text-orange-500" : ""}`}
              />
              <span>{itemLabel}</span>
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.isAdmin ?? false;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : (user?.email?.[0] ?? "U").toUpperCase();

  const displayName = user?.name
    ? user.name.split(" ")[0]
    : user?.email?.split("@")[0] ?? "User";

  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-ink-100 bg-surface sm:flex dark:border-white/[0.07] dark:bg-surface-dark">
      {/* Logo with Halloween Pumpkin Touch */}
      <div className="flex h-14 items-center gap-3 border-b border-ink-100 px-5 dark:border-white/[0.07]">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 shadow-md shadow-orange-500/20">
          <span className="text-[14px]">🎃</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold tracking-tight text-ink-900 dark:text-white flex items-center gap-1" style={{ letterSpacing: "-0.02em" }}>
            Tukonnect
            <span className="text-[10px] text-orange-400">🦇</span>
          </p>
          <p className="text-[10px] font-medium text-ink-400 dark:text-ink-500">Digital SaaS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavSection items={mainNav} />
        <NavSection label="Tools" items={toolNav} />
        <NavSection label="System" items={systemNav} />

        {isAdmin && (
          <div className="mt-3 space-y-0.5">
            <div className="divider my-3" />
            <NavLink to="/admin" className="block">
              {({ isActive }) => (
                <span className={`nav-item ${isActive ? "nav-item-active !bg-purple-500/15 !text-purple-400" : "nav-item-inactive"}`}>
                  {isActive && <span className="nav-indicator !bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" aria-hidden />}
                  <Shield size={16} strokeWidth={isActive ? 2.25 : 1.75} className="shrink-0 text-purple-400" />
                  <span>Admin</span>
                </span>
              )}
            </NavLink>
          </div>
        )}

        {/* Spooky Season Seasonal Banner */}
        <div className="mt-6 rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-purple-500/5 to-transparent p-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-orange-400">
            <Sparkles size={13} className="text-orange-400 animate-spin" />
            <span>Spooky Edition</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-400 dark:text-slate-400 leading-normal">
            Automated WhatsApp campaigns with eerie speed & deliverability.
          </p>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-ink-100 p-3 dark:border-white/[0.07]">
        <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-ink-50 dark:hover:bg-white/[0.05] transition-colors duration-150">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-[12px] font-bold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
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
            className="ml-auto shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-500 transition-colors duration-150 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
