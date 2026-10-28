import { useMemo } from "react";
import { useAuth } from "./authContext";
import { UserRole, CurrentUser } from "../types/hrms";
import {
  CrmEmployeeSummary,
  TelemetryDevice,
  ActivityIntervalRecord,
  DailySummaryRecord,
} from "./telemetryService";

/**
 * Filter staff members according to the current user's role and team assignment.
 * 
 * Rules:
 * - SUPER_ADMIN / HR_ADMIN: Can view all organization staff.
 * - MANAGER: Can view themselves + employees in their department or with matching reportingManager.
 * - EMPLOYEE: Can ONLY view themselves.
 */
export function getScopedTeamStaff(
  currentUser: CurrentUser | null | undefined,
  allStaff: CrmEmployeeSummary[]
): CrmEmployeeSummary[] {
  if (!currentUser || !currentUser.email) return [];

  const role = currentUser.role || "EMPLOYEE";
  const userEmail = currentUser.email.trim().toLowerCase();
  const userName = (currentUser.name || "").trim().toLowerCase();
  const userDept = (currentUser.department || currentUser.crmDepartment || "").trim().toLowerCase();

  // 1. Super Admins & HR Admins see entire organization
  if (role === "SUPER_ADMIN" || role === "HR_ADMIN") {
    return allStaff;
  }

  // 2. Managers see themselves + their direct reporting employees
  if (role === "MANAGER") {
    const team = allStaff.filter((staff) => {
      const staffEmail = staff.email.trim().toLowerCase();
      // Always include the manager themselves
      if (staffEmail === userEmail) return true;

      // Check reporting manager email/name matches
      const rep = (staff.reportingManager || "").trim().toLowerCase();
      const mgrEmail = (staff.managerEmail || "").trim().toLowerCase();
      if (rep && (rep === userEmail || rep === userName)) return true;
      if (mgrEmail && mgrEmail === userEmail) return true;

      // Department-level team matching
      if (userDept && staff.department) {
        const staffDept = staff.department.trim().toLowerCase();
        if (staffDept === userDept) return true;
      }

      return false;
    });

    // If manager wasn't in allStaff list yet, add synthetic manager record
    if (!team.some((t) => t.email.trim().toLowerCase() === userEmail)) {
      team.unshift({
        id: currentUser.id || currentUser.employeeId || "mgr-self",
        name: currentUser.name || "Manager",
        email: currentUser.email,
        department: currentUser.department || "Operations",
        role: "Manager",
        designation: "Team Manager",
        status: "active",
      });
    }

    return team;
  }

  // 3. Regular Employees see ONLY themselves
  const selfMatch = allStaff.filter(
    (staff) => staff.email.trim().toLowerCase() === userEmail
  );

  if (selfMatch.length > 0) return selfMatch;

  // Fallback self record if not returned from CRM list
  return [
    {
      id: currentUser.id || currentUser.employeeId || "emp-self",
      name: currentUser.name || "Employee",
      email: currentUser.email,
      department: currentUser.department || "Operations",
      role: "Employee",
      designation: "Staff",
      status: "active",
    },
  ];
}

/**
 * Filter Activity Logs to only those belonging to authorized emails
 */
export function filterLogsByRbac(
  logs: ActivityIntervalRecord[],
  allowedEmailsSet: Set<string>
): ActivityIntervalRecord[] {
  if (allowedEmailsSet.size === 0) return [];
  return logs.filter((log) => {
    if (!log.employeeEmail) return false;
    return allowedEmailsSet.has(log.employeeEmail.trim().toLowerCase());
  });
}

/**
 * Filter Workstation Devices to only those belonging to authorized emails
 */
export function filterDevicesByRbac(
  devices: TelemetryDevice[],
  allowedEmailsSet: Set<string>
): TelemetryDevice[] {
  if (allowedEmailsSet.size === 0) return [];
  return devices.filter((dev) => {
    if (!dev.employeeEmail) return false;
    return allowedEmailsSet.has(dev.employeeEmail.trim().toLowerCase());
  });
}

/**
 * Filter Daily Summaries to only those belonging to authorized emails
 */
export function filterSummariesByRbac(
  summaries: DailySummaryRecord[],
  allowedEmailsSet: Set<string>
): DailySummaryRecord[] {
  if (allowedEmailsSet.size === 0) return [];
  return summaries.filter((s) => {
    if (!s.employeeEmail) return false;
    return allowedEmailsSet.has(s.employeeEmail.trim().toLowerCase());
  });
}

/**
 * React Hook providing full RBAC scoping context and filtered collections
 */
export function useRbacScope(
  allStaff: CrmEmployeeSummary[] = [],
  allDevices: TelemetryDevice[] = [],
  allLogs: ActivityIntervalRecord[] = []
) {
  const { user } = useAuth();
  const role: UserRole = user?.role || "EMPLOYEE";

  const isSuperAdmin = role === "SUPER_ADMIN" || role === "HR_ADMIN";
  const isManager = role === "MANAGER";
  const isEmployee = role === "EMPLOYEE";

  // Exact authorized staff list
  const scopedStaff = useMemo(() => {
    return getScopedTeamStaff(user, allStaff);
  }, [user, allStaff]);

  // Set of allowed emails for fast membership checks
  const { scopedEmails, scopedEmailsSet } = useMemo(() => {
    const emails = scopedStaff.map((s) => s.email.trim().toLowerCase());
    return {
      scopedEmails: emails,
      scopedEmailsSet: new Set(emails),
    };
  }, [scopedStaff]);

  // Scoped workstation devices
  const scopedDevices = useMemo(() => {
    if (isSuperAdmin) return allDevices;
    return filterDevicesByRbac(allDevices, scopedEmailsSet);
  }, [isSuperAdmin, allDevices, scopedEmailsSet]);

  // Scoped activity logs
  const scopedLogs = useMemo(() => {
    if (isSuperAdmin) return allLogs;
    return filterLogsByRbac(allLogs, scopedEmailsSet);
  }, [isSuperAdmin, allLogs, scopedEmailsSet]);

  // User switcher allowed? (Admins & Managers can switch between their scoped team members, Employees cannot)
  const canSwitchUser = isSuperAdmin || (isManager && scopedStaff.length > 1);

  return {
    user,
    role,
    isSuperAdmin,
    isManager,
    isEmployee,
    scopedStaff,
    scopedEmails,
    scopedEmailsSet,
    scopedDevices,
    scopedLogs,
    canSwitchUser,
  };
}
