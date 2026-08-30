import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3, Code2, LayoutDashboard, ListTree,
  MessageCircle, Settings, Shield, Smartphone, Users, LogOut
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
            <span className={`nav-item ${isActive ? "nav-item-active" : "nav-item-inactive"}`}>
              {isActive && <span className="nav-indicator" aria-hidden />}
              <Icon
                size={16}
                strokeWidth={isActive ? 2.25 : 1.75}
                className="shrink-0"
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
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-ink-100 px-5 dark:border-white/[0.07]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-500">
          <MessageCircle size={15} strokeWidth={2.5} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold tracking-tight text-ink-900 dark:text-white" style={{ letterSpacing: "-0.02em" }}>
            Tukonnect
          </p>
          <p className="text-[10px] font-medium text-ink-400 dark:text-ink-500">Digital</p>
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
                <span className={`nav-item ${isActive ? "nav-item-active" : "nav-item-inactive"}`}>
                  {isActive && <span className="nav-indicator" aria-hidden />}
                  <Shield size={16} strokeWidth={isActive ? 2.25 : 1.75} className="shrink-0 text-accent-500" />
                  <span>Admin</span>
                </span>
              )}
            </NavLink>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-ink-100 p-3 dark:border-white/[0.07]">
        <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-ink-50 dark:hover:bg-white/[0.05] transition-colors duration-150">
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
            className="ml-auto shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-500 transition-colors duration-150 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
