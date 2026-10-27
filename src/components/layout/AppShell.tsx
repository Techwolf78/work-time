import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { GlobalSearchModal } from "./GlobalSearchModal";

import { useHrms } from "../../lib/hrmsContext";
import { cn } from "../../lib/utils";

export interface AppShellProps {
  onOpenAddEmployee?: () => void;
  onOpenApplyLeave?: () => void;
  onOpenAttendanceCorrection?: () => void;
}

export function AppShell({
  onOpenAddEmployee,
  onOpenApplyLeave,
  onOpenAttendanceCorrection,
}: AppShellProps) {
  const { settings } = useHrms();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Global Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-surface-bg text-text-primary antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenSearch={() => setSearchModalOpen(true)}
        />

        <main
          className={cn(
            "flex-1 w-full animate-fade-in transition-all duration-200",
            settings?.compactMode
              ? "p-3 sm:p-4 lg:p-5"
              : "p-4 sm:p-6 lg:p-8"
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Global Command Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onOpenAddEmployee={onOpenAddEmployee}
        onOpenApplyLeave={onOpenApplyLeave}
        onOpenAttendanceCorrection={onOpenAttendanceCorrection}
      />
    </div>
  );
}
