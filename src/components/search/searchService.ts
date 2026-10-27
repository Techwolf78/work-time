import React from "react";
import {
  Users,
  Building2,
  FileCheck,
  Receipt,
  FileText,
  UserPlus,
  CalendarPlus,
  Clock,
  ClockAlert,
  WalletCards,
  Layers,
  Laptop,
  Briefcase,
  Target,
  Shield,
  Calendar,
  Settings,
  ShieldCheck,
  Compass,
} from "lucide-react";
import {
  ISearchService,
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  SearchCategoryGroup,
  SearchCategory,
  QuickActionItem,
  SearchActionCallbacks,
} from "./searchTypes";
import {
  Employee,
  Department,
  Designation,
  Branch,
  LeaveRequest,
  LeaveType,
  AttendanceRecord,
  AttendanceRegularization,
  UserRole,
} from "../../types/hrms";

export interface HrmsSearchContextData {
  employees: Employee[];
  departments: Department[];
  designations: Designation[];
  branches: Branch[];
  leaveRequests: LeaveRequest[];
  leaveTypes: LeaveType[];
  attendance: AttendanceRecord[];
  regularizations: AttendanceRegularization[];
}

export class ClientSearchService implements ISearchService {
  private data: HrmsSearchContextData;

  constructor(data: HrmsSearchContextData) {
    this.data = data;
  }

  public updateData(data: HrmsSearchContextData) {
    this.data = data;
  }

