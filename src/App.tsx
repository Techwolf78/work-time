import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/authContext";
import { ToastProvider } from "./lib/toastContext";
import { HrmsProvider } from "./lib/hrmsContext";
import { AppShell } from "./components/layout/AppShell";
import { AddEmployeeModal } from "./pages/people/AddEmployeeModal";
import { ApplyLeaveModal } from "./pages/leave/ApplyLeaveModal";
import { AttendanceCorrectionModal } from "./pages/time/AttendanceCorrectionModal";

// Pages
import { LandingPage } from "./pages/landing/LandingPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { EmployeesPage } from "./pages/people/EmployeesPage";
import { EmployeeProfilePage } from "./pages/people/EmployeeProfilePage";
import { DepartmentsPage } from "./pages/people/DepartmentsPage";
import { DesignationsPage } from "./pages/people/DesignationsPage";
import { OrganizationPage } from "./pages/people/OrganizationPage";
import { DocumentsPage } from "./pages/people/DocumentsPage";
import { AttendancePage } from "./pages/time/AttendancePage";
import { RegularizationPage } from "./pages/time/RegularizationPage";
import { ShiftsPage } from "./pages/time/ShiftsPage";
import { HolidaysPage } from "./pages/time/HolidaysPage";
import { LeaveOverviewPage } from "./pages/leave/LeaveOverviewPage";
import { LeaveRequestsPage } from "./pages/leave/LeaveRequestsPage";
import { LeavePoliciesPage } from "./pages/leave/LeavePoliciesPage";
import { PayrollDashboardPage } from "./pages/payroll/PayrollDashboardPage";
import { SalaryStructurePage } from "./pages/payroll/SalaryStructurePage";
import { PayrollRunPage } from "./pages/payroll/PayrollRunPage";
import { PayslipsPage } from "./pages/payroll/PayslipsPage";
import { ReportsPage } from "./pages/reports/ReportsPage";
import { UsersRolesPage } from "./pages/admin/UsersRolesPage";
import { SettingsPage } from "./pages/admin/SettingsPage";
import { NotificationsPage } from "./pages/admin/NotificationsPage";
import { AuditLogsPage } from "./pages/admin/AuditLogsPage";
import { RecruitmentPage } from "./pages/recruitment/RecruitmentPage";
import { AssetsPage } from "./pages/assets/AssetsPage";
import { PerformancePage } from "./pages/performance/PerformancePage";

import { SelfOnboardingPage } from "./pages/people/SelfOnboardingPage";
import { OnboardingSetupPage } from "./pages/admin/OnboardingSetupPage";
import { useHrms } from "./lib/hrmsContext";

// Telemetry & GA WORK-TIME Pages
import { ActivityTimelinePage } from "./pages/time/ActivityTimelinePage";
import { ApplicationUsagePage } from "./pages/time/ApplicationUsagePage";
import { InactivityReviewPage } from "./pages/time/InactivityReviewPage";
import { TeamLiveActivityPage } from "./pages/time/TeamLiveActivityPage";
import { DeviceHealthPage } from "./pages/devices/DeviceHealthPage";
import { TrackingPoliciesPage } from "./pages/admin/TrackingPoliciesPage";

import { UserRole } from "./types/hrms";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { employees } = useHrms();

  if (user?.role === "EMPLOYEE") {
    const emp = employees.find((e) => e.id === user.employeeId || e.email === user.email);
    if (emp && emp.onboardingCompleted === false) {
      return <Navigate to="/onboarding" replace />;
    }
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
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [isAttendanceCorrectionOpen, setIsAttendanceCorrectionOpen] = useState(false);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Standalone Employee Self-Onboarding Route */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <SelfOnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard Layout with Onboarding Guard */}
        <Route
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <AppShell
                  onOpenAddEmployee={() => setIsAddEmployeeOpen(true)}
                  onOpenApplyLeave={() => setIsApplyLeaveOpen(true)}
                  onOpenAttendanceCorrection={() => setIsAttendanceCorrectionOpen(true)}
                />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <DashboardPage />
            }
          />

          {/* People Module */}
          <Route
            path="/people/employees"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                <EmployeesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/people/employees/:id"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                <EmployeeProfilePage />
              </RoleRoute>
            }
          />
          <Route
            path="/people/departments"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <DepartmentsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/people/designations"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <DesignationsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/people/organization"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                <OrganizationPage />
              </RoleRoute>
            }
          />
          <Route
            path="/people/documents"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                <DocumentsPage />
              </RoleRoute>
            }
          />

          {/* Telemetry & Time Tracking */}
          <Route path="/time/timeline" element={<ActivityTimelinePage />} />
          <Route path="/time/apps" element={<ApplicationUsagePage />} />
          <Route path="/time/inactivity" element={<InactivityReviewPage />} />
          <Route path="/time/attendance" element={<AttendancePage />} />
          <Route
            path="/team/live"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                <TeamLiveActivityPage />
              </RoleRoute>
            }
          />
          <Route path="/devices" element={<DeviceHealthPage />} />
          <Route
            path="/admin/policies"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <TrackingPoliciesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/time/regularization"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                <RegularizationPage />
              </RoleRoute>
            }
          />
          <Route
            path="/time/shifts"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                <ShiftsPage />
              </RoleRoute>
            }
          />
          <Route path="/time/holidays" element={<HolidaysPage />} />

          {/* Leave Management */}
          <Route
            path="/leave/overview"
            element={<LeaveOverviewPage onOpenApplyLeave={() => setIsApplyLeaveOpen(true)} />}
          />
          <Route
            path="/leave/requests"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                <LeaveRequestsPage onOpenApplyLeave={() => setIsApplyLeaveOpen(true)} />
              </RoleRoute>
            }
          />
          <Route
            path="/leave/policies"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <LeavePoliciesPage />
              </RoleRoute>
            }
          />

          {/* Payroll Management */}
          <Route
            path="/payroll/dashboard"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <PayrollDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/salary-structures"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <SalaryStructurePage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/runs"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <PayrollRunPage />
              </RoleRoute>
            }
          />
          <Route path="/payroll/payslips" element={<PayslipsPage />} />

          {/* Reports */}
          <Route path="/reports" element={<ReportsPage />} />

          {/* Administration */}
          <Route
            path="/admin/users-roles"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN"]}>
                <UsersRolesPage />
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
            path="/admin/onboarding-setup"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <OnboardingSetupPage />
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

          {/* Extended Enterprise Modules */}
          <Route
            path="/recruitment"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <RecruitmentPage />
              </RoleRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <AssetsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/performance"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                <PerformancePage />
              </RoleRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>

      {/* Global Modals */}
      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
      />

      <ApplyLeaveModal
        isOpen={isApplyLeaveOpen}
        onClose={() => setIsApplyLeaveOpen(false)}
      />

      <AttendanceCorrectionModal
        isOpen={isAttendanceCorrectionOpen}
        onClose={() => setIsAttendanceCorrectionOpen(false)}
      />
    </>
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
