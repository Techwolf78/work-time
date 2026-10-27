import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  BarChart3,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/authContext";
import { useHrms } from "../../lib/hrmsContext";
import { GaHrmsLogo } from "../ui/GaHrmsLogo";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { company } = useHrms();

  const role = user?.role || "SUPER_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN" || role === "HR_ADMIN";
  const isManager = role === "MANAGER";

  // Exact Recommended Navigation Hierarchy per Role (Single Org / Pune Branch)
  const navItems: NavItem[] = isSuperAdmin
    ? [
        { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
        { label: "People", path: "/people/employees", icon: Users },
        { label: "Time Tracking", path: "/time/timeline", icon: Clock },
        { label: "Reports", path: "/reports", icon: BarChart3 },
      ]
    : isManager
    ? [
        { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
        { label: "My Team", path: "/people/employees", icon: Users },
        { label: "Time Tracking", path: "/time/timeline", icon: Clock },
        { label: "Reports", path: "/reports", icon: BarChart3 },
      ]
    : [
        { label: "My Activity", path: "/dashboard", icon: Activity },
        { label: "My Reports", path: "/reports", icon: BarChart3 },
      ];

  const getRoleDisplayName = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isManager) return "Manager";
    return "Employee";
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-950 text-white select-none border-r border-gray-900">
      {/* Brand Header */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-gray-900 px-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-900 transition-colors"
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        ) : (
          <>
            <NavLink to="/dashboard" className="flex items-center group">
              <GaHrmsLogo size="sm" variant="dark" iconOnly={false} productName="WORK-TIME" />
            </NavLink>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-900 transition-colors"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Organization Context Chip */}
      {!collapsed && (
        <div className="px-3 py-2.5 border-b border-gray-900/80 bg-gray-950/60">
          <div className="px-2.5 py-1.5 rounded-lg bg-gray-900/80 border border-gray-800/80 flex items-center justify-between text-xs">
            <div className="truncate">
              <p className="font-semibold text-white truncate text-[11px] leading-tight">
                {company?.name || "Gryphon Academy Pvt. Ltd."}
              </p>
              <p className="text-[10px] text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Pune HQ</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu (iOS-Clarity Minimal List) */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {!collapsed && (
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {getRoleDisplayName()} Navigation
          </p>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg text-xs font-medium transition-all duration-150 group relative",
                collapsed ? "justify-center h-10 w-10 mx-auto px-0" : "px-3 py-2",
                isActive
                  ? "bg-white text-gray-950 font-semibold shadow-xs"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-gray-950" : "text-gray-400 group-hover:text-white"
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User / Agent Status Footer */}
      <div className="p-3 border-t border-gray-900">
        <div
          className={cn(
            "flex items-center gap-2.5",
            collapsed && "justify-center"
          )}
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-800"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "GA"}
            </div>
          )}

          {!collapsed && (
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name}
              </p>
              <p className="text-[10px] text-gray-400 truncate uppercase tracking-wider mt-0.5">
                {getRoleDisplayName()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:block h-screen sticky top-0 transition-all duration-300 z-30 shrink-0",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
