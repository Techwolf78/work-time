import React from "react";
import {
  Users,
  Activity,
  Monitor,
  Laptop,
  FileSpreadsheet,
  ClockAlert,
  Settings,
  Download,
  ShieldCheck,
  Compass,
  LayoutGrid,
  FileText,
  User,
  Coffee,
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
        id: "qa-download-agent",
        title: "Download Desktop Agent (.exe)",
        subtitle: "Get GA-Work-Time.exe for Windows 10/11 background tracking",
        action: () => {
          callbacks.onCloseSearch();
          const a = document.createElement("a");
          a.href = "/downloads/GA-Work-Time.exe";
          a.download = "GA-Work-Time.exe";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        },
        icon: React.createElement(Download, { className: "w-3.5 h-3.5 text-blue-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      {
        id: "qa-timeline",
        title: "Open 24-Hour Timeline",
        subtitle: "View continuous active focus band and application transitions",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/time/timeline");
        },
        path: "/time/timeline",
        icon: React.createElement(Activity, { className: "w-3.5 h-3.5 text-indigo-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      {
        id: "qa-app-usage",
        title: "Application Usage Analytics",
        subtitle: "Analyze time spent across VS Code, Chrome, Slack, etc.",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/time/apps");
        },
        path: "/time/apps",
        icon: React.createElement(Monitor, { className: "w-3.5 h-3.5 text-sky-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      {
        id: "qa-fleet-telemetry",
        title: "Workstation Fleet Telemetry",
        subtitle: "Monitor enrolled laptops, agent versions, and live heartbeats",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/dashboard");
        },
        path: "/dashboard",
        icon: React.createElement(Laptop, { className: "w-3.5 h-3.5 text-purple-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
      },
      {
        id: "qa-team-live",
        title: "Team Live Presence",
        subtitle: "Real-time active, idle, and focus status for all team members",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/time/live");
        },
        path: "/time/live",
        icon: React.createElement(Users, { className: "w-3.5 h-3.5 text-amber-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
      },
      {
        id: "qa-reports",
        title: "Detailed Time Reports",
        subtitle: "Review daily summaries, focus scores, and export Excel reports",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/reports");
        },
        path: "/reports",
        icon: React.createElement(FileSpreadsheet, { className: "w-3.5 h-3.5 text-emerald-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      {
        id: "qa-inactivity",
        title: "Review Inactivity Periods",
        subtitle: "Inspect idle gaps (>5m) and employee break notes",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/time/inactivity");
        },
        path: "/time/inactivity",
        icon: React.createElement(Coffee, { className: "w-3.5 h-3.5 text-rose-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
      },
      {
        id: "qa-policies",
        title: "Tracking Policies & Settings",
        subtitle: "Configure idle thresholds (5m), pause rules & telemetry intervals",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/admin/tracking-policies");
        },
        path: "/admin/tracking-policies",
        icon: React.createElement(Settings, { className: "w-3.5 h-3.5 text-gray-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN"],
      },
    ];

    return allActions.filter((action) => action.allowedRoles.includes(role));
  }

  public async search(request: SearchRequest, signal?: AbortSignal): Promise<SearchResponse> {
    const startTime = performance.now();
    const { query, category = "ALL", role } = request;
    const cleanQuery = (query || "").toLowerCase().trim();

    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const canViewPeople = role !== "EMPLOYEE";

    const designationMap = new Map<string, string>();
    this.data.designations.forEach((d) => designationMap.set(d.id, d.title));

    const departmentMap = new Map<string, string>();
    this.data.departments.forEach((d) => departmentMap.set(d.id, d.name));

    // Results buckets
    const activityResults: SearchResultItem[] = [];
    const deviceResults: SearchResultItem[] = [];
    const peopleResults: SearchResultItem[] = [];
    const reportResults: SearchResultItem[] = [];
    const pageResults: SearchResultItem[] = [];

    // 1. Search People (Team Members)
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
        .slice(0, 6);

      matched.forEach((emp) => {
        const fullName = `${emp.firstName} ${emp.lastName}`;
        const desig = designationMap.get(emp.designationId) || "Team Member";
        const dept = departmentMap.get(emp.departmentId) || "Operations";
        const initials = `${emp.firstName?.[0] || ""}${emp.lastName?.[0] || ""}`.toUpperCase();

        peopleResults.push({
          id: `emp-${emp.id}`,
          type: "employee",
          category: "PEOPLE",
          title: fullName,
          subtitle: `${desig} • ${dept} (${emp.email})`,
          badge: emp.status || "Active",
          badgeVariant: emp.status === "ACTIVE" ? "success" : "neutral",
          path: "/people/employees",
          initials,
          avatar: emp.avatar,
        });
      });
    }

    // 2. Search Time & Activities (Applications & Timeline)
    if (category === "ALL" || category === "ACTIVITY") {
      const activityFeatures = [
        {
          id: "act-timeline",
          title: "24-Hour Continuous Timeline",
          subtitle: "Visual minute-by-minute focus band and active window stream",
          keywords: "timeline activity focus hours active work band",
          path: "/time/timeline",
          badge: "Live Band",
        },
        {
          id: "act-apps",
          title: "Application Usage Breakdown",
          subtitle: "Inspect top foreground apps (Visual Studio Code, Chrome, Slack, etc.)",
          keywords: "application apps software vs code chrome excel slack figma",
          path: "/time/apps",
          badge: "Analytics",
        },
        {
          id: "act-inactivity",
          title: "Inactivity & Break Review",
          subtitle: "Review idle time (>5m), lunch pauses, and absence notes",
          keywords: "idle break pause lunch inactivity gap absence",
          path: "/time/inactivity",
          badge: "Break Logs",
        },
        {
          id: "act-live",
          title: "Team Live Presence",
          subtitle: "Real-time active work status of all online employees",
          keywords: "live presence online team members real-time current",
          path: "/time/live",
          badge: "Live Telemetry",
        },
      ];

      activityFeatures
        .filter((item) => {
          return (
            item.title.toLowerCase().includes(cleanQuery) ||
            item.subtitle.toLowerCase().includes(cleanQuery) ||
            item.keywords.toLowerCase().includes(cleanQuery)
          );
        })
        .forEach((item) => {
          activityResults.push({
            id: item.id,
            type: "activity",
            category: "ACTIVITY",
            title: item.title,
            subtitle: item.subtitle,
            badge: item.badge,
            badgeVariant: "primary",
            path: item.path,
            icon: React.createElement(Activity, { className: "w-4 h-4 text-indigo-600" }),
          });
        });
    }

    // 3. Search Workstations & Devices
    if (category === "ALL" || category === "DEVICES") {
      const deviceEntries = [
        {
          id: "dev-ajay",
          title: "AJAY (Windows 10/11)",
          subtitle: "Active Workstation Agent v1.2.0 • nishadk@gryphonacademy.co.in",
          keywords: "ajay windows laptop workstation laptop-01 agent pc",
          path: "/dashboard",
          badge: "Active",
        },
        {
          id: "dev-download",
          title: "GA-Work-Time.exe",
          subtitle: "Download official Windows background client (34 KB standalone)",
          keywords: "download exe agent installer client setup file",
          path: "/downloads/GA-Work-Time.exe",
          badge: "v1.2.0",
        },
        {
          id: "dev-inventory",
          title: "Workstation Fleet Inventory",
          subtitle: "Enrolled laptops, OS builds, heartbeats, and queue health",
          keywords: "workstations fleet inventory machines devices health",
          path: "/devices",
          badge: "Fleet View",
        },
      ];

      deviceEntries
        .filter((item) => {
          return (
            item.title.toLowerCase().includes(cleanQuery) ||
            item.subtitle.toLowerCase().includes(cleanQuery) ||
            item.keywords.toLowerCase().includes(cleanQuery)
          );
        })
        .forEach((item) => {
          deviceResults.push({
            id: item.id,
            type: "device",
            category: "DEVICES",
            title: item.title,
            subtitle: item.subtitle,
            badge: item.badge,
            badgeVariant: "info",
            path: item.path,
            icon: React.createElement(Laptop, { className: "w-4 h-4 text-purple-600" }),
          });
        });
    }

    // 4. Search Reports & Exports
    if (category === "ALL" || category === "REPORTS") {
      const reportItems = [
        {
          id: "rep-detailed",
          title: "Detailed Work Reports",
          subtitle: "Daily total tracked hours, active seconds, and focus ratios",
          keywords: "reports export excel csv daily summary focus time",
          path: "/reports",
          badge: "Export",
        },
        {
          id: "rep-privacy",
          title: "Privacy by Design Charter",
          subtitle: "Strict endpoint privacy: zero keylogging, zero screen recording",
          keywords: "privacy charter policy keylog recording transparency",
          path: "/dashboard",
          badge: "Charter",
        },
      ];

      reportItems
        .filter((item) => {
          return (
            item.title.toLowerCase().includes(cleanQuery) ||
            item.subtitle.toLowerCase().includes(cleanQuery) ||
            item.keywords.toLowerCase().includes(cleanQuery)
          );
        })
        .forEach((item) => {
          reportResults.push({
            id: item.id,
            type: "report",
            category: "REPORTS",
            title: item.title,
            subtitle: item.subtitle,
            badge: item.badge,
            badgeVariant: "success",
            path: item.path,
            icon: React.createElement(FileSpreadsheet, { className: "w-4 h-4 text-emerald-600" }),
          });
        });
    }

    // 5. Search Navigation Pages & Settings
    if (category === "ALL" || category === "PAGES") {
      const navPages = [
        {
          title: "Overview Dashboard",
          subtitle: "Platform > Organization Overview & Live Telemetry",
          keywords: "dashboard home overview fleet stats today",
          path: "/dashboard",
          icon: Compass,
        },
        {
          title: "24-Hour Continuous Timeline",
          subtitle: "Time Tracking > Minute-by-Minute Focus Band",
          keywords: "timeline activity focus hours active work band",
          path: "/time/timeline",
          icon: Activity,
        },
        {
          title: "Application Usage Breakdown",
          subtitle: "Time Tracking > Foreground Application Analytics",
          keywords: "applications apps software vs code chrome excel slack",
          path: "/time/apps",
          icon: Monitor,
        },
        {
          title: "Team Live Presence",
          subtitle: "Time Tracking > Live Member Activity Stream",
          keywords: "team live presence members staff online",
          path: "/time/live",
          icon: Users,
        },
        {
          title: "Inactivity & Break Review",
          subtitle: "Time Tracking > Idle Review & Absence Notes",
          keywords: "inactivity idle breaks lunch absence notes",
          path: "/time/inactivity",
          icon: Coffee,
        },
        {
          title: "Detailed Reports & Exports",
          subtitle: "Reports > Daily Summaries & Excel Exports",
          keywords: "reports export excel csv analytics summaries",
          path: "/reports",
          icon: FileSpreadsheet,
        },
        {
          title: "Workstation Fleet & Devices",
          subtitle: "Devices > Enrolled Laptops & Agent Health",
          keywords: "devices workstations fleet health laptops agent",
          path: "/devices",
          icon: Laptop,
        },
        {
          title: "Tracking Policies & Rules",
          subtitle: "Settings > Idle Thresholds & Telemetry Cadence",
          keywords: "settings policies tracking idle thresholds pause rules",
          path: "/admin/tracking-policies",
          icon: Settings,
        },
        {
          title: "People Directory",
          subtitle: "Organization > Employee Directory & Roles",
          keywords: "people employees team staff members directory",
          path: "/people/employees",
          icon: Users,
        },
      ];

      navPages
        .filter((page) => {
          return (
            page.title.toLowerCase().includes(cleanQuery) ||
            page.subtitle.toLowerCase().includes(cleanQuery) ||
            page.keywords.toLowerCase().includes(cleanQuery)
          );
        })
        .forEach((page) => {
          pageResults.push({
            id: `page-${page.path}`,
            type: "page",
            category: "PAGES",
            title: page.title,
            subtitle: page.subtitle,
            badge: "Page",
            badgeVariant: "neutral",
            path: page.path,
            icon: React.createElement(page.icon, { className: "w-4 h-4 text-gray-500" }),
          });
        });
    }

    const groups: SearchCategoryGroup[] = [];

    if (activityResults.length > 0) {
      groups.push({ category: "ACTIVITY", label: "Time & Activity", items: activityResults });
    }
    if (deviceResults.length > 0) {
      groups.push({ category: "DEVICES", label: "Workstations & Agent", items: deviceResults });
    }
    if (peopleResults.length > 0) {
      groups.push({ category: "PEOPLE", label: "Team Members", items: peopleResults });
    }
    if (reportResults.length > 0) {
      groups.push({ category: "REPORTS", label: "Reports & Policies", items: reportResults });
    }
    if (pageResults.length > 0) {
      groups.push({ category: "PAGES", label: "Navigation & Pages", items: pageResults });
    }

    const totalResults = groups.reduce((acc, g) => acc + g.items.length, 0);
    const executionTimeMs = performance.now() - startTime;

    return {
      query,
      category,
      groups,
      totalResults,
      executionTimeMs,
    };
  }
}
