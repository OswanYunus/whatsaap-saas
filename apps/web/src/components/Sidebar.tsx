import { NavLink } from "react-router-dom";
import { BarChart3, LayoutDashboard, ListTree, MessageCircle, Settings, Smartphone, Users } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/instances", label: "Instances", icon: Smartphone },
  { to: "/campaigns", label: "Campaigns", icon: MessageCircle },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/queue", label: "Queue", icon: ListTree },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings }
];

export default function Sidebar() {
  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-ink-100/80 bg-surface sm:flex dark:border-white/10 dark:bg-surface-dark">
      <div className="flex h-12 items-center gap-2.5 px-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink-800 text-white dark:bg-accent-500 dark:text-ink-900">
          <MessageCircle size={13} strokeWidth={2.5} />
        </span>
        <span className="text-[13px] font-semibold tracking-tight text-ink-800 dark:text-white">
          WA Automation
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 pb-4 pt-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="block">
            {({ isActive }) => (
              <span
                className={`nav-item ${isActive ? "nav-item-active" : "nav-item-inactive"}`}
              >
                {isActive && <span className="nav-indicator" aria-hidden />}
                <Icon size={15} strokeWidth={isActive ? 2.25 : 1.75} className="shrink-0 opacity-80" />
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-100/60 px-4 py-3 dark:border-white/10">
        <p className="text-2xs text-ink-400 dark:text-ink-500">WhatsApp SaaS v0.1</p>
      </div>
    </aside>
  );
}