  public getQuickActions(role: UserRole, callbacks: SearchActionCallbacks): QuickActionItem[] {
    const isSuperOrHr = role === "SUPER_ADMIN" || role === "HR_ADMIN";
    const isManager = role === "MANAGER";

    const allActions: QuickActionItem[] = [
      {
        id: "qa-add-employee",
        title: "Add Employee",
        subtitle: "Initiate multi-step onboarding for a new employee",
        action: () => {
          callbacks.onCloseSearch();
          if (callbacks.onOpenAddEmployee) {
            callbacks.onOpenAddEmployee();
          } else {
            callbacks.navigate("/people/employees");
          }
        },
        icon: React.createElement(UserPlus, { className: "w-3.5 h-3.5 text-blue-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN"],
      },
      {
        id: "qa-apply-leave",
        title: "Apply for Leave",
        subtitle: "Submit a new leave application with balance check",
        action: () => {
          callbacks.onCloseSearch();
          if (callbacks.onOpenApplyLeave) {
            callbacks.onOpenApplyLeave();
          } else {
            callbacks.navigate("/leave/overview");
          }
        },
        icon: React.createElement(CalendarPlus, { className: "w-3.5 h-3.5 text-emerald-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      {
        id: "qa-my-attendance",
        title: "View My Attendance",
        subtitle: "Check daily punches, working hours and normalization",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/time/attendance");
        },
        path: "/time/attendance",
        icon: React.createElement(Clock, { className: "w-3.5 h-3.5 text-sky-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      {
        id: "qa-regularization",
        title: "Request Attendance Correction",
        subtitle: "Correct missed in/out punches or report discrepancies",
        action: () => {
          callbacks.onCloseSearch();
          if (callbacks.onOpenAttendanceCorrection) {
            callbacks.onOpenAttendanceCorrection();
          } else {
            callbacks.navigate("/time/regularization");
          }
        },
        icon: React.createElement(ClockAlert, { className: "w-3.5 h-3.5 text-amber-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      {
        id: "qa-review-approvals",
        title: "Review Pending Approvals",
        subtitle: "Process team leave requests and attendance corrections",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/leave/requests");
        },
        path: "/leave/requests",
        icon: React.createElement(FileCheck, { className: "w-3.5 h-3.5 text-indigo-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
      },
      {
        id: "qa-payslips",
        title: "Download Payslips",
        subtitle: "View monthly payslips and compensation statements",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/payroll/payslips");
        },
        path: "/payroll/payslips",
        icon: React.createElement(WalletCards, { className: "w-3.5 h-3.5 text-teal-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      {
        id: "qa-pay-run",
        title: "Execute Pay Run",
        subtitle: "Run statutory monthly payroll computation and bank batch",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/payroll/runs");
        },
        path: "/payroll/runs",
        icon: React.createElement(Receipt, { className: "w-3.5 h-3.5 text-emerald-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN"],
      },
      {
        id: "qa-settings",
        title: "Open HRMS Settings",
        subtitle: "Configure fiscal policies, working days, and statutory rates",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/admin/settings");
        },
        path: "/admin/settings",
        icon: React.createElement(Settings, { className: "w-3.5 h-3.5 text-gray-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN"],
      },
    ];

    return allActions.filter((action) => action.allowedRoles.includes(role));
  }

  public async search(request: SearchRequest, signal?: AbortSignal): Promise<SearchResponse> {
    const startTime = performance.now();
    const { query, category = "ALL", role, employeeId } = request;
    const cleanQuery = (query || "").toLowerCase().trim();

    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    // Role visibility flags
    const isSuperOrHr = role === "SUPER_ADMIN" || role === "HR_ADMIN";
    const isManager = role === "MANAGER";
    const isEmployee = role === "EMPLOYEE";
    const canViewPeople = role !== "EMPLOYEE";

    const designationMap = new Map<string, string>();
    this.data.designations.forEach((d) => designationMap.set(d.id, d.title));

    const departmentMap = new Map<string, string>();
    this.data.departments.forEach((d) => departmentMap.set(d.id, d.name));

    // Results buckets
    const peopleResults: SearchResultItem[] = [];
    const attendanceResults: SearchResultItem[] = [];
    const leaveResults: SearchResultItem[] = [];
    const orgResults: SearchResultItem[] = [];
    const pageResults: SearchResultItem[] = [];

    // 1. Search People (Employees)
    if (canViewPeople && (category === "ALL" || category === "PEOPLE")) {
      const matched = this.data.employees
        .filter((emp) => {
          if (!emp) return false;
          const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
          const code = (emp.employeeCode || "").toLowerCase();
          const email = (emp.email || "").toLowerCase();
          const desig = (designationMap.get(emp.designationId) || "").toLowerCase();
          const dept = (departmentMap.get(emp.departmentId) || "").toLowerCase();

          return (
            fullName.includes(cleanQuery) ||
            code.includes(cleanQuery) ||
            email.includes(cleanQuery) ||
            desig.includes(cleanQuery) ||
            dept.includes(cleanQuery)
          );
        })
        .map((emp) => {
          const desig = designationMap.get(emp.designationId) || "Staff";
          const dept = departmentMap.get(emp.departmentId) || "General";
          const isExact = (emp.employeeCode || "").toLowerCase() === cleanQuery;

          return {
            id: `emp-${emp.id}`,
            type: "employee" as const,
            category: "PEOPLE" as const,
            title: `${emp.firstName} ${emp.lastName}`,
            subtitle: `${emp.employeeCode} • ${desig} (${dept})`,
            badge: emp.status,
            badgeVariant: (emp.status === "ACTIVE"
              ? "success"
              : emp.status === "PROBATION"
              ? "warning"
              : "neutral") as "success" | "warning" | "neutral",
            path: `/people/employees/${emp.id}`,
            avatar: emp.avatar,
            initials: `${emp.firstName?.[0] || ""}${emp.lastName?.[0] || ""}`,
            score: isExact ? 100 : 50,
          };
        });

      peopleResults.push(...matched.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 8));
    }

    // 2. Search Attendance & Regularizations
    if (category === "ALL" || category === "ATTENDANCE") {
      // Regularization requests
      const matchedRegs = this.data.regularizations
        .filter((r) => {
          if (!r) return false;
          if (isEmployee && r.employeeId !== employeeId) return false;
          const emp = this.data.employees.find((e) => e.id === r.employeeId);
          const fullName = `${emp?.firstName || ""} ${emp?.lastName || ""}`.toLowerCase();
          const code = (emp?.employeeCode || "").toLowerCase();
          const reason = (r.reason || "").toLowerCase();
          const date = (r.date || "").toLowerCase();
          const type = (r.missingPunchType || "").toLowerCase();

          return (
            fullName.includes(cleanQuery) ||
            code.includes(cleanQuery) ||
            reason.includes(cleanQuery) ||
            date.includes(cleanQuery) ||
            type.includes(cleanQuery)
          );
        })
        .map((r) => {
          const emp = this.data.employees.find((e) => e.id === r.employeeId);
          return {
            id: `reg-${r.id}`,
            type: "regularization" as const,
            category: "ATTENDANCE" as const,
            title: `${emp ? `${emp.firstName} ${emp.lastName}` : "Attendance Correction"} • ${r.missingPunchType} Punch`,
            subtitle: `Date: ${r.date} @ ${r.requestedTime} • ${r.reason || "Missing punch regularization"}`,
            badge: r.status,
            badgeVariant: (r.status === "APPROVED"
              ? "success"
              : r.status === "REJECTED"
              ? "danger"
              : "warning") as "success" | "danger" | "warning",
            path: "/time/regularization",
            icon: React.createElement(ClockAlert, { className: "w-3.5 h-3.5 text-amber-600" }),
          };
        });

      // Attendance records
      const matchedAtt = this.data.attendance
        .filter((a) => {
          if (!a) return false;
          if (isEmployee && a.employeeId !== employeeId) return false;
          const emp = this.data.employees.find((e) => e.id === a.employeeId);
          const name = `${emp?.firstName || ""} ${emp?.lastName || ""}`.toLowerCase();
          const date = (a.date || "").toLowerCase();
          const status = (a.status || "").toLowerCase();
          return name.includes(cleanQuery) || date.includes(cleanQuery) || status.includes(cleanQuery);
        })
        .slice(0, 4)
        .map((a) => {
          const emp = this.data.employees.find((e) => e.id === a.employeeId);
          return {
            id: `att-${a.id}`,
            type: "attendance" as const,
            category: "ATTENDANCE" as const,
            title: `${emp ? `${emp.firstName} ${emp.lastName}` : "Attendance Record"} • ${a.date}`,
            subtitle: `Working Hours: ${a.workingHours}h • In: ${a.firstIn || "--:--"} • Out: ${a.lastOut || "--:--"}`,
            badge: a.status,
            badgeVariant: (a.status === "PRESENT"
              ? "success"
              : a.status === "LATE"
              ? "warning"
              : a.status === "ABSENT"
              ? "danger"
              : "neutral") as "success" | "warning" | "danger" | "neutral",
            path: "/time/attendance",
            icon: React.createElement(Clock, { className: "w-3.5 h-3.5 text-sky-600" }),
          };
        });

      attendanceResults.push(...matchedRegs.slice(0, 4), ...matchedAtt);
    }

    // 3. Search Leave Requests & Policies
    if (category === "ALL" || category === "LEAVE") {
      const matchedLeaves = this.data.leaveRequests
        .filter((l) => {
          if (!l) return false;
          if (isEmployee && l.employeeId !== employeeId) return false;
          const emp = this.data.employees.find((e) => e.id === l.employeeId);
          const name = `${emp?.firstName || ""} ${emp?.lastName || ""}`.toLowerCase();
          const reason = (l.reason || "").toLowerCase();
          const status = (l.status || "").toLowerCase();
          const lType = this.data.leaveTypes.find((t) => t.id === l.leaveTypeId);
          const typeName = (lType?.name || "").toLowerCase();

          return (
            name.includes(cleanQuery) ||
            reason.includes(cleanQuery) ||
            status.includes(cleanQuery) ||
            typeName.includes(cleanQuery) ||
            (l.fromDate || "").includes(cleanQuery)
          );
        })
        .map((l) => {
          const emp = this.data.employees.find((e) => e.id === l.employeeId);
          const lType = this.data.leaveTypes.find((t) => t.id === l.leaveTypeId);
          return {
            id: `leave-${l.id}`,
            type: "leave" as const,
            category: "LEAVE" as const,
            title: `${emp ? `${emp.firstName} ${emp.lastName}` : "Leave Request"} • ${lType?.name || "Leave"} (${l.days}d)`,
            subtitle: `${l.fromDate} to ${l.toDate} • Reason: ${l.reason || "Not specified"}`,
            badge: l.status,
            badgeVariant: (l.status === "APPROVED"
              ? "success"
              : l.status === "REJECTED"
              ? "danger"
              : "warning") as "success" | "danger" | "warning",
            path: isEmployee ? "/leave/overview" : "/leave/requests",
            icon: React.createElement(CalendarPlus, { className: "w-3.5 h-3.5 text-emerald-600" }),
          };
        });

      // Leave Types & Policies
      const matchedPolicies = this.data.leaveTypes
        .filter((t) => {
          if (!t) return false;
          return (
            (t.name || "").toLowerCase().includes(cleanQuery) ||
            (t.code || "").toLowerCase().includes(cleanQuery)
          );
        })
        .map((t) => ({
          id: `ltype-${t.id}`,
          type: "leave" as const,
          category: "LEAVE" as const,
          title: `${t.name} (${t.code}) Policy`,
          subtitle: `Annual Quota: ${t.annualQuota} days • Max Carry Forward: ${t.carryForwardMax} days`,
          badge: `${t.annualQuota}d Quota`,
          path: "/leave/policies",
          icon: React.createElement(ShieldCheck, { className: "w-3.5 h-3.5 text-emerald-600" }),
        }));

      leaveResults.push(...matchedLeaves.slice(0, 6), ...matchedPolicies.slice(0, 2));
    }

    // 4. Search Organization (Departments, Branches)
    if (isSuperOrHr && (category === "ALL" || category === "ORGANIZATION")) {
      const matchedDepts = this.data.departments
        .filter((d) => {
          if (!d) return false;
          return (
            (d.name || "").toLowerCase().includes(cleanQuery) ||
            (d.code || "").toLowerCase().includes(cleanQuery)
          );
        })
        .map((d) => ({
          id: `dept-${d.id}`,
          type: "department" as const,
          category: "ORGANIZATION" as const,
          title: `${d.name} (${d.code})`,
          subtitle: `Department • Cost Center • GA-HRMS Org Unit`,
          badge: d.code,
          path: "/people/departments",
          icon: React.createElement(Building2, { className: "w-3.5 h-3.5 text-purple-600" }),
        }));

      const matchedBranches = this.data.branches
        .filter((b) => {
          if (!b) return false;
          return (
            (b.name || "").toLowerCase().includes(cleanQuery) ||
            (b.city || "").toLowerCase().includes(cleanQuery) ||
            (b.state || "").toLowerCase().includes(cleanQuery)
          );
        })
        .map((b) => ({
          id: `branch-${b.id}`,
          type: "branch" as const,
          category: "ORGANIZATION" as const,
          title: `${b.name} Branch`,
          subtitle: `Location: ${b.city}, ${b.state} • Operational Office`,
          badge: b.city,
          path: "/people/departments",
          icon: React.createElement(Compass, { className: "w-3.5 h-3.5 text-indigo-600" }),
        }));

      orgResults.push(...matchedDepts.slice(0, 4), ...matchedBranches.slice(0, 3));
    }

    // 5. Search Pages & Settings
    if (category === "ALL" || category === "PAGES") {
      const pagesCatalog = [
        {
          title: "Employee Directory",
          subtitle: "People > Employee Roster & Profiles",
          keywords: "directory staff roster employees people team",
          path: "/people/employees",
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
          icon: Users,
        },
        {
          title: "Organization Chart",
          subtitle: "People > Visual Hierarchy & Reporting Lines",
          keywords: "org hierarchy chart tree reporting structure",
          path: "/people/org-chart",
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
          icon: Layers,
        },
        {
          title: "Departments & Cost Centers",
          subtitle: "People > Business Units & Headcounts",
          keywords: "departments units business cost centers",
          path: "/people/departments",
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
          icon: Building2,
        },
        {
          title: "Employee Documents",
          subtitle: "People > Verified Documents & Policy Handbook",
          keywords: "documents files kyc pan aadhaar certificates policies",
          path: "/people/documents",
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
          icon: FileText,
        },
        {
          title: "Attendance Register",
          subtitle: "Time > Daily Check-Ins & Biometric Logs",
          keywords: "attendance check in punch time clock late present",
          path: "/time/attendance",
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
          icon: Clock,
        },
        {
          title: "Attendance Regularization",
          subtitle: "Time > Missed Punch Approvals & Outdoor Duty",
          keywords: "regularization missing punch correction outdoor duty",
          path: "/time/regularization",
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
          icon: ClockAlert,
        },
        {
          title: "Shift Roster & Timings",
          subtitle: "Time > Shift Allocations & Grace Periods",
          keywords: "shifts roster schedule timings night morning",
          path: "/time/shifts",
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
          icon: Calendar,
        },
        {
          title: "Leave Overview",
          subtitle: "Leave > Organizational Leave Balances & Quota",
          keywords: "leave time off balance quota annual sick casual",
          path: "/leave/overview",
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
          icon: CalendarPlus,
        },
        {
          title: "Leave Requests & Approvals",
          subtitle: "Leave > Pending Approvals & Signoffs",
          keywords: "leave requests review approve reject manager",
          path: "/leave/requests",
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
          icon: FileCheck,
        },
        {
          title: "Leave Policies",
          subtitle: "Leave > Statutory Rules & Accrual Config",
          keywords: "leave policies statutory rules entitlement",
          path: "/leave/policies",
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
          icon: ShieldCheck,
        },
        {
          title: "Payroll Control Center",
          subtitle: "Payroll > Statutory Computations & EPF/ESIC",
          keywords: "payroll salary compensation epf esic tax statutory",
          path: "/payroll/dashboard",
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
          icon: Receipt,
        },
        {
          title: "All Payslips",
          subtitle: "Payroll > Monthly Salary Statements & PDF Downloads",
          keywords: "payslips salary slips compensation tax deduction",
          path: "/payroll/payslips",
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
          icon: WalletCards,
        },
        {
          title: "Execute Pay Run",
          subtitle: "Payroll > Salary Disbursement & Batch Statements",
          keywords: "pay runs execute process monthly disbursement",
          path: "/payroll/runs",
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
          icon: Receipt,
        },
        {
          title: "Recruitment (ATS)",
          subtitle: "Talent > Job Openings & Candidate Pipeline",
          keywords: "recruitment jobs candidates hiring ats applicant interview",
          path: "/recruitment",
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
          icon: Briefcase,
        },
        {
          title: "IT Assets Management",
          subtitle: "Assets > Hardware Laptops & Inventory Logs",
          keywords: "assets laptops it hardware macbook equipment inventory",
          path: "/assets",
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
          icon: Laptop,
        },
        {
          title: "Performance & OKRs",
          subtitle: "PMS > Quarterly OKRs & 360 Appraisals",
          keywords: "performance okrs goals appraisal kpi reviews rating",
          path: "/performance",
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
          icon: Target,
        },
        {
          title: "Security & Audit Logs",
          subtitle: "Settings > Compliance & Timestamped Actions",
          keywords: "audit logs security compliance events admin",
          path: "/admin/audit-logs",
          roles: ["SUPER_ADMIN"],
          icon: Shield,
        },
        {
          title: "Company Settings",
          subtitle: "Settings > Working Days & Organization Profile",
          keywords: "settings configuration company working days parameters",
          path: "/admin/settings",
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
          icon: Settings,
        },
      ];

      const matchedPages = pagesCatalog
        .filter((p) => {
          if (!p.roles.includes(role)) return false;
          return (
            p.title.toLowerCase().includes(cleanQuery) ||
            p.subtitle.toLowerCase().includes(cleanQuery) ||
            p.keywords.toLowerCase().includes(cleanQuery)
          );
        })
        .map((p) => ({
          id: `page-${p.path}`,
          type: "page" as const,
          category: "PAGES" as const,
          title: p.title,
          subtitle: p.subtitle,
          badge: "Page",
          path: p.path,
          icon: React.createElement(p.icon, { className: "w-3.5 h-3.5 text-gray-500" }),
        }));

      pageResults.push(...matchedPages.slice(0, 6));
    }

    // Build Category Groups
    const groups: SearchCategoryGroup[] = [];

    if (pageResults.length > 0) {
      groups.push({
        category: "PAGES",
        label: "Pages & Settings",
        items: pageResults,
      });
    }

    if (peopleResults.length > 0) {
      groups.push({
        category: "PEOPLE",
        label: "People & Directory",
        items: peopleResults,
      });
    }

    if (attendanceResults.length > 0) {
      groups.push({
        category: "ATTENDANCE",
        label: "Attendance & Punches",
        items: attendanceResults,
      });
    }

    if (leaveResults.length > 0) {
      groups.push({
        category: "LEAVE",
        label: "Leaves & Policies",
        items: leaveResults,
      });
    }

    if (orgResults.length > 0) {
      groups.push({
        category: "ORGANIZATION",
        label: "Organization & Units",
        items: orgResults,
      });
    }

    const totalResults = groups.reduce((sum, g) => sum + g.items.length, 0);
    const executionTimeMs = Math.round(performance.now() - startTime);

    return {
      query,
      category,
      groups,
      totalResults,
      executionTimeMs,
    };
  }
}
