import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import {
  Home,
  Users,
  Calendar,
  Clock,
  ClipboardList,
  LayoutDashboard,
  CalendarDays,
  Palmtree,
} from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Employees",
    to: "/admin/employees",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Attendance",
    to: "/admin/attendance",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    label: "Leave Management",
    to: "/admin/leaves",
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    label: "Holidays",
    to: "/admin/holidays",
    icon: <Palmtree className="h-5 w-5" />,
  },
];

const employeeNav: NavItem[] = [
  { label: "Home", to: "/employee", icon: <Home className="h-5 w-5" /> },
  {
    label: "Leave Tracker",
    to: "/employee/leaves",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    label: "Time Tracker",
    to: "/employee/time-tracker",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    label: "Attendance",
    to: "/employee/attendance",
    icon: <ClipboardList className="h-5 w-5" />,
  },
];

interface SidebarProps {
  role: "admin" | "employee";
}

export function Sidebar({ role }: SidebarProps) {
  const navItems = role === "admin" ? adminNav : employeeNav;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-sidebar-background">
      <div className="flex h-16 items-center border-b px-6">
        <Logo size="sm" showText={false} />
        <span className="ml-3 text-lg font-semibold text-sidebar-primary">
          {role === "admin" ? "Admin Portal" : "Podtech"}
        </span>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin" || item.to === "/employee"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
