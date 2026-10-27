import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/authContext";
import { ToastProvider } from "./lib/toastContext";
import { HrmsProvider } from "./lib/hrmsContext";
import { AppShell } from "./components/layout/AppShell";

// GA WORK-TIME Core Pages
import { LandingPage } from "./pages/landing/LandingPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { EmployeesPage } from "./pages/people/EmployeesPage";
import { ActivityTimelinePage } from "./pages/time/ActivityTimelinePage";
import { ApplicationUsagePage } from "./pages/time/ApplicationUsagePage";
import { InactivityReviewPage } from "./pages/time/InactivityReviewPage";
import { TeamLiveActivityPage } from "./pages/time/TeamLiveActivityPage";
import { DeviceHealthPage } from "./pages/devices/DeviceHealthPage";
import { TrackingPoliciesPage } from "./pages/admin/TrackingPoliciesPage";
import { SettingsPage } from "./pages/admin/SettingsPage";
import { ReportsPage } from "./pages/reports/ReportsPage";
import { UsersRolesPage } from "./pages/admin/UsersRolesPage";
import { NotificationsPage } from "./pages/admin/NotificationsPage";
import { AuditLogsPage } from "./pages/admin/AuditLogsPage";

import { UserRole } from "./types/hrms";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RoleRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const role = user?.role || "EMPLOYEE";
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function MainAppContent() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected GA WORK-TIME Application Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
          {/* Dashboard / Overview */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* People & Workstations (Real Staff Directory) */}
          <Route path="/people" element={<Navigate to="/people/employees" replace />} />
          <Route
            path="/people/employees"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                <EmployeesPage />
              </RoleRoute>
            }
          />

          {/* Time Tracking & Desktop Activity Telemetry */}
          <Route path="/time" element={<Navigate to="/time/timeline" replace />} />
          <Route path="/time/timeline" element={<ActivityTimelinePage />} />
          <Route path="/time/apps" element={<ApplicationUsagePage />} />
          <Route path="/time/applications" element={<ApplicationUsagePage />} />
          <Route path="/time/inactivity" element={<InactivityReviewPage />} />
          <Route
            path="/time/live"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                <TeamLiveActivityPage />
              </RoleRoute>
            }
          />
          <Route
            path="/team/live"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                <TeamLiveActivityPage />
              </RoleRoute>
            }
          />

          {/* Workstation Fleet & Enrolled Devices */}
          <Route path="/devices" element={<DeviceHealthPage />} />

          {/* Time Reports & CSV/Excel Exports */}
          <Route path="/reports" element={<ReportsPage />} />

          {/* Administration & Tracking Policies */}
          <Route
            path="/admin/policies"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <TrackingPoliciesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/tracking-policies"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <TrackingPoliciesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <SettingsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users-roles"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN"]}>
                <UsersRolesPage />
              </RoleRoute>
            }
          />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route
            path="/admin/audit-logs"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <AuditLogsPage />
              </RoleRoute>
            }
          />

          {/* Legacy HRMS URL Redirects to relevant GA WORK-TIME pages */}
          <Route path="/time/attendance" element={<Navigate to="/time/timeline" replace />} />
          <Route path="/time/regularization" element={<Navigate to="/time/inactivity" replace />} />
          <Route path="/time/shifts" element={<Navigate to="/admin/tracking-policies" replace />} />
          <Route path="/time/holidays" element={<Navigate to="/admin/tracking-policies" replace />} />
          <Route path="/leave/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/payroll/*" element={<Navigate to="/reports" replace />} />
          <Route path="/recruitment" element={<Navigate to="/dashboard" replace />} />
          <Route path="/assets" element={<Navigate to="/devices" replace />} />
          <Route path="/performance" element={<Navigate to="/dashboard" replace />} />
          <Route path="/onboarding/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/people/departments" element={<Navigate to="/people/employees" replace />} />
          <Route path="/people/designations" element={<Navigate to="/people/employees" replace />} />
          <Route path="/people/organization" element={<Navigate to="/people/employees" replace />} />
          <Route path="/people/documents" element={<Navigate to="/people/employees" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ToastProvider>
        <AuthProvider>
          <HrmsProvider>
            <MainAppContent />
          </HrmsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
