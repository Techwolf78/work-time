import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Laptop,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  Activity,
  UserCheck,
  Monitor,
  RotateCcw,
  SlidersHorizontal,
  AppWindow,
  Radio,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { useAuth } from "../../lib/authContext";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { cn } from "../../lib/utils";
import {
  fetchCrmEmployees,
  subscribeToTelemetryDevices,
  formatSecondsToDuration,
  CrmEmployeeSummary,
  TelemetryDevice,
} from "../../lib/telemetryService";

export function EmployeesPage() {
  const { employees, departments } = useHrms();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isManager = user?.role === "MANAGER";

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "IDLE" | "OFFLINE">("ALL");
  const [pairingFilter, setPairingFilter] = useState<"ALL" | "ENROLLED" | "AWAITING">("ALL");
  const [timeFilter, setTimeFilter] = useState<"ALL" | "HAS_TIME" | "ZERO_TIME">("ALL");
  const [selectedApp, setSelectedApp] = useState("ALL");
  const [sortBy, setSortBy] = useState<"ACTIVE_FIRST" | "TIME_DESC" | "NAME_ASC" | "DEPT_ASC">("ACTIVE_FIRST");

  // Real-time Firestore state
  const [crmStaff, setCrmStaff] = useState<CrmEmployeeSummary[]>([]);
  const [devices, setDevices] = useState<TelemetryDevice[]>([]);

  useEffect(() => {
    fetchCrmEmployees().then((staff) => {
      setCrmStaff(staff);
    });

    const unsub = subscribeToTelemetryDevices((devs) => {
      setDevices(devs);
    });

    return () => unsub();
  }, []);

  // Map real employees and cross-reference with enrolled workstation devices
  const employeesWithTelemetry = useMemo(() => {
    if (crmStaff.length > 0) {
      return crmStaff.map((staff) => {
        const emailLower = staff.email.toLowerCase();
        const matchedDev = devices.find(
          (d) => d.employeeEmail.toLowerCase() === emailLower || d.employeeId === staff.id
        );

        const nameParts = staff.name.trim().split(" ");
        const firstName = nameParts[0] || staff.name;
        const lastName = nameParts.slice(1).join(" ") || "";
        const rawSec = matchedDev?.todayTrackedSeconds || 0;

        return {
          id: staff.id,
          firstName,
          lastName,
          email: staff.email,
          avatar: "",
          departmentName: staff.department?.trim() || "General",
          workstation: matchedDev ? matchedDev.hostname : "Awaiting Agent",
          isEnrolled: Boolean(matchedDev),
          os: matchedDev ? matchedDev.os : "Windows 10/11",
          agentStatus: matchedDev
            ? matchedDev.online
              ? matchedDev.status === "active"
                ? ("ACTIVE" as const)
                : ("IDLE" as const)
              : ("OFFLINE" as const)
            : ("OFFLINE" as const),
          rawTrackedSeconds: rawSec,
          todayTracked: matchedDev ? formatSecondsToDuration(rawSec) : "0m",
          weekTotal: matchedDev ? formatSecondsToDuration(rawSec) : "0m",
          activeApp: matchedDev?.online && matchedDev?.currentApp ? matchedDev.currentApp : matchedDev ? "Standby" : "Not reporting",
          agentVersion: matchedDev ? matchedDev.agentVersion : "v1.2.0",
        };
      });
    }

    return devices.map((dev) => ({
      id: dev.deviceId || dev.id,
      firstName: dev.employeeName || dev.employeeEmail.split("@")[0],
      lastName: "",
      email: dev.employeeEmail,
      avatar: "",
      departmentName: dev.department?.trim() || "General",
      workstation: dev.hostname,
      isEnrolled: true,
      os: dev.os || "Windows 10/11",
      agentStatus: dev.online
        ? dev.status === "active"
          ? ("ACTIVE" as const)
          : ("IDLE" as const)
        : ("OFFLINE" as const),
      rawTrackedSeconds: dev.todayTrackedSeconds || 0,
      todayTracked: formatSecondsToDuration(dev.todayTrackedSeconds || 0),
      weekTotal: formatSecondsToDuration(dev.todayTrackedSeconds || 0),
      activeApp: dev.currentApp || "System",
      agentVersion: dev.agentVersion || "v1.2.0",
    }));
  }, [crmStaff, devices]);

  // Overall counts for filter badges and KPI cards
  const counts = useMemo(() => {
    let active = 0;
    let idle = 0;
    let offline = 0;
    let enrolled = 0;
    let awaiting = 0;

    employeesWithTelemetry.forEach((e) => {
      if (e.agentStatus === "ACTIVE") active++;
      else if (e.agentStatus === "IDLE") idle++;
      else offline++;

      if (e.isEnrolled) enrolled++;
      else awaiting++;
    });

    return {
      total: employeesWithTelemetry.length,
      active,
      idle,
      offline,
      enrolled,
      awaiting,
    };
  }, [employeesWithTelemetry]);

  // Department counts
  const departmentCounts = useMemo(() => {
    const map = new Map<string, number>();
    employeesWithTelemetry.forEach((emp) => {
      const dept = emp.departmentName?.trim() || "General";
      map.set(dept, (map.get(dept) || 0) + 1);
    });
    return map;
  }, [employeesWithTelemetry]);

  const availableDepartments = useMemo(() => {
    return Array.from(departmentCounts.keys()).sort((a, b) => a.localeCompare(b));
  }, [departmentCounts]);

  // Unique foreground apps currently in use
  const availableApps = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => {
      if (d.currentApp && d.currentApp !== "Standby" && d.currentApp !== "Not reporting") {
        set.add(d.currentApp);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [devices]);

  // Filtered & Sorted list
  const filteredList = useMemo(() => {
    const list = employeesWithTelemetry.filter((item) => {
      // Manager department restriction
      if (
        isManager &&
        user?.department &&
        item.departmentName.trim().toLowerCase() !== user.department.trim().toLowerCase()
      ) {
        return false;
      }

      // Department filter
      if (selectedDept !== "ALL" && item.departmentName.trim().toLowerCase() !== selectedDept.trim().toLowerCase()) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && item.agentStatus !== statusFilter) {
        return false;
      }

      // Workstation pairing filter
      if (pairingFilter === "ENROLLED" && !item.isEnrolled) return false;
      if (pairingFilter === "AWAITING" && item.isEnrolled) return false;

      // Tracked time filter
      if (timeFilter === "HAS_TIME" && item.rawTrackedSeconds <= 0) return false;
      if (timeFilter === "ZERO_TIME" && item.rawTrackedSeconds > 0) return false;

      // Active app filter
      if (selectedApp !== "ALL" && item.activeApp.toLowerCase() !== selectedApp.toLowerCase()) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
        return (
          fullName.includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.workstation.toLowerCase().includes(q) ||
          item.departmentName.toLowerCase().includes(q) ||
          item.activeApp.toLowerCase().includes(q)
        );
      }

      return true;
    });

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === "ACTIVE_FIRST") {
        const score = (status: string) => (status === "ACTIVE" ? 3 : status === "IDLE" ? 2 : 1);
        const diff = score(b.agentStatus) - score(a.agentStatus);
        if (diff !== 0) return diff;
        return (b.rawTrackedSeconds || 0) - (a.rawTrackedSeconds || 0);
      }
      if (sortBy === "TIME_DESC") {
        return (b.rawTrackedSeconds || 0) - (a.rawTrackedSeconds || 0);
      }
      if (sortBy === "NAME_ASC") {
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "DEPT_ASC") {
        return a.departmentName.localeCompare(b.departmentName);
      }
      return 0;
    });
  }, [
    employeesWithTelemetry,
    isManager,
    user?.department,
    selectedDept,
    statusFilter,
    pairingFilter,
    timeFilter,
    selectedApp,
    searchQuery,
    sortBy,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedDept !== "ALL" ||
    statusFilter !== "ALL" ||
    pairingFilter !== "ALL" ||
    timeFilter !== "ALL" ||
    selectedApp !== "ALL" ||
    sortBy !== "ACTIVE_FIRST";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDept("ALL");
    setStatusFilter("ALL");
    setPairingFilter("ALL");
    setTimeFilter("ALL");
    setSelectedApp("ALL");
    setSortBy("ACTIVE_FIRST");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title={isManager ? "My Team" : "People & Workstations"}
        subtitle={
          isManager
            ? "Authorized team members, workstation hardware, and automatically captured desktop activity"
            : "Platform-wide workforce directory, registered Windows endpoints, and live agent tracking status"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: isManager ? "My Team" : "People" },
        ]}
      />

      {/* Interactive Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={cn(
            "p-4 rounded-xl border transition-all cursor-pointer shadow-xs select-none",
            statusFilter === "ALL"
              ? "bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200"
              : "bg-white border-gray-200 hover:border-gray-300"
          )}
        >
          <p className="text-xs font-medium text-text-muted">
            {isManager ? "Team Members" : "Total Workforce"}
          </p>
          <p className="text-2xl font-bold text-gray-950 mt-1">{counts.total}</p>
          <p className="text-[11px] text-text-muted mt-0.5">Enrolled staff accounts</p>
        </div>

        <div
          onClick={() => setStatusFilter("ACTIVE")}
          className={cn(
            "p-4 rounded-xl border transition-all cursor-pointer shadow-xs select-none",
            statusFilter === "ACTIVE"
              ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200"
              : "bg-white border-gray-200 hover:border-emerald-200"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text-muted">Active Agents</p>
            {counts.active > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{counts.active}</p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5 font-medium">Physical input detected</p>
        </div>

        <div
          onClick={() => setStatusFilter("IDLE")}
          className={cn(
            "p-4 rounded-xl border transition-all cursor-pointer shadow-xs select-none",
            statusFilter === "IDLE"
              ? "bg-amber-50 border-amber-300 ring-1 ring-amber-200"
              : "bg-white border-gray-200 hover:border-amber-200"
          )}
        >
          <p className="text-xs font-medium text-text-muted">Idle Workstations</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{counts.idle}</p>
          <p className="text-[11px] text-text-muted mt-0.5">&gt;5m inactivity threshold</p>
        </div>

        <div
          onClick={() => setStatusFilter("OFFLINE")}
          className={cn(
            "p-4 rounded-xl border transition-all cursor-pointer shadow-xs select-none",
            statusFilter === "OFFLINE"
              ? "bg-gray-100 border-gray-300 ring-1 ring-gray-200"
              : "bg-white border-gray-200 hover:border-gray-300"
          )}
        >
          <p className="text-xs font-medium text-text-muted">Offline / Disconnected</p>
          <p className="text-2xl font-bold text-gray-500 mt-1">{counts.offline}</p>
          <p className="text-[11px] text-text-muted mt-0.5">Agent closed or PC off</p>
        </div>
      </div>

      {/* Main Table & Filters Card */}
      <Card className="overflow-hidden">
        {/* Top Filters Toolbar */}
        <div className="p-4 border-b border-gray-200 space-y-3 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, email, department, endpoint, or active app..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Primary Status Filter Segmented Control with Live Badges */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs font-medium flex-wrap">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "ALL"
                    ? "bg-white text-gray-950 shadow-2xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <span>All</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200/80 text-gray-700">
                  {counts.total}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "ACTIVE"
                    ? "bg-white text-emerald-800 shadow-2xs font-bold"
                    : "text-gray-600 hover:text-emerald-700"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                  {counts.active}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter("IDLE")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "IDLE"
                    ? "bg-white text-amber-800 shadow-2xs font-bold"
                    : "text-gray-600 hover:text-amber-700"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Idle</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-semibold">
                  {counts.idle}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter("OFFLINE")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "OFFLINE"
                    ? "bg-white text-gray-900 shadow-2xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <span>Offline</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200/80 text-gray-700">
                  {counts.offline}
                </span>
              </button>
            </div>
          </div>

          {/* Secondary Filter Controls Bar */}
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
            {/* Department Filter */}
            {!isManager && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[11px] text-text-muted font-medium">Dept:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-lg px-2.5 py-1 text-gray-800 focus:outline-none shadow-2xs font-medium cursor-pointer"
                >
                  <option value="ALL">All Departments ({counts.total})</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} ({departmentCounts.get(dept) || 0})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Workstation Pairing Status */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] text-text-muted font-medium">PC Pairing:</span>
              <select
                value={pairingFilter}
                onChange={(e) => setPairingFilter(e.target.value as any)}
                className="bg-white border border-gray-200 text-xs rounded-lg px-2.5 py-1 text-gray-800 focus:outline-none shadow-2xs font-medium cursor-pointer"
              >
                <option value="ALL">All Endpoints</option>
                <option value="ENROLLED">Enrolled PC ({counts.enrolled})</option>
                <option value="AWAITING">Awaiting Agent ({counts.awaiting})</option>
              </select>
            </div>

            {/* Time Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] text-text-muted font-medium">Activity:</span>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="bg-white border border-gray-200 text-xs rounded-lg px-2.5 py-1 text-gray-800 focus:outline-none shadow-2xs font-medium cursor-pointer"
              >
                <option value="ALL">All Activity</option>
                <option value="HAS_TIME">Logged Time Today (&gt; 0m)</option>
                <option value="ZERO_TIME">Zero Time Today (0m)</option>
              </select>
            </div>

            {/* Foreground App Filter */}
            {availableApps.length > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[11px] text-text-muted font-medium">Tool:</span>
                <select
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-lg px-2.5 py-1 text-gray-800 focus:outline-none shadow-2xs font-medium cursor-pointer"
                >
                  <option value="ALL">All Active Tools</option>
                  {availableApps.map((app) => (
                    <option key={app} value={app}>
                      {app}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sorting Options */}
            <div className="flex items-center gap-1 text-xs ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-gray-200 text-xs rounded-lg px-2.5 py-1 text-gray-800 focus:outline-none shadow-2xs font-medium cursor-pointer"
              >
                <option value="ACTIVE_FIRST">Active Presence First</option>
                <option value="TIME_DESC">Most Tracked Time</option>
                <option value="NAME_ASC">Name (A → Z)</option>
                <option value="DEPT_ASC">Department</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer font-medium"
                title="Reset all filters to default"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-text-muted font-medium">
                <th className="py-2.5 px-4">Member</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Workstation Endpoint</th>
                <th className="py-2.5 px-4">Live Tracking Status</th>
                <th className="py-2.5 px-4">Today's Tracked Time</th>
                <th className="py-2.5 px-4">Weekly Total</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted">
                    <p className="font-semibold text-gray-700">No matching employees found</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Try adjusting your search terms or clearing some filters.
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-3 text-xs"
                      >
                        Reset All Filters
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredList.map((emp) => (
                  <tr
                    key={emp.id}
                    className={cn(
                      "transition-colors hover:bg-gray-50/80",
                      emp.agentStatus === "ACTIVE" ? "bg-emerald-50/15" : ""
                    )}
                  >
                    {/* Member */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.firstName}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border",
                              emp.agentStatus === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200"
                            )}
                          >
                            {emp.firstName?.[0] || "U"}
                            {emp.lastName?.[0] || ""}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-950 flex items-center gap-1.5">
                            <span>
                              {emp.firstName} {emp.lastName}
                            </span>
                            {emp.agentStatus === "ACTIVE" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            )}
                          </p>
                          <p className="text-[11px] text-text-muted font-mono">{emp.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 font-medium text-gray-700">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px]">
                        {emp.departmentName}
                      </span>
                    </td>

                    {/* Workstation Endpoint */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-gray-900 font-semibold flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-gray-400" />
                        <span>{emp.workstation}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {emp.os} • {emp.agentVersion}
                      </div>
                    </td>

                    {/* Live Tracking Status */}
                    <td className="py-3 px-4">
                      {emp.agentStatus === "ACTIVE" && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          <span>Active • {emp.activeApp}</span>
                        </div>
                      )}
                      {emp.agentStatus === "IDLE" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>Idle (&gt;5m)</span>
                        </span>
                      )}
                      {emp.agentStatus === "OFFLINE" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          <span>{emp.isEnrolled ? "Offline" : "Awaiting Setup"}</span>
                        </span>
                      )}
                    </td>

                    {/* Today's Tracked Time */}
                    <td className="py-3 px-4 font-bold text-gray-900 text-xs">
                      {emp.todayTracked}
                    </td>

                    {/* Weekly Total */}
                    <td className="py-3 px-4 font-mono text-text-muted text-[11px]">
                      {emp.weekTotal}
                    </td>

                    {/* Actions: Direct link to user's timeline */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/time/timeline?email=${encodeURIComponent(emp.email)}`)
                        }
                        className="text-xs gap-1.5 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 shadow-2xs"
                        title={`View ${emp.firstName}'s continuous activity timeline`}
                      >
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span>Timeline</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between text-xs text-text-muted">
          <span>
            Showing <strong className="text-gray-900">{filteredList.length}</strong> of{" "}
            <strong className="text-gray-900">{counts.total}</strong> enrolled members
          </span>
          <span className="font-mono text-[11px]">
            Live Agent Sync • Cadence: 15 seconds
          </span>
        </div>
      </Card>
    </div>
  );
}

