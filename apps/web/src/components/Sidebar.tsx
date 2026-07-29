import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/instances", label: "Instances" },
  { to: "/contacts", label: "Contacts" },
  { to: "/campaigns", label: "Campaigns" },
  { to: "/messages", label: "Messages" },
  { to: "/settings", label: "Settings" }
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0 flex flex-col">
      <div className="px-6 py-5 text-lg font-semibold text-gray-900">WA Automation</div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}