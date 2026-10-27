import { storage, STORAGE_KEYS } from "./storage";
import {
  initialCompany,
  initialBranches,
  initialDepartments,
  initialDesignations,
  initialShifts,
  initialLeaveTypes,
  initialHolidays,
  initialEmployees,
  initialSalaryStructures,
  initialAttendanceRecords,
  initialRegularizations,
  initialLeaveRequests,
  initialPayrollRecords,
  initialPayslips,
  initialDocuments,
  initialNotifications,
  initialAuditLogs,
  initialSettings,
  initialJobs,
  initialCandidates,
  initialAssets,
  initialGoals,
  initialAppraisals,
  initialOnboardingConfig,
  initialOnboardingDossiers,
} from "./seedData";
import { CurrentUser, Employee, OnboardingConfig, CandidateDossier } from "../types/hrms";

export const DEFAULT_USER: CurrentUser = {
  id: "usr-admin-01",
  name: "System Admin",
  email: "admin@ga-hrms.io",
  role: "SUPER_ADMIN",
  avatar: "",
  designation: "System Administrator",
  department: "System Administration",
};

export function initializeHrmsStorage(forceReset = false) {
  const isInitialized = storage.get<boolean>(STORAGE_KEYS.INITIALIZED, false);

  if (!isInitialized || forceReset) {
    storage.set(STORAGE_KEYS.COMPANY, initialCompany);
    storage.set(STORAGE_KEYS.USER, DEFAULT_USER);
    storage.set(STORAGE_KEYS.EMPLOYEES, initialEmployees);
    storage.set(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    storage.set(STORAGE_KEYS.DESIGNATIONS, initialDesignations);
    storage.set(STORAGE_KEYS.BRANCHES, initialBranches);
    storage.set(STORAGE_KEYS.ATTENDANCE, initialAttendanceRecords);
    storage.set(STORAGE_KEYS.REGULARIZATIONS, initialRegularizations);
    storage.set(STORAGE_KEYS.LEAVE_TYPES, initialLeaveTypes);
    storage.set(STORAGE_KEYS.LEAVE_REQUESTS, initialLeaveRequests);
    storage.set(STORAGE_KEYS.HOLIDAYS, initialHolidays);
    storage.set(STORAGE_KEYS.SHIFTS, initialShifts);
    storage.set(STORAGE_KEYS.SALARY_STRUCTURES, initialSalaryStructures);
    storage.set(STORAGE_KEYS.PAYROLL, initialPayrollRecords);
    storage.set(STORAGE_KEYS.PAYSLIPS, initialPayslips);
    storage.set(STORAGE_KEYS.DOCUMENTS, initialDocuments);
    storage.set(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    storage.set(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    storage.set(STORAGE_KEYS.SETTINGS, initialSettings);
    storage.set(STORAGE_KEYS.JOBS, initialJobs);
    storage.set(STORAGE_KEYS.CANDIDATES, initialCandidates);
    storage.set(STORAGE_KEYS.ASSETS, initialAssets);
    storage.set(STORAGE_KEYS.GOALS, initialGoals);
    storage.set(STORAGE_KEYS.APPRAISALS, initialAppraisals);
    storage.set(STORAGE_KEYS.ONBOARDING_CONFIG, initialOnboardingConfig);
    storage.set(STORAGE_KEYS.ONBOARDING_DOSSIERS, initialOnboardingDossiers);
    storage.set(STORAGE_KEYS.INITIALIZED, true);
    console.log("✅ GA-HRMS LocalStorage successfully initialized with enterprise demo dataset.");
  } else {
    // Migration guard: ensure new modules exist and have demo data if empty or missing
    const checkAndSeed = (key: string, seed: any[]) => {
      const existing = storage.get<any[]>(key, []);
      if (!Array.isArray(existing) || existing.length === 0) {
        storage.set(key, seed);
      }
    };
    checkAndSeed(STORAGE_KEYS.JOBS, initialJobs);
    checkAndSeed(STORAGE_KEYS.CANDIDATES, initialCandidates);
    checkAndSeed(STORAGE_KEYS.ASSETS, initialAssets);
    checkAndSeed(STORAGE_KEYS.GOALS, initialGoals);
    checkAndSeed(STORAGE_KEYS.APPRAISALS, initialAppraisals);
    const existingDossiers = storage.get<CandidateDossier[]>(STORAGE_KEYS.ONBOARDING_DOSSIERS, []);
    if (!Array.isArray(existingDossiers) || existingDossiers.length === 0) {
      storage.set(STORAGE_KEYS.ONBOARDING_DOSSIERS, initialOnboardingDossiers);
    } else {
      const emp1033 = existingDossiers.find((d) => d.employeeId === "EMP-1033");
      if (emp1033) {
        const needsDocsUpdate = !emp1033.uploadedDocuments?.[0]?.url;
        const needsOfferUpdate = !emp1033.formData?.offeredDesignation || !emp1033.formData?.offeredDepartment || !emp1033.formData?.offeredAnnualCtc;
        if (needsDocsUpdate || needsOfferUpdate) {
          const merged = existingDossiers.map((d) => (d.employeeId === "EMP-1033" ? initialOnboardingDossiers[0] : d));
          storage.set(STORAGE_KEYS.ONBOARDING_DOSSIERS, merged);
        }
      }
    }

    const existingConfig = storage.get<OnboardingConfig | null>(STORAGE_KEYS.ONBOARDING_CONFIG, null);
    if (!existingConfig || !existingConfig.sections || existingConfig.sections.length === 0) {
      storage.set(STORAGE_KEYS.ONBOARDING_CONFIG, initialOnboardingConfig);
    }

    // Migration guard: ensure full 31-day demo attendance is present in existing localStorage
    const currentAttendance = storage.get<any[]>(STORAGE_KEYS.ATTENDANCE, []);
    if (Array.isArray(currentAttendance)) {
      const emp1004Count = currentAttendance.filter((a) => a.employeeId === "EMP-1004").length;
      if (emp1004Count < 28) {
        const emp1004Records = initialAttendanceRecords.filter((a) => a.employeeId === "EMP-1004");
        const mergedAttendance = [
          ...currentAttendance.filter((a) => a.employeeId !== "EMP-1004"),
          ...emp1004Records,
        ];
        storage.set(STORAGE_KEYS.ATTENDANCE, mergedAttendance);
      }
    }

    // Migration guard: ensure new demo regularizations are present
    const currentRegs = storage.get<any[]>(STORAGE_KEYS.REGULARIZATIONS, []);
    if (Array.isArray(currentRegs)) {
      const hasReg3 = currentRegs.some((r) => r.id === "reg-003");
      if (!hasReg3) {
        storage.set(STORAGE_KEYS.REGULARIZATIONS, initialRegularizations);
      }
    }

    // Sync Ajay Pawar avatar to Superman in existing localStorage
    const currentEmployees = storage.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
    if (Array.isArray(currentEmployees) && currentEmployees.length > 0) {
      let updated = false;
      const syncedEmployees = currentEmployees.map((emp) => {
        if (emp.id === "EMP-1001" || emp.email === "ajay.pawar@ga-hrms.io") {
          if (emp.avatar !== "/avatars/superman.jpg") {
            updated = true;
            return { ...emp, avatar: "/avatars/superman.jpg" };
          }
        }
        return emp;
      });
      if (updated) {
        storage.set(STORAGE_KEYS.EMPLOYEES, syncedEmployees);
      }

      // Migration guard: ensure EMP-1033 (Ramesh Patil - new hire demo) is present
      const hasEmp1033 = currentEmployees.some((emp) => emp.id === "EMP-1033");
      if (!hasEmp1033) {
        const emp1033 = initialEmployees.find((e) => e.id === "EMP-1033");
        if (emp1033) {
          storage.set(STORAGE_KEYS.EMPLOYEES, [emp1033, ...currentEmployees]);
        }
      }
    }

    const currentUser = storage.get<CurrentUser | null>(STORAGE_KEYS.USER, null);
    if (currentUser && (currentUser.id === "EMP-1001" || currentUser.email === "ajay.pawar@ga-hrms.io")) {
      if (currentUser.avatar !== "/avatars/superman.jpg") {
        storage.set(STORAGE_KEYS.USER, { ...currentUser, avatar: "/avatars/superman.jpg" });
      }
    }
  }
}
