import React, { useState, useEffect, useMemo } from "react";
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
  TelemetryDevice,
  CrmEmployeeSummary,
} from "../../lib/telemetryService";

export function ActivityTimelinePage() {
  const { user } = useAuth();
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Employee Selection & Filters
  const [selectedEmpEmail, setSelectedEmpEmail] = useState<string>(
    user?.email?.toLowerCase() || ""
  );
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [filterState, setFilterState] = useState<"all" | "active" | "idle" | "locked">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Real-time Firestore state
  const [activityLogs, setActivityLogs] = useState<ActivityIntervalRecord[]>([]);
  const [devices, setDevices] = useState<TelemetryDevice[]>([]);
  const [crmStaff, setCrmStaff] = useState<CrmEmployeeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load CRM staff and devices
  useEffect(() => {
    fetchCrmEmployees().then((staff) => {
      setCrmStaff(staff);
      if (staff.length > 0 && !selectedEmpEmail) {
        setSelectedEmpEmail(staff[0].email.toLowerCase());
      }
    });

    const unsubDevices = subscribeToTelemetryDevices((devs) => {
      setDevices(devs);
      if (devs.length > 0 && !selectedEmpEmail) {
        setSelectedEmpEmail(devs[0].employeeEmail.toLowerCase());
      }
    });

    return () => unsubDevices();
  }, []);

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

  // Aggregate metrics from real intervals
  const totals = useMemo(() => {
    let activeSec = 0;
    let idleSec = 0;
    let lockedSec = 0;

    activityLogs.forEach((l) => {
      if (l.state === "active") activeSec += l.durationSeconds || 0;
      else if (l.state === "idle") idleSec += l.durationSeconds || 0;
      else if (l.state === "locked") lockedSec += l.durationSeconds || 0;
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

  // Filter intervals for table
  const filteredIntervals = useMemo(() => {
    return activityLogs.filter((interval) => {
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
  }, [activityLogs, filterState, searchQuery]);

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
                {crmStaff.length > 0 ? (
                  crmStaff.map((staff) => (
                    <option key={staff.email} value={staff.email.toLowerCase()}>
                      {staff.name} ({staff.email})
                    </option>
                  ))
                ) : devices.length > 0 ? (
                  devices.map((d) => (
                    <option key={d.id} value={d.employeeEmail.toLowerCase()}>
                      {d.employeeName} ({d.employeeEmail})
                    </option>
                  ))
                ) : (
                  <option value={user?.email || "ajay@gryphonacademy.co.in"}>
                    {user?.name || "Ajay Pawar"} ({user?.email || "ajay@gryphonacademy.co.in"})
                  </option>
                )}
              </select>
            </div>

            {/* Date Input */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs">
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
          <p className="text-[11px] text-emerald-600 mt-0.5">Continuous session</p>
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
          <p className="text-[11px] text-text-muted mt-0.5">
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
              Live intervals captured and synced by GA WORK-TIME desktop agent
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
        {activityLogs.length === 0 ? (
          <div className="p-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
            <Monitor className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">
              No activity intervals recorded for this user on {selectedDate}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Run <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">npm run agent</code> on your Windows workstation to begin recording
            </p>
          </div>
        ) : (
          <div className="w-full h-9 bg-gray-100 rounded-lg overflow-hidden flex items-stretch border border-gray-200 p-0.5 gap-0.5">
            {activityLogs.map((int) => {
              const bgClass =
                int.state === "active"
                  ? "bg-indigo-600 hover:bg-indigo-500"
                  : int.state === "idle"
                  ? "bg-amber-400 hover:bg-amber-300"
                  : "bg-purple-500 hover:bg-purple-400";

              const pct = totals.rawTotalSec > 0
                ? Math.max(3, Math.round(((int.durationSeconds || 1) / totals.rawTotalSec) * 100))
                : 10;

              return (
                <div
                  key={int.id}
                  style={{ width: `${pct}%` }}
                  className={cn(
                    "rounded-xs transition-all cursor-pointer relative group flex items-center justify-center",
                    bgClass
                  )}
                  title={`[${int.startDisplay || int.startTime} - ${int.endDisplay || int.endTime}] ${int.executable}: ${int.windowTitle} (${int.durationDisplay})`}
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

      {/* Granular Activity Intervals Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-950">Recorded Focus Intervals</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Consolidated micro-intervals with detected foreground window titles
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search app or window..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs w-44 focus:outline-none focus:bg-white"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px] font-medium">
              <button
                onClick={() => setFilterState("all")}
                className={cn(
                  "px-2 py-0.5 rounded-md transition-colors",
                  filterState === "all" ? "bg-white text-gray-950 shadow-2xs" : "text-gray-600"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilterState("active")}
                className={cn(
                  "px-2 py-0.5 rounded-md transition-colors",
                  filterState === "active" ? "bg-white text-emerald-800 shadow-2xs" : "text-gray-600"
                )}
              >
                Active
              </button>
              <button
                onClick={() => setFilterState("idle")}
                className={cn(
                  "px-2 py-0.5 rounded-md transition-colors",
                  filterState === "idle" ? "bg-white text-amber-800 shadow-2xs" : "text-gray-600"
                )}
              >
                Idle
              </button>
              <button
                onClick={() => setFilterState("locked")}
                className={cn(
                  "px-2 py-0.5 rounded-md transition-colors",
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
                <th className="py-2.5 px-4">Time Window</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">State</th>
                <th className="py-2.5 px-4">Executable / Binary</th>
                <th className="py-2.5 px-4">Foreground Window Title</th>
                <th className="py-2.5 px-4 text-right">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredIntervals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    No matching activity intervals found.
                  </td>
                </tr>
              ) : (
                filteredIntervals.map((int) => (
                  <tr key={int.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-gray-700 whitespace-nowrap">
                      {int.startDisplay || int.startTime.substring(11, 16)} -{" "}
                      {int.endDisplay || int.endTime.substring(11, 16)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                      {int.durationDisplay}
                    </td>
                    <td className="py-2.5 px-4">
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
                    <td className="py-2.5 px-4 font-mono text-gray-800 text-[11px]">
                      {int.executable}
                    </td>
                    <td className="py-2.5 px-4 text-gray-700 max-w-[320px] truncate" title={int.windowTitle}>
                      {int.windowTitle}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
                          int.category === "work"
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {int.category}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
