import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Activity,
  Clock,
  Calendar,
  Laptop,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Pause,
  Monitor,
  User,
  Terminal,
  Layers,
  LayoutGrid,
  AppWindow,
  X,
  ExternalLink,
  ArrowUpDown,
  FileText,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/authContext";
import {
  subscribeToActivityLogs,
  subscribeToTelemetryDevices,
  fetchCrmEmployees,
  formatSecondsToDuration,
  getTodayDateString,
  ActivityIntervalRecord,
  ConsolidatedIntervalRecord,
  consolidateActivityIntervals,
  parseTimeToDisplayWithSec,
  ClubbedAppRecord,
  aggregateClubbedApps,
  TelemetryDevice,
  CrmEmployeeSummary,
} from "../../lib/telemetryService";

export function ActivityTimelinePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email");
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Employee Selection & Filters
  const [selectedEmpEmail, setSelectedEmpEmail] = useState<string>(
    emailParam?.toLowerCase() || user?.email?.toLowerCase() || ""
  );

  // Sync if URL query param changes
  useEffect(() => {
    if (emailParam) {
      setSelectedEmpEmail(emailParam.toLowerCase());
    }
  }, [emailParam]);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [filterState, setFilterState] = useState<"all" | "active" | "idle" | "locked">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // View Mode: 'clubbed_apps' (app totals) vs 'consolidated' (clean sessions) vs 'raw' (individual 15s heartbeats)
  const [viewMode, setViewMode] = useState<"clubbed_apps" | "consolidated" | "raw">("clubbed_apps");

  // Sort Order: 'desc' (highest time / newest first) vs 'asc' (lowest time / chronological)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Detailed 15s Distribution Modal Popup
  const [selectedSessionModal, setSelectedSessionModal] = useState<ConsolidatedIntervalRecord | null>(null);

  // Detailed App Breakdown Modal Popup
  const [selectedAppModal, setSelectedAppModal] = useState<ClubbedAppRecord | null>(null);

  // Real-time Firestore state
  const [activityLogs, setActivityLogs] = useState<ActivityIntervalRecord[]>([]);
  const [devices, setDevices] = useState<TelemetryDevice[]>([]);
  const [crmStaff, setCrmStaff] = useState<CrmEmployeeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load CRM staff and devices
  useEffect(() => {
    fetchCrmEmployees().then((staff) => {
      setCrmStaff(staff);
    });

    const unsubDevices = subscribeToTelemetryDevices((devs) => {
      setDevices(devs);
    });

    return () => unsubDevices();
  }, []);

  // Unified, deduplicated employees from CRM + active devices
  const availableEmployees = useMemo(() => {
    const map = new Map<string, { email: string; name: string }>();
    crmStaff.forEach((s) => {
      const email = s.email?.trim().toLowerCase();
      if (email && !map.has(email)) {
        map.set(email, { email, name: s.name });
      }
    });
    devices.forEach((d) => {
      const email = d.employeeEmail?.trim().toLowerCase();
      if (email && !map.has(email)) {
        map.set(email, { email, name: d.employeeName || email.split("@")[0] });
      }
    });
    const list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    if (list.length === 0) {
      const defaultEmail = (user?.email || "ajay@gryphonacademy.co.in").toLowerCase();
      list.push({ email: defaultEmail, name: user?.name || "Ajay Pawar" });
    }
    return list;
  }, [crmStaff, devices, user]);

  // Ensure an employee is selected once availableEmployees load
  useEffect(() => {
    if (!selectedEmpEmail && availableEmployees.length > 0) {
      setSelectedEmpEmail(availableEmployees[0].email);
    }
  }, [availableEmployees, selectedEmpEmail]);

  // Subscribe to Activity Logs for selected employee & date
  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeToActivityLogs(
      {
        employeeId: selectedEmpEmail,
        date: selectedDate,
      },
      (logs) => {
        setActivityLogs(logs);
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, [selectedEmpEmail, selectedDate]);

  // Consolidate continuous 15s intervals of the same app and state
  const consolidatedLogs = useMemo(() => {
    return consolidateActivityIntervals(activityLogs);
  }, [activityLogs]);

  // Aggregate metrics from real intervals
  const totals = useMemo(() => {
    let activeSec = 0;
    let idleSec = 0;
    let lockedSec = 0;

    activityLogs.forEach((l) => {
      const isLock =
        (l.executable || "").toLowerCase().includes("lockapp") ||
        (l.executable || "").toLowerCase().includes("logonui") ||
        (l.windowTitle || "").toLowerCase().includes("lock screen");

      const state = isLock ? "locked" : (l.state || "").toLowerCase().trim();
      const sec = l.durationSeconds && l.durationSeconds > 0 ? l.durationSeconds : 15;
      if (state === "locked") lockedSec += sec;
      else if (state === "idle") idleSec += sec;
      else activeSec += sec;
    });

    const totalSec = activeSec + idleSec + lockedSec;
    const ratio = totalSec > 0 ? Math.round((activeSec / totalSec) * 100) : 100;

    return {
      total: formatSecondsToDuration(totalSec),
      active: formatSecondsToDuration(activeSec),
      idle: formatSecondsToDuration(idleSec),
      locked: formatSecondsToDuration(lockedSec),
      activeRatio: `${ratio}%`,
      rawTotalSec: totalSec,
    };
  }, [activityLogs]);

  // Matched device
  const currentDevice = devices.find(
    (d) => d.employeeEmail.toLowerCase() === selectedEmpEmail.toLowerCase()
  );

  // Filter and sort intervals for table display
  const displayIntervals = useMemo(() => {
    const sourceList = viewMode === "consolidated" ? consolidatedLogs : activityLogs;

    const filtered = sourceList.filter((interval) => {
      if (filterState !== "all" && interval.state !== filterState) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          interval.executable.toLowerCase().includes(q) ||
          interval.windowTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [viewMode, consolidatedLogs, activityLogs, filterState, searchQuery, sortOrder]);

  // Aggregate full-day time clubbed by Application
  const clubbedApps = useMemo(() => {
    return aggregateClubbedApps(activityLogs);
  }, [activityLogs]);

  // Filtered and sorted clubbed applications
  const displayClubbedApps = useMemo(() => {
    const filtered = clubbedApps.filter((app) => {
      if (filterState === "active" && app.activeSeconds === 0) return false;
      if (filterState === "idle" && app.idleSeconds === 0) return false;
      if (filterState === "locked" && app.lockedSeconds === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName =
          app.appName.toLowerCase().includes(q) ||
          app.executable.toLowerCase().includes(q);
        const matchesTitle = app.windowTitles.some((t) =>
          t.title.toLowerCase().includes(q)
        );
        return matchesName || matchesTitle;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortOrder === "desc") {
        return b.totalSeconds - a.totalSeconds; // most used first (e.g. 6 hrs -> 3 hrs -> 15m -> 15s)
      } else {
        return a.totalSeconds - b.totalSeconds;
      }
    });
  }, [clubbedApps, filterState, searchQuery, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Time Tracking & Activity Timeline"
        subtitle="Continuous 24-hour endpoint activity stream autonomously recorded by Windows desktop agent"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Time Tracking" },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Employee Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
              <User className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedEmpEmail}
                onChange={(e) => setSelectedEmpEmail(e.target.value)}
                className="bg-transparent font-medium text-gray-900 focus:outline-none cursor-pointer pr-2 max-w-[200px] truncate"
              >
                {availableEmployees.map((emp) => (
                  <option key={emp.email} value={emp.email}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Input */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-gray-800 focus:outline-none text-xs"
              />
            </div>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Total Workday Tracked</p>
          <p className="text-2xl font-bold text-gray-950 mt-1">{totals.total}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            {consolidatedLogs.length} consolidated focus sessions
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Active Computer Time</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totals.active}</p>
          <p className="text-[11px] text-text-muted mt-0.5">{totals.activeRatio} active presence</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Idle Inactivity</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{totals.idle}</p>
          <p className="text-[11px] text-text-muted mt-0.5">Periods &gt; 5m without input</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Session Locked / Break</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{totals.locked}</p>
          <p className="text-[11px] text-text-muted mt-0.5 truncate">
            {currentDevice?.hostname || "Endpoint Workstation"}
          </p>
        </div>
      </div>

      {/* 24-Hour Continuous Visualizer Strip */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-950 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>24-Hour Continuous Timeline Band</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Proportional focus blocks clubbed together • Click any block to view its 15s breakdown
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></span> Active Focus
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> Idle (&gt;5m)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span> Session Locked
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-gray-200"></span> Standby / Off
            </span>
          </div>
        </div>

        {/* Visual Bar Strip */}
        {consolidatedLogs.length === 0 ? (
          <div className="p-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
            <Monitor className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">
              No activity intervals recorded for this user on {selectedDate}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Launch the Windows desktop client to start continuous background recording
            </p>
          </div>
        ) : (
          <div className="w-full h-10 bg-gray-100 rounded-lg overflow-hidden flex items-stretch border border-gray-200 p-0.5 gap-0.5">
            {consolidatedLogs.map((int) => {
              const bgClass =
                int.state === "active"
                  ? "bg-indigo-600 hover:bg-indigo-500"
                  : int.state === "idle"
                  ? "bg-amber-400 hover:bg-amber-300"
                  : "bg-purple-500 hover:bg-purple-400";

              const pct = totals.rawTotalSec > 0
                ? Math.max(2, Math.round(((int.durationSeconds || 1) / totals.rawTotalSec) * 100))
                : 10;

              return (
                <div
                  key={int.id}
                  onClick={() => setSelectedSessionModal(int)}
                  style={{ width: `${pct}%` }}
                  className={cn(
                    "rounded-xs transition-all cursor-pointer relative group flex items-center justify-center select-none shadow-2xs hover:brightness-110",
                    bgClass
                  )}
                  title={`[${int.startDisplay} – ${int.endDisplay}] ${int.executable} (${int.durationDisplay} • ${int.tickCount} heartbeats)\nClick to inspect granular 15s distribution`}
                >
                  <span className="text-[9px] text-white font-medium truncate px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {int.executable}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Activity Intervals Table Card */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-950">Recorded Activity Intervals</h3>
              <Badge variant="outline" className="text-[11px] font-mono text-gray-600 bg-gray-50">
                {displayIntervals.length} {viewMode === "consolidated" ? "Sessions" : "Raw Ticks"}
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {viewMode === "consolidated"
                ? "Continuous 15-second heartbeats clubbed into uninterrupted focus sessions"
                : "Granular 15-second heartbeat telemetry from Windows agent"}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Segmented Switch: Clubbed Apps vs Clubbed Sessions vs Raw */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-medium border border-gray-200">
              <button
                onClick={() => setViewMode("clubbed_apps")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer",
                  viewMode === "clubbed_apps"
                    ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                )}
                title="Club total time by application (e.g. Antigravity 6 hrs, Brave 3 hrs, Teams 15m)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Clubbed Apps</span>
              </button>
              <button
                onClick={() => setViewMode("consolidated")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer",
                  viewMode === "consolidated"
                    ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                )}
                title="Club continuous intervals of the same app into clean sessions"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Clubbed Sessions</span>
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer",
                  viewMode === "raw"
                    ? "bg-white text-gray-950 shadow-2xs font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                )}
                title="View individual raw 15-second agent heartbeats"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Raw 15s Ticks</span>
              </button>
            </div>

            {/* Sort Order: Newest / Highest First vs Chronological */}
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
              title={
                viewMode === "clubbed_apps"
                  ? sortOrder === "desc"
                    ? "Showing most time spent first"
                    : "Showing least time spent first"
                  : sortOrder === "desc"
                  ? "Showing newest intervals first"
                  : "Showing chronological AM → PM"
              }
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
              <span>
                {viewMode === "clubbed_apps"
                  ? sortOrder === "desc"
                    ? "Most Time First"
                    : "Least Time First"
                  : sortOrder === "desc"
                  ? "Newest First"
                  : "AM → PM"}
              </span>
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search app or window..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs w-44 focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px] font-medium">
              <button
                onClick={() => setFilterState("all")}
                className={cn(
                  "px-2 py-0.5 rounded-md transition-colors cursor-pointer",
                  filterState === "all" ? "bg-white text-gray-950 shadow-2xs" : "text-gray-600"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilterState("active")}
                className={cn(
                  "px-2 py-0.5 rounded-md transition-colors cursor-pointer",
                  filterState === "active" ? "bg-white text-emerald-800 shadow-2xs" : "text-gray-600"
                )}
              >
                Active
              </button>
              <button
                onClick={() => setFilterState("idle")}
                className={cn(
                  "px-2 py-0.5 rounded-md transition-colors cursor-pointer",
                  filterState === "idle" ? "bg-white text-amber-800 shadow-2xs" : "text-gray-600"
                )}
              >
                Idle
              </button>
              <button
                onClick={() => setFilterState("locked")}
                className={cn(
                  "px-2 py-0.5 rounded-md transition-colors cursor-pointer",
                  filterState === "locked" ? "bg-white text-purple-800 shadow-2xs" : "text-gray-600"
                )}
              >
                Locked
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 text-text-muted font-medium">
                {viewMode === "clubbed_apps" ? (
                  <>
                    <th className="py-2.5 px-4">Application & Process</th>
                    <th className="py-2.5 px-4">Total Workday Time</th>
                    <th className="py-2.5 px-4">Active vs Inactive</th>
                    <th className="py-2.5 px-4">First & Last Used</th>
                    <th className="py-2.5 px-4">Top Window / Document</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-right">Details</th>
                  </>
                ) : (
                  <>
                    <th className="py-2.5 px-4">Time Window</th>
                    <th className="py-2.5 px-4">Duration</th>
                    {viewMode === "consolidated" && (
                      <th className="py-2.5 px-4">Continuous Heartbeats</th>
                    )}
                    <th className="py-2.5 px-4">State</th>
                    <th className="py-2.5 px-4">Executable / Binary</th>
                    <th className="py-2.5 px-4">Foreground Window Title</th>
                    <th className="py-2.5 px-4 text-right">Category</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {viewMode === "clubbed_apps" ? (
                displayClubbedApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      No matching application telemetry found.
                    </td>
                  </tr>
                ) : (
                  displayClubbedApps.map((app, idx) => {
                    const topTitle = app.windowTitles[0]?.title || "Focused Workspace";
                    const otherTitlesCount = app.windowTitles.length - 1;

                    return (
                      <tr
                        key={app.appKey || idx}
                        className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedAppModal(app)}
                      >
                        {/* Application & Process */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-bold text-xs shadow-2xs">
                              {app.appName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-950 text-xs truncate flex items-center gap-1.5">
                                <span>{app.appName}</span>
                                <span className="text-[10px] font-mono text-gray-500 font-normal px-1 py-0.2 bg-gray-100 rounded border border-gray-200">
                                  {app.executable}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <span>{app.sessionCount} focus session{app.sessionCount !== 1 ? "s" : ""}</span>
                                <span>•</span>
                                <span>{app.heartbeatCount} heartbeats (15s)</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Total Duration & Workday Share Bar */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 min-w-[130px]">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-extrabold text-sm text-gray-950">
                                {app.totalDisplay}
                              </span>
                              <span className="text-[11px] font-semibold text-indigo-600">
                                {app.percentageDisplay}
                              </span>
                            </div>
                            {/* Visual Progress Bar */}
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full transition-all"
                                style={{ width: `${Math.min(100, Math.max(3, app.percentage))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Active vs Idle Split */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active: {formatSecondsToDuration(app.activeSeconds)}
                            </span>
                            {app.idleSeconds > 0 && (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Idle: {formatSecondsToDuration(app.idleSeconds)}
                              </span>
                            )}
                            {app.lockedSeconds > 0 && (
                              <span className="inline-flex items-center gap-1 text-purple-700 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                Locked: {formatSecondsToDuration(app.lockedSeconds)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* First / Last Seen Span */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-gray-700">
                          <div className="flex items-center gap-1.5">
                            <span>{app.firstSeenDisplay}</span>
                            <span className="text-gray-400">→</span>
                            <span>{app.lastSeenDisplay}</span>
                          </div>
                        </td>

                        {/* Top Window / Tab */}
                        <td className="py-3 px-4 text-gray-700 max-w-[320px]">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-medium text-gray-800" title={topTitle}>
                              {topTitle}
                            </span>
                            {otherTitlesCount > 0 && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 font-medium border border-gray-200 shrink-0"
                                title={`${otherTitlesCount + 1} different windows/tabs used`}
                              >
                                +{otherTitlesCount} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                              app.category === "work"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {app.category}
                          </span>
                        </td>

                        {/* Details Action Button */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppModal(app);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-2xs transition-all cursor-pointer"
                          >
                            <span>Breakdown</span>
                            <span>↗</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : displayIntervals.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === "consolidated" ? 7 : 6} className="py-8 text-center text-text-muted">
                    No matching activity intervals found.
                  </td>
                </tr>
              ) : (
                displayIntervals.map((int) => {
                  const consInt = int as ConsolidatedIntervalRecord;
                  const isMultiTick = viewMode === "consolidated" && consInt.tickCount > 1;

                  return (
                    <tr
                      key={int.id}
                      className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        if (viewMode === "consolidated") {
                          setSelectedSessionModal(consInt);
                        }
                      }}
                    >
                      {/* Time Window */}
                      <td className="py-2.5 px-4 font-mono text-[11px] text-gray-900 font-semibold whitespace-nowrap">
                        {int.startDisplay === int.endDisplay
                          ? int.startDisplay
                          : `${int.startDisplay} – ${int.endDisplay}`}
                      </td>

                      {/* Duration */}
                      <td className="py-2.5 px-4 font-bold text-gray-950 whitespace-nowrap">
                        {int.durationDisplay}
                      </td>

                      {/* Continuous Heartbeats / Distribution Column */}
                      {viewMode === "consolidated" && (
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {isMultiTick ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSessionModal(consInt);
                              }}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 shadow-2xs transition-all cursor-pointer"
                              title="Click to view full 15-second heartbeat distribution"
                            >
                              <Layers className="w-3 h-3 text-indigo-500" />
                              <span>{consInt.tickCount} heartbeats</span>
                              <span className="text-[10px] text-indigo-600 underline font-bold ml-0.5">
                                Breakdown ↗
                              </span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-mono">
                              1 tick (15s)
                            </span>
                          )}
                        </td>
                      )}

                      {/* State */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {int.state === "active" && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        )}
                        {int.state === "idle" && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Idle
                          </span>
                        )}
                        {int.state === "locked" && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            Locked
                          </span>
                        )}
                      </td>

                      {/* Executable */}
                      <td className="py-2.5 px-4 font-mono text-gray-900 font-medium text-[11px] whitespace-nowrap">
                        {int.executable}
                      </td>

                      {/* Foreground Window Title */}
                      <td className="py-2.5 px-4 text-gray-700 max-w-[360px] truncate" title={int.windowTitle}>
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{int.windowTitle || "Focused Workspace"}</span>
                          {viewMode === "consolidated" && consInt.subTitles && consInt.subTitles.length > 1 && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 font-medium border border-gray-200 shrink-0"
                              title={`${consInt.subTitles.length} distinct documents/windows accessed`}
                            >
                              +{consInt.subTitles.length - 1} tabs
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                            int.category === "work"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {int.category}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DETAILED 15-SECOND DISTRIBUTION POPUP MODAL */}
      {selectedSessionModal && (
        <div
          className="fixed inset-0 z-50 bg-gray-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedSessionModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-start justify-between gap-4 bg-gray-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-gray-950">
                      {selectedSessionModal.executable}
                    </h2>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                        selectedSessionModal.category === "work"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-200 text-gray-700"
                      )}
                    >
                      {selectedSessionModal.category}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium",
                        selectedSessionModal.state === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedSessionModal.state === "idle"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-purple-100 text-purple-800"
                      )}
                    >
                      ● {selectedSessionModal.state.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {selectedSessionModal.state === "locked"
                      ? "Workstation locked break from "
                      : selectedSessionModal.state === "idle"
                      ? "Idle inactivity period from "
                      : "Continuous focus session from "}
                    <strong className="text-gray-900">{selectedSessionModal.startDisplay}</strong> to{" "}
                    <strong className="text-gray-900">{selectedSessionModal.endDisplay}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSessionModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-gray-100 bg-white">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70">
                <span className="text-[11px] font-medium text-text-muted">
                  {selectedSessionModal.state === "locked"
                    ? "Locked Break Duration"
                    : selectedSessionModal.state === "idle"
                    ? "Idle Inactivity Duration"
                    : "Total Focus Duration"}
                </span>
                <p
                  className={cn(
                    "text-lg font-bold mt-0.5",
                    selectedSessionModal.state === "locked"
                      ? "text-purple-600"
                      : selectedSessionModal.state === "idle"
                      ? "text-amber-600"
                      : "text-indigo-600"
                  )}
                >
                  {selectedSessionModal.durationDisplay}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70">
                <span className="text-[11px] font-medium text-text-muted">15s Heartbeats Merged</span>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {selectedSessionModal.tickCount} ticks
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70">
                <span className="text-[11px] font-medium text-text-muted">Time Window</span>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {selectedSessionModal.startDisplay} – {selectedSessionModal.endDisplay}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70">
                <span className="text-[11px] font-medium text-text-muted">Windows / Documents</span>
                <p className="text-lg font-bold text-emerald-600 mt-0.5">
                  {selectedSessionModal.subTitles.length} detected
                </p>
              </div>
            </div>

            {/* Unique Documents / Sub-titles */}
            {selectedSessionModal.subTitles && selectedSessionModal.subTitles.length > 0 && (
              <div className="px-5 py-3 border-b border-gray-100 bg-indigo-50/30">
                <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Window Titles Active During this Session ({selectedSessionModal.subTitles.length})</span>
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {selectedSessionModal.subTitles.map((title, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-white border border-gray-200 text-gray-800 font-medium truncate max-w-[320px] shadow-2xs"
                      title={title}
                    >
                      {title || "Focused Workspace"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Granular 15-Second Heartbeat Distribution Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span>Granular 15-Second Heartbeat Telemetry ({selectedSessionModal.rawIntervals.length} entries)</span>
                </h4>
                <span className="text-[11px] text-gray-400">
                  Cadence: 15 seconds • Windows Background Hook
                </span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-text-muted font-medium">
                      <th className="py-2 px-3 w-12 text-center">#</th>
                      <th className="py-2 px-3">Interval (Exact Time)</th>
                      <th className="py-2 px-3 w-20">Duration</th>
                      <th className="py-2 px-3">Foreground Window Title</th>
                      <th className="py-2 px-3 w-20 text-right">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedSessionModal.rawIntervals.map((tick, index) => {
                      const startWithSec = parseTimeToDisplayWithSec(tick.startTime);
                      const endWithSec = parseTimeToDisplayWithSec(tick.endTime);

                      return (
                        <tr key={tick.id || index} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-1.5 px-3 text-center font-mono text-[11px] text-gray-400">
                            {index + 1}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-[11px] text-gray-800 whitespace-nowrap">
                            {startWithSec} – {endWithSec}
                          </td>
                          <td className="py-1.5 px-3 font-semibold text-gray-900 whitespace-nowrap">
                            {tick.durationDisplay || "15s"}
                          </td>
                          <td className="py-1.5 px-3 text-gray-700 max-w-[320px] truncate" title={tick.windowTitle}>
                            {tick.windowTitle || "Focused Workspace"}
                          </td>
                          <td className="py-1.5 px-3 text-right whitespace-nowrap">
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                tick.state === "active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : tick.state === "idle"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-purple-50 text-purple-700"
                              )}
                            >
                              {tick.state}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-gray-200 bg-gray-50/80 flex items-center justify-between gap-3">
              <span className="text-[11px] text-text-muted hidden sm:inline">
                Zero clutter view: continuous 15s heartbeats are automatically clubbed for readability.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSessionModal(null)}
                className="ml-auto text-xs"
              >
                Close Breakdown
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED CLUBBED APPLICATION MODAL POPUP */}
      {selectedAppModal && (
        <div
          className="fixed inset-0 z-50 bg-gray-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedAppModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50/70 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-base shadow-2xs shrink-0">
                  {selectedAppModal.appName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-950">
                      {selectedAppModal.appName}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 font-medium">
                      {selectedAppModal.executable}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                        selectedAppModal.category === "work"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {selectedAppModal.category}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Cumulative application usage for {selectedDate} • {selectedEmpEmail}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppModal(null)}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-gray-50/40 border-b border-gray-200 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                  Total Time
                </span>
                <span className="text-base font-extrabold text-gray-950 mt-0.5 block">
                  {selectedAppModal.totalDisplay}
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 block">
                  {selectedAppModal.percentageDisplay} of workday
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                  Active Focus
                </span>
                <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">
                  {formatSecondsToDuration(selectedAppModal.activeSeconds)}
                </span>
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  Actively typing / focused
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                  Idle / Inactive
                </span>
                <span className="text-base font-extrabold text-amber-700 mt-0.5 block">
                  {formatSecondsToDuration(selectedAppModal.idleSeconds)}
                </span>
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  Inactive foreground
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                  Sessions & Ticks
                </span>
                <span className="text-base font-extrabold text-gray-950 mt-0.5 block">
                  {selectedAppModal.sessionCount} sessions
                </span>
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  {selectedAppModal.heartbeatCount} heartbeats (15s)
                </span>
              </div>
            </div>

            {/* Modal Body: Window Titles & Sessions */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Window Titles Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  <span>Files, Documents & Tabs Accessed ({selectedAppModal.windowTitles.length})</span>
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-text-muted font-medium">
                        <th className="py-2 px-3">Window Title / Document</th>
                        <th className="py-2 px-3 w-28">Duration</th>
                        <th className="py-2 px-3 w-28">% of App Time</th>
                        <th className="py-2 px-3 w-20 text-right">Heartbeats</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedAppModal.windowTitles.map((t, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-2 px-3 text-gray-800 font-medium max-w-[360px] truncate" title={t.title}>
                            {t.title}
                          </td>
                          <td className="py-2 px-3 font-bold text-gray-950 whitespace-nowrap">
                            {formatSecondsToDuration(t.seconds)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(4, t.percentage))}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-gray-600">
                                {t.percentage}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[11px] text-gray-500 whitespace-nowrap">
                            {t.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discrete Continuous Sessions */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span>Chronological Session Blocks ({selectedAppModal.sessions.length})</span>
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-text-muted font-medium">
                        <th className="py-2 px-3 w-32">Time Window</th>
                        <th className="py-2 px-3 w-24">Duration</th>
                        <th className="py-2 px-3">Active Document</th>
                        <th className="py-2 px-3 w-20 text-right">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedAppModal.sessions.map((sess, idx) => (
                        <tr key={sess.id || idx} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-1.5 px-3 font-mono text-[11px] text-gray-900 font-semibold whitespace-nowrap">
                            {sess.startDisplay === sess.endDisplay
                              ? sess.startDisplay
                              : `${sess.startDisplay} – ${sess.endDisplay}`}
                          </td>
                          <td className="py-1.5 px-3 font-bold text-gray-950 whitespace-nowrap">
                            {sess.durationDisplay}
                          </td>
                          <td className="py-1.5 px-3 text-gray-700 max-w-[320px] truncate" title={sess.windowTitle}>
                            {sess.windowTitle || "Focused Workspace"}
                          </td>
                          <td className="py-1.5 px-3 text-right whitespace-nowrap">
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                sess.state === "active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : sess.state === "idle"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-purple-50 text-purple-700"
                              )}
                            >
                              {sess.state}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-gray-200 bg-gray-50/80 flex items-center justify-between gap-3">
              <span className="text-[11px] text-text-muted hidden sm:inline">
                Clubbed App Summary: Aggregate duration across all intervals recorded by Windows desktop agent.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAppModal(null)}
                className="ml-auto text-xs"
              >
                Close Application Breakdown
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

