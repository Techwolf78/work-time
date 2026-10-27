import { UserRole, CurrentUser } from "../types/hrms";

export interface CrmUserData {
  uid?: string;
  id?: string;
  name?: string;
  displayName?: string;
  email?: string;
  role?: string;
  department?: string;
  departments?: string[] | string;
  reportingManager?: string;
  biometricCode?: string;
  employeeId?: string;
  photoURL?: string;
  avatar?: string;
  isActive?: boolean;
  crmEnabled?: boolean;
}

/**
 * Maps Gryphon CRM Roles and Departments to GA-Work-Time Roles.
 *
 * Rules:
 * 1. SUPER_ADMIN:
 *    - Department is 'Admin' (or contains 'Admin')
 *    - OR Role is 'admin', 'Admin', 'superadmin', 'Super Admin'
 * 2. MANAGER:
 *    - Role is 'Head', 'Director', or 'Manager' (case-insensitive substring match)
 *    - e.g. "Lead Head", "Sales Manager", "Technical Director"
 * 3. EMPLOYEE:
 *    - All other roles (e.g. Executive, Employee, Assistant Manager, Trainer, Placement, Guest, etc.)
 */
export function mapCrmRoleToWorkTimeRole(
  crmRole?: string,
  crmDepartment?: string | string[]
): UserRole {
  const roleStr = (crmRole || "").trim().toLowerCase();

  // Normalize departments into lowercased array
  let depts: string[] = [];
  if (Array.isArray(crmDepartment)) {
    depts = crmDepartment.map((d) => String(d || "").trim().toLowerCase());
  } else if (crmDepartment) {
    depts = [String(crmDepartment).trim().toLowerCase()];
  }

  // 1. Super Admin Check
  const hasAdminDept = depts.some((d) => d === "admin" || d.includes("system admin"));
  const hasAdminRole =
    roleStr === "admin" ||
    roleStr === "superadmin" ||
    roleStr === "super_admin" ||
    roleStr === "super admin";

  if (hasAdminDept || hasAdminRole) {
    return "SUPER_ADMIN";
  }

  // 2. Manager Check (Head, Director, Manager)
  const isManagerRole =
    roleStr.includes("head") ||
    roleStr.includes("director") ||
    roleStr.includes("manager");

  if (isManagerRole) {
    return "MANAGER";
  }

  // 3. Default to Employee
  return "EMPLOYEE";
}

/**
 * Converts a raw Firebase Auth user and Firestore CRM user document into CurrentUser
 */
export function transformCrmUserToWorkTimeUser(
  firebaseUid: string,
  firebaseEmail: string,
  crmData?: CrmUserData | null
): CurrentUser {
  const crmRole = crmData?.role || "Employee";
  const crmDept = crmData?.departments || crmData?.department || "Operations";
  const mappedRole = mapCrmRoleToWorkTimeRole(crmRole, crmDept);

  const displayDept = Array.isArray(crmDept)
    ? crmDept.join(", ")
    : String(crmDept || "Operations");

  return {
    id: firebaseUid,
    name: crmData?.name || crmData?.displayName || firebaseEmail.split("@")[0],
    email: firebaseEmail,
    role: mappedRole,
    avatar: crmData?.photoURL || crmData?.avatar || "",
    employeeId:
      crmData?.biometricCode ||
      crmData?.employeeId ||
      `EMP-${firebaseUid.substring(0, 6).toUpperCase()}`,
    department: displayDept,
    designation: crmData?.role || "Staff Member",
    crmOriginalRole: crmRole,
    crmDepartment: displayDept,
  };
}
