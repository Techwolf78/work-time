import React from "react";
import {
  Users,
  Activity,
  Monitor,
  Laptop,
  FileSpreadsheet,
  Settings,
  Download,
  Compass,
  FileText,
  User,
  Coffee,
  Radio,
  Sliders,
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
    const isEmployee = role === "EMPLOYEE";
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
      // Employee-specific shortcuts
      {
        id: "qa-my-activity",
        title: "My Activity Dashboard",
        subtitle: "View your today's tracked focus time, active hours, and idle duration",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/dashboard");
        },
        path: "/dashboard",
        icon: React.createElement(Activity, { className: "w-3.5 h-3.5 text-emerald-600" }),
        allowedRoles: ["EMPLOYEE"],
      },
      {
        id: "qa-timeline",
        title: isEmployee
          ? "My 24-Hour Timeline"
          : isManager
          ? "Team Activity Timeline"
          : "24-Hour Continuous Timeline",
        subtitle: isEmployee
          ? "View continuous active focus band and application stream"
          : "View continuous active focus band and team transitions",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/time/timeline");
        },
        path: "/time/timeline",
        icon: React.createElement(Activity, { className: "w-3.5 h-3.5 text-indigo-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      {
        id: "qa-profile",
        title: isEmployee ? "My Profile & Workstation" : "My Profile",
        subtitle: "View account details, role, and paired desktop agent",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/profile");
        },
        path: "/profile",
        icon: React.createElement(User, { className: "w-3.5 h-3.5 text-gray-700" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      // Manager & Admin Only
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
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
      },
      {
        id: "qa-team-live",
        title: isManager ? "My Team Presence" : "People & Workstations",
        subtitle: "Real-time active, idle, and focus status for enrolled workstations",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/people/employees");
        },
        path: "/people/employees",
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
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
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
      // Admin Only
      {
        id: "qa-policies",
        title: "Tracking Policies & Rules",
        subtitle: "Configure idle thresholds (5m), pause rules & telemetry intervals",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/admin/policies");
        },
        path: "/admin/policies",
        icon: React.createElement(Sliders, { className: "w-3.5 h-3.5 text-gray-600" }),
        allowedRoles: ["SUPER_ADMIN", "HR_ADMIN"],
      },
      {
        id: "qa-settings",
        title: "Company Settings",
        subtitle: "Organization profile, working hours & system configuration",
        action: () => {
          callbacks.onCloseSearch();
          callbacks.navigate("/admin/settings");
        },
        path: "/admin/settings",
        icon: React.createElement(Settings, { className: "w-3.5 h-3.5 text-gray-700" }),
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

    const isSuperOrHr = role === "SUPER_ADMIN" || role === "HR_ADMIN";
    const isManager = role === "MANAGER";
    const isEmployee = role === "EMPLOYEE";
    const canViewPeople = !isEmployee;
    const canViewManager = isSuperOrHr || isManager;
    const canViewAdmin = isSuperOrHr;

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

    // 1. Search People (Team Members) - Only for Managers and Admins
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

    // 2. Search Time & Activities
    if (category === "ALL" || category === "ACTIVITY") {
      const activityFeatures = isEmployee
        ? [
            {
              id: "act-dashboard",
              title: "My Activity Dashboard",
              subtitle: "Today's tracked focus time, active hours, and idle duration",
              keywords: "activity dashboard focus idle duration today work utilization",
              path: "/dashboard",
              badge: "My Activity",
            },
            {
              id: "act-timeline",
              title: "My 24-Hour Continuous Timeline",
              subtitle: "Visual minute-by-minute focus band and application stream",
              keywords: "timeline activity focus hours active work band stream personal",
              path: "/time/timeline",
              badge: "Timeline",
            },
          ]
        : [
            {
              id: "act-timeline",
              title: isManager ? "Team 24-Hour Timeline" : "24-Hour Continuous Timeline",
              subtitle: "Visual minute-by-minute focus band and active window stream",
              keywords: "timeline activity focus hours active work band team stream",
              path: "/time/timeline",
              badge: "Timeline",
            },
            {
              id: "act-apps",
              title: "Application Usage Breakdown",
              subtitle: "Inspect top foreground apps (VS Code, Chrome, Slack, etc.)",
              keywords: "application apps software vs code chrome excel slack figma",
              path: "/time/apps",
              badge: "Analytics",
            },
            {
              id: "act-inactivity",
              title: "Inactivity & Break Review",
              subtitle: "Review idle time (>5m), lunch pauses, and absence notes",
              keywords: "idle break pause lunch inactivity gap absence notes",
              path: "/time/inactivity",
              badge: "Break Logs",
            },
            {
              id: "act-live",
              title: isManager ? "My Team Presence" : "People & Workstations",
              subtitle: "Real-time active work status and enrolled workstations",
              keywords: "live presence online team members real-time current fleet",
              path: "/people/employees",
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
      if (isEmployee) {
        const employeeDeviceEntries = [
          {
            id: "dev-download",
            title: "Download GA-Work-Time.exe",
            subtitle: "Download official Windows background client for tracking",
            keywords: "download exe agent installer client setup file windows desktop",
            path: "/downloads/GA-Work-Time.exe",
            badge: "Desktop App",
          },
          {
            id: "dev-profile",
            title: "My Workstation Profile",
            subtitle: "Check paired computer hostname and agent sync status",
            keywords: "workstation laptop agent paired host machine profile account",
            path: "/profile",
            badge: "My Device",
          },
        ];

        employeeDeviceEntries
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
      } else {
        const managerDeviceEntries = [
          {
            id: "dev-download",
            title: "Download GA-Work-Time.exe",
            subtitle: "Download official Windows background tracking client",
            keywords: "download exe agent installer client setup file windows",
            path: "/downloads/GA-Work-Time.exe",
            badge: "Desktop App",
          },
          {
            id: "dev-inventory",
            title: "People & Workstations Directory",
            subtitle: "View workstation enrollment status, agent versions, and live heartbeats",
            keywords: "live pulse workstations fleet machines presence active devices",
            path: "/people/employees",
            badge: "Workstations",
          },
        ];

        managerDeviceEntries
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
    }

    // 4. Search Reports & Exports - Only for Managers and Admins
    if (canViewManager && (category === "ALL" || category === "REPORTS")) {
      const reportItems = [
        {
          id: "rep-detailed",
          title: "Detailed Work Reports & Exports",
          subtitle: "Daily total tracked hours, active seconds, focus ratios, and Excel export",
          keywords: "reports export excel csv daily summary focus time timesheet",
          path: "/reports",
          badge: "Export",
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

    // 5. Search Navigation Pages & Settings (Strictly Role-Filtered)
    if (category === "ALL" || category === "PAGES") {
      const allPages = [
        {
          title: isEmployee ? "My Activity" : "Overview Dashboard",
          subtitle: isEmployee ? "Personal Workspace > Today's Tracked Time & Focus" : "Dashboard > Organization Telemetry Overview",
          keywords: "dashboard home overview fleet stats today my activity personal",
          path: "/dashboard",
          icon: Compass,
          allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
        },
        {
          title: isEmployee ? "My Timeline" : isManager ? "Team Timeline" : "24-Hour Continuous Timeline",
          subtitle: "Time Tracking > Minute-by-Minute Focus Band",
          keywords: "timeline activity focus hours active work band stream my timeline",
          path: "/time/timeline",
          icon: Activity,
          allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
        },
        {
          title: "My Profile",
          subtitle: "Account > Personal Profile, Role & Workstation",
          keywords: "profile account user email workstation computer",
          path: "/profile",
          icon: User,
          allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
        },
        {
          title: "Application Usage Breakdown",
          subtitle: "Time Tracking > Foreground Application Analytics",
          keywords: "applications apps software vs code chrome excel slack",
          path: "/time/apps",
          icon: Monitor,
          allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
        },
        {
          title: isManager ? "My Team" : "People & Workstations",
          subtitle: "Workforce > Employee Directory, Roles & Workstations",
          keywords: "people employees team staff members directory workstations",
          path: "/people/employees",
          icon: Users,
          allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
        },
        {
          title: "Inactivity & Break Review",
          subtitle: "Time Tracking > Idle Review & Absence Notes",
          keywords: "inactivity idle breaks lunch absence notes",
          path: "/time/inactivity",
          icon: Coffee,
          allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
        },
        {
          title: "Detailed Reports & Exports",
          subtitle: "Reports > Daily Summaries & Excel Exports",
          keywords: "reports export excel csv analytics summaries",
          path: "/reports",
          icon: FileSpreadsheet,
          allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
        },
        {
          title: "Tracking Policies & Rules",
          subtitle: "Administration > Idle Thresholds & Telemetry Cadence",
          keywords: "settings policies tracking idle thresholds pause rules administration",
          path: "/admin/policies",
          icon: Sliders,
          allowedRoles: ["SUPER_ADMIN", "HR_ADMIN"],
        },
        {
          title: "Company Settings",
          subtitle: "Administration > Organization Profile & Configuration",
          keywords: "company settings admin organization configuration",
          path: "/admin/settings",
          icon: Settings,
          allowedRoles: ["SUPER_ADMIN", "HR_ADMIN"],
        },
      ];

      allPages
        .filter((page) => page.allowedRoles.includes(role))
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
      groups.push({
        category: "ACTIVITY",
        label: isEmployee ? "My Activity" : "Time & Activity",
        items: activityResults,
      });
    }
    if (deviceResults.length > 0) {
      groups.push({
        category: "DEVICES",
        label: isEmployee ? "Workstation" : "Workstations & Agent",
        items: deviceResults,
      });
    }
    if (peopleResults.length > 0) {
      groups.push({ category: "PEOPLE", label: "Team Members", items: peopleResults });
    }
    if (reportResults.length > 0) {
      groups.push({ category: "REPORTS", label: "Reports & Exports", items: reportResults });
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
