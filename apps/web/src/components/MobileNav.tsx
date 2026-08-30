import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, Code2, LayoutDashboard, ListTree, MessageCircle, Settings, Shield, Smartphone, Users, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/instances", label: "Instances", icon: Smartphone },
  { to: "/campaigns", label: "Campaigns", icon: MessageCircle },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/queue", label: "Queue", icon: ListTree },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/developer-api", label: "Developer API", icon: Code2 },
  { to: "/settings", label: "Settings", icon: Settings }
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNav({ open, onClose }: MobileNavProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;
  const location = useLocation();

  // Close when route changes
  useEffect(() => {
    onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
        onClick={onClose}
      />

      {/* Slide-out drawer */}
      <div className="fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-surface dark:bg-surface-dark shadow-xl sm:hidden animate-slide-in-left">
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-ink-100/80 dark:border-white/10">
          <span
            style={{ fontFamily: "'DM Serif Display', serif" }}
            className="text-xl text-ink-900 dark:text-white"
          >
            Tukonnect
          </span>
          <button onClick={onClose} className="btn-ghost h-8 w-8 p-0">
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto space-y-2 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="block">
              {({ isActive }) => (
                <span
                  className={`nav-item ${isActive ? "nav-item-active" : "nav-item-inactive"}`}
                >
                  {isActive && <span className="nav-indicator" aria-hidden />}
                  <Icon size={16} strokeWidth={isActive ? 2.25 : 1.75} className="shrink-0 opacity-80" />
                  {label}
                </span>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="my-1.5 border-t border-ink-100/60 dark:border-white/10" />
              <NavLink to="/admin" className="block">
                {({ isActive }) => (
                  <span
                    className={`nav-item ${isActive ? "nav-item-active" : "nav-item-inactive"}`}
                  >
                    {isActive && <span className="nav-indicator" aria-hidden />}
                    <Shield size={16} strokeWidth={isActive ? 2.25 : 1.75} className="shrink-0 opacity-80 text-accent-500" />
                    Admin Dashboard
                  </span>
                )}
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-ink-100/60 px-4 py-3 dark:border-white/10">
          <p className="text-2xs text-ink-400 dark:text-ink-500">Tukonnect Digital v1.0</p>
        </div>
      </div>
    </>
  );
}
