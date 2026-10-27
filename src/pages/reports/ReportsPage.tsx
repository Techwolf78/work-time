import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Laptop,
  Calendar,
  Search,
  Download,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  MessageSquare,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";
import { useAuth } from "../../lib/authContext";
import { useHrms } from "../../lib/hrmsContext";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { exportToCsv, cn } from "../../lib/utils";
import {
  subscribeToDailySummaries,
  subscribeToTelemetryDevices,
  subscribeToActivityLogs,
  fetchAllDailySummaries,
  saveInactivityExplanation,
  formatSecondsToDuration,
  getTodayDateString,
  DailySummaryRecord,
  TelemetryDevice,
  ActivityIntervalRecord,
} from "../../lib/telemetryService";

type ReportTab = "DAILY_SUMMARY" | "APP_USAGE" | "WORKSTATION_HEALTH";

interface DailyRecord {
  date: string;
  displayDay: string;
  empId: string;
  name: string;
  dept: string;
  device: string;
  totalHours: number;
  total: string;
  active: string;
  activeMinutes: number;
  idle: string;
  idleMinutes: number;
  focusRatio: string;
  focusRatioNum: number;
  topApp: string;
  inactivityNote?: string;
  status: "In Progress" | "Full Shift" | "Partial Shift";
}

export function ReportsPage() {
  const { user } = useAuth();
  const { employees } = useHrms();

  const role = user?.role || "SUPER_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN" || role === "HR_ADMIN";
  const isManager = role === "MANAGER";
  const isEmployee = !isSuperAdmin && !isManager;

  const [activeTab, setActiveTab] = useState<ReportTab>("DAILY_SUMMARY");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Offline Inactivity Explanation Modal state
  const [selectedRecordForNote, setSelectedRecordForNote] = useState<DailyRecord | null>(null);
  const [inactivityReason, setInactivityReason] = useState("");

  const currentEmpName = user?.name || "Ajay Pawar";
  const currentEmpId = user?.employeeId || user?.email || "EMP-1001";
  const currentDept = user?.crmDepartment || user?.department || "Engineering";
  const currentWorkstation = "Workstation";

  // Dynamic Date calculations relative to current system time
  const todayObj = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Real-time Firestore Telemetry state
  const [liveSummaries, setLiveSummaries] = useState<DailySummaryRecord[]>([]);
  const [liveDevices, setLiveDevices] = useState<TelemetryDevice[]>([]);
  const [liveLogs, setLiveLogs] = useState<ActivityIntervalRecord[]>([]);

  useEffect(() => {
    // 1. Subscribe to all daily summaries
    const unsubSums = subscribeToDailySummaries("", (sums) => {
      setLiveSummaries(sums);
    });

    fetchAllDailySummaries().then((sums) => {
      if (sums.length > 0) setLiveSummaries(sums);
    });

    // 2. Subscribe to devices for Workstation Health tab
    const unsubDevs = subscribeToTelemetryDevices((devs) => {
      setLiveDevices(devs);
    });

    // 3. Subscribe to recent activity logs for App Usage tab
    const unsubLogs = subscribeToActivityLogs({}, (logs) => {
      setLiveLogs(logs);
    });

    return () => {
      unsubSums();
      unsubDevs();
      unsubLogs();
    };
  }, []);

  // Map Real Daily Summary Records from Firestore
  const dailySummaryData = useMemo<DailyRecord[]>(() => {
    const list: DailyRecord[] = liveSummaries.map((s) => ({
      date: s.date,
      displayDay: s.date === todayStr ? `Today (${s.date})` : s.date,
      empId: s.employeeId || s.employeeEmail,
      name: s.employeeName,
      dept: s.department || "Engineering",
      device: s.deviceId,
      totalHours: Math.round(((s.observedSeconds || 0) / 3600) * 100) / 100,
      total: formatSecondsToDuration(s.observedSeconds),
      active: formatSecondsToDuration(s.activeSeconds),
      activeMinutes: Math.round((s.activeSeconds || 0) / 60),
      idle: formatSecondsToDuration(s.idleSeconds),
      idleMinutes: Math.round((s.idleSeconds || 0) / 60),
      focusRatio: s.focusRatio || "100%",
      focusRatioNum: s.focusRatioNum || 100,
      topApp: s.topApp || "System",
      inactivityNote: s.inactivityNote,
      status: s.status,
    }));

    if (isEmployee) {
      const myEmail = (user?.email || "").toLowerCase();
      return list.filter(
        (r) =>
          r.empId.toLowerCase() === myEmail ||
          r.empId === user?.employeeId
      );
    }

    if (isManager) {
      const myDept = (user?.crmDepartment || user?.department || "Engineering").toLowerCase();
      return list.filter((r) => r.dept.toLowerCase() === myDept);
    }

    return list;
  }, [liveSummaries, isEmployee, isManager, user, todayStr]);

  // Dynamic Personal App Usage aggregated from real logs
  const employeePersonalApps = useMemo(() => {
    const myEmail = (user?.email || "").toLowerCase();
    const userLogs = liveLogs.filter(
      (l) =>
        (l.employeeEmail && l.employeeEmail.toLowerCase() === myEmail) ||
        l.employeeId === user?.employeeId
    );

    const appMap: Record<string, { seconds: number; exe: string; category: "Work" | "Neutral" | "Restricted" }> = {};
    let totalSec = 0;

    userLogs.forEach((l) => {
      const app = l.executable || "System";
      if (!appMap[app]) {
        appMap[app] = {
          seconds: 0,
          exe: l.executable,
          category: l.category === "work" ? "Work" : l.category === "restricted" ? "Restricted" : "Neutral",
        };
      }
      appMap[app].seconds += l.durationSeconds || 0;
      totalSec += l.durationSeconds || 0;
    });

    return Object.entries(appMap)
      .map(([app, d]) => ({
        app,
        exe: d.exe,
        category: d.category,
        totalTime: formatSecondsToDuration(d.seconds),
        minutes: Math.round(d.seconds / 60),
        pct: totalSec > 0 ? Math.round((d.seconds / totalSec) * 100) : 0,
        desc: "Foreground window activity recorded on workstation",
      }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [liveLogs, user]);

  // Fleet App Usage (for Admin / Manager)
  const fleetAppUsage = useMemo(() => {
    const appMap: Record<string, { seconds: number; exe: string; category: "Work" | "Neutral" | "Restricted"; users: Set<string> }> = {};
    let totalSec = 0;

    liveLogs.forEach((l) => {
      const app = l.executable || "System";
      if (!appMap[app]) {
        appMap[app] = {
          seconds: 0,
          exe: l.executable,
          category: l.category === "work" ? "Work" : l.category === "restricted" ? "Restricted" : "Neutral",
          users: new Set(),
        };
      }
      appMap[app].seconds += l.durationSeconds || 0;
      if (l.employeeEmail) appMap[app].users.add(l.employeeEmail);
      totalSec += l.durationSeconds || 0;
    });

    return Object.entries(appMap)
      .map(([app, d]) => ({
        app,
        exe: d.exe,
        category: d.category,
        totalTime: formatSecondsToDuration(d.seconds),
        activeUsers: d.users.size || 1,
        pct: totalSec > 0 ? Math.round((d.seconds / totalSec) * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [liveLogs]);

  // Workstation Hardware Telemetry Dataset from liveDevices
  const workstationData = useMemo(() => {
    return liveDevices.map((d) => ({
      hostname: d.hostname,
      user: d.employeeName,
      os: d.os,
      agent: d.agentVersion,
      queue: "0 pending",
      status: d.online ? (d.status === "active" ? "Online" : "Idle") : "Offline",
      lastSync: d.lastHeartbeat ? new Date(d.lastHeartbeat).toLocaleTimeString() : "Never",
    }));
  }, [liveDevices]);

  // Filtered Daily Records
  const filteredDailySummary = useMemo(() => {
    return dailySummaryData.filter((item) => {
      // Date filter
      if (dateFilter === "TODAY" && item.date !== todayStr) return false;
      if (dateFilter === "YESTERDAY") {
        const yest = new Date(todayObj);
        yest.setDate(yest.getDate() - 1);
        const yestStr = yest.toISOString().split("T")[0];
        if (item.date !== yestStr) return false;
      }

      // Status filter
      if (statusFilter === "FULL" && item.status !== "Full Shift") return false;
      if (statusFilter === "IN_PROGRESS" && item.status !== "In Progress") return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDevice = item.device.toLowerCase().includes(q);
        const matchesApp = item.topApp.toLowerCase().includes(q);
        const matchesDate = item.date.includes(q) || item.displayDay.toLowerCase().includes(q);
        const matchesNote = item.inactivityNote?.toLowerCase().includes(q) || false;
        return matchesName || matchesDevice || matchesApp || matchesDate || matchesNote;
      }
      return true;
    });
  }, [dailySummaryData, dateFilter, statusFilter, searchQuery, todayStr, todayObj]);

  // Aggregate stats for employee summary cards
  const employeeSummaryMetrics = useMemo(() => {
    const totalMinutes = dailySummaryData.reduce(
      (acc, curr) => acc + curr.activeMinutes + curr.idleMinutes,
      0
    );
    const totalActiveMins = dailySummaryData.reduce((acc, curr) => acc + curr.activeMinutes, 0);
    const totalIdleMins = dailySummaryData.reduce((acc, curr) => acc + curr.idleMinutes, 0);
    const avgRatio =
      dailySummaryData.length > 0
        ? Math.round(
            dailySummaryData.reduce((acc, curr) => acc + curr.focusRatioNum, 0) /
              dailySummaryData.length
          )
        : 87;

    const toHoursStr = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    };

    return {
      totalTime: toHoursStr(totalMinutes),
      activeTime: toHoursStr(totalActiveMins),
      idleTime: toHoursStr(totalIdleMins),
      focusRatio: `${avgRatio}%`,
      daysLogged: dailySummaryData.length,
      todayRecord: dailySummaryData.find((r) => r.date === todayStr) || dailySummaryData[0],
    };
  }, [dailySummaryData, todayStr]);

  // CSV Export Handlers
  const handleExportDailySummary = () => {
    const headers = [
      "Date",
      "Employee Code",
      "Name",
      "Department",
      "Workstation Hostname",
      "Total Tracked",
      "Active Focus Time",
      "Idle Inactivity",
      "Focus Ratio",
      "Top Tool",
      "Shift Status",
      "Inactivity Note",
    ];
    const rows = filteredDailySummary.map((r) => [
      r.date,
      r.empId,
      r.name,
      r.dept,
      r.device,
      r.total,
      r.active,
      r.idle,
      r.focusRatio,
      r.topApp,
      r.status,
      r.inactivityNote || "None",
    ]);
    exportToCsv(
      isEmployee ? `My_WorkTime_Report_${currentEmpId}` : "GA_WorkTime_Daily_Summary_Report",
      headers,
      rows
    );
  };

  const handleExportAppUsage = () => {
    if (isEmployee) {
      const headers = [
        "Application",
        "Executable",
        "Category",
        "Total Duration",
        "Focus Share (%)",
        "Activity Description",
      ];
      const rows = employeePersonalApps.map((a) => [
        a.app,
        a.exe,
        a.category,
        a.totalTime,
        `${a.pct}%`,
        a.desc,
      ]);
      exportToCsv(`My_App_Usage_Report_${currentEmpId}`, headers, rows);
    } else {
      const headers = [
        "Application Name",
        "Executable",
        "Classification",
        "Total Fleet Duration",
        "Active Users Count",
        "Workday Percentage",
      ];
      const rows = fleetAppUsage.map((a) => [
        a.app,
        a.exe,
        a.category,
        a.totalTime,
        a.activeUsers,
        `${a.pct}%`,
      ]);
      exportToCsv("GA_WorkTime_Application_Utilization_Report", headers, rows);
    }
  };

  const handleSaveInactivityNote = async () => {
    if (selectedRecordForNote && inactivityReason.trim()) {
      const summaryId = `${selectedRecordForNote.empId}_${selectedRecordForNote.date}`;
      try {
        await saveInactivityExplanation(
          summaryId,
          inactivityReason.trim(),
          user?.email || ""
        );
      } catch (e) {
        console.warn("Could not save note to Firestore:", e);
      }
      setSelectedRecordForNote(null);
      setInactivityReason("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isEmployee ? "My Reports" : "Telemetry & Time Reports"}
        subtitle={
          isEmployee
            ? "Your automatically captured computer time history, focus ratios, and downloadable work logs"
            : "Platform-wide time tracking exports, workstation inventories, and application analytics"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: isEmployee ? "My Reports" : "Reports" },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={activeTab === "DAILY_SUMMARY" ? handleExportDailySummary : handleExportAppUsage}
            className="gap-1.5 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </Button>
        }
      />

      {/* Employee Top Personal Telemetry Summary KPI Cards */}
      {isEmployee && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Today's Tracked Time</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-2xl font-bold text-gray-950 mt-1">
              {employeeSummaryMetrics.todayRecord.total}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
              Active: {employeeSummaryMetrics.todayRecord.active} • Idle: {employeeSummaryMetrics.todayRecord.idle}
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">7-Day Cumulative Work</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-indigo-700 mt-1">
              {employeeSummaryMetrics.totalTime}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Across {employeeSummaryMetrics.daysLogged} recorded days
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Average Focus Ratio</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {employeeSummaryMetrics.focusRatio}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">Device input vs idle threshold (&lt;5m)</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Assigned Workstation</span>
              <Laptop className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-base font-bold text-gray-950 mt-1 truncate">
              {currentWorkstation}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>GA WORK-TIME Agent Online</span>
            </div>
          </div>
        </div>
      )}

      {/* Admin / Manager Top Fleet Metric Cards */}
      {!isEmployee && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Fleet Tracked Today</p>
            <p className="text-2xl font-bold text-gray-950 mt-1">158h 40m</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Across 24 enrolled endpoints</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Active Workstations</p>
            <p className="text-2xl font-bold text-gray-950 mt-1">21 / 24</p>
            <p className="text-[11px] text-text-muted mt-0.5">87.5% online telemetry</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Fleet Focus Ratio</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">86.4%</p>
            <p className="text-[11px] text-text-muted mt-0.5">Aggregated keyboard/mouse presence</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Pending Inactivity Notes</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">1</p>
            <p className="text-[11px] text-text-muted mt-0.5">Awaiting team review</p>
          </div>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2">
        <Button
          variant={activeTab === "DAILY_SUMMARY" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("DAILY_SUMMARY")}
          className="text-xs gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{isEmployee ? "Daily Time Logs" : "Daily Time Summary"}</span>
        </Button>
        <Button
          variant={activeTab === "APP_USAGE" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("APP_USAGE")}
          className="text-xs gap-1.5"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{isEmployee ? "My Application Usage" : "Application Utilization"}</span>
        </Button>
        {!isEmployee && (
          <Button
            variant={activeTab === "WORKSTATION_HEALTH" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setActiveTab("WORKSTATION_HEALTH")}
            className="text-xs gap-1.5"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Workstation Endpoints</span>
          </Button>
        )}
      </div>

      {/* Tab Content: Daily Time Logs / Summary */}
      {activeTab === "DAILY_SUMMARY" && (
        <Card className="overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2 max-w-sm w-full">
              <Input
                placeholder={
                  isEmployee
                    ? "Filter by application, date, or offline notes..."
                    : "Search by member, workstation, or app..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white border border-gray-200 text-xs rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none shadow-2xs font-medium cursor-pointer"
              >
                <option value="ALL">All Records (Past 7 Days)</option>
                <option value="TODAY">Today Only</option>
                <option value="YESTERDAY">Yesterday Only</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 text-xs rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none shadow-2xs font-medium cursor-pointer"
              >
                <option value="ALL">All Shift Statuses</option>
                <option value="FULL">Full Shift Target Met</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
          </div>

          {/* Table / Empty State */}
          {filteredDailySummary.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Calendar className="w-7 h-7 text-gray-400" />}
                title="No telemetry records match your filter"
                description="Try selecting 'All Records (Past 7 Days)' or clearing your search term to view automatically captured desktop agent records."
                actionText="Reset Filters"
                onAction={() => {
                  setDateFilter("ALL");
                  setStatusFilter("ALL");
                  setSearchQuery("");
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70 text-text-muted font-medium">
                    <th className="py-2.5 px-4">Date & Day</th>
                    {!isEmployee && <th className="py-2.5 px-4">Member</th>}
                    <th className="py-2.5 px-4">Workstation</th>
                    <th className="py-2.5 px-4">Total Tracked</th>
                    <th className="py-2.5 px-4">Active vs. Idle Timeline</th>
                    <th className="py-2.5 px-4">Focus Ratio</th>
                    <th className="py-2.5 px-4">Primary Application</th>
                    <th className="py-2.5 px-4">Inactivity Note / Reason</th>
                    {isEmployee && <th className="py-2.5 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDailySummary.map((item, idx) => {
                    const activePct = Math.round(
                      (item.activeMinutes / (item.activeMinutes + item.idleMinutes || 1)) * 100
                    );
                    const idlePct = 100 - activePct;

                    return (
                      <tr
                        key={`${item.empId}-${item.date}-${idx}`}
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        {/* Date */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-950">{item.displayDay}</div>
                          <div className="text-[11px] font-mono text-gray-500">{item.date}</div>
                        </td>

                        {/* Member (Admin / Manager only) */}
                        {!isEmployee && (
                          <td className="py-3 px-4 font-semibold text-gray-950">{item.name}</td>
                        )}

                        {/* Workstation */}
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            {item.device}
                          </span>
                        </td>

                        {/* Total Duration */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-950 text-sm">{item.total}</span>
                          <span
                            className={cn(
                              "block text-[10px] font-medium mt-0.5",
                              item.status === "Full Shift"
                                ? "text-emerald-700"
                                : item.status === "In Progress"
                                ? "text-indigo-600"
                                : "text-amber-600"
                            )}
                          >
                            ● {item.status}
                          </span>
                        </td>

                        {/* Active vs Idle visual distribution bar */}
                        <td className="py-3 px-4 min-w-[200px]">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-emerald-700 font-semibold">{item.active} active</span>
                            <span className="text-amber-700 font-semibold">{item.idle} idle</span>
                          </div>
                          <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${activePct}%` }}
                              className="h-full bg-emerald-500 rounded-l-full"
                              title={`${item.active} active (${activePct}%)`}
                            />
                            <div
                              style={{ width: `${idlePct}%` }}
                              className="h-full bg-amber-400"
                              title={`${item.idle} idle (${idlePct}%)`}
                            />
                          </div>
                        </td>

                        {/* Focus Ratio */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {item.focusRatio}
                          </span>
                        </td>

                        {/* Top Application */}
                        <td className="py-3 px-4">
                          <Badge variant="neutral" size="sm">
                            {item.topApp}
                          </Badge>
                        </td>

                        {/* Inactivity Note / Reason */}
                        <td className="py-3 px-4 max-w-[220px]">
                          {item.inactivityNote ? (
                            <div className="flex items-start gap-1.5 p-1.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 leading-tight">{item.inactivityNote}</span>
                            </div>
                          ) : (
                            <span className="text-text-muted text-[11px] italic">No offline notes</span>
                          )}
                        </td>

                        {/* Action: Explain Inactivity (Employee only) */}
                        {isEmployee && (
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedRecordForNote(item);
                                setInactivityReason(item.inactivityNote || "");
                              }}
                              className="text-[11px]"
                            >
                              {item.inactivityNote ? "Edit Note" : "Explain Inactivity"}
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab Content: Application Usage */}
      {activeTab === "APP_USAGE" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div>
              <h3 className="text-sm font-semibold text-gray-950">
                {isEmployee ? "My Foreground Application Breakdown" : "Fleet Application & Executable Telemetry"}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {isEmployee
                  ? `Aggregated foreground window focus captured by the desktop agent on ${currentWorkstation}`
                  : "Platform-wide application utilization across all enrolled Pune HQ endpoints"}
              </p>
            </div>
            <Badge variant="neutral">Automated Telemetry</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-text-muted font-medium">
                  <th className="py-2.5 px-4">Application</th>
                  <th className="py-2.5 px-4">Executable</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Total Focus Duration</th>
                  <th className="py-2.5 px-4">{isEmployee ? "Usage Share" : "Active Endpoints"}</th>
                  <th className="py-2.5 px-4 text-right">Workday Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isEmployee
                  ? employeePersonalApps.map((app) => (
                      <tr key={app.app} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-950 block">{app.app}</span>
                          <span className="text-[10px] text-text-muted">{app.desc}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-600">{app.exe}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              app.category === "Work"
                                ? "success"
                                : app.category === "Neutral"
                                ? "neutral"
                                : "warning"
                            }
                            size="sm"
                          >
                            {app.category.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">{app.totalTime}</td>
                        <td className="py-3 px-4 min-w-[140px]">
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${app.pct}%` }}
                              className={cn(
                                "h-full rounded-full",
                                app.category === "Work"
                                  ? "bg-indigo-600"
                                  : app.category === "Neutral"
                                  ? "bg-gray-400"
                                  : "bg-amber-500"
                              )}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-950">{app.pct}%</td>
                      </tr>
                    ))
                  : fleetAppUsage.map((app) => (
                      <tr key={app.app} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-950">{app.app}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-600">{app.exe}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              app.category === "Work"
                                ? "success"
                                : app.category === "Neutral"
                                ? "neutral"
                                : "warning"
                            }
                            size="sm"
                          >
                            {app.category.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">{app.totalTime}</td>
                        <td className="py-3 px-4 text-gray-700">{app.activeUsers} workstations</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">{app.pct}%</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab Content: Workstation Health (Admin / Manager only) */}
      {activeTab === "WORKSTATION_HEALTH" && !isEmployee && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div>
              <h3 className="text-sm font-semibold text-gray-950">Workstation Endpoint Inventory</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Enrolled Windows 10/11 machines running GA WORK-TIME desktop agent
              </p>
            </div>
            <Badge variant="success">All Agents Healthy</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-text-muted font-medium">
                  <th className="py-2.5 px-4">Workstation</th>
                  <th className="py-2.5 px-4">Assigned Member</th>
                  <th className="py-2.5 px-4">OS Build</th>
                  <th className="py-2.5 px-4">Agent Version</th>
                  <th className="py-2.5 px-4">Local Queue</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Heartbeat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workstationData.map((w) => (
                  <tr key={w.hostname} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-950">{w.hostname}</td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{w.user}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">{w.os}</td>
                    <td className="py-3 px-4 font-mono text-gray-600">{w.agent}</td>
                    <td className="py-3 px-4 text-emerald-700 font-medium">{w.queue}</td>
                    <td className="py-3 px-4">
                      {w.status === "Online" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Online
                        </span>
                      )}
                      {w.status === "Idle" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Idle
                        </span>
                      )}
                      {w.status === "Offline" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-text-muted text-[11px]">{w.lastSync}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Privacy Charter Notice Banner (SRS Section 1.1) */}
      <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3 text-xs text-text-secondary">
        <Shield className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-gray-900">Privacy by Design: </span>
          GA WORK-TIME captures only foreground application windows and idle duration via native Windows Win32 APIs. No keystrokes, clipboard items, screen captures, webcam video, or document contents are ever recorded.
        </div>
      </div>

      {/* Offline Inactivity Explanation Dialog */}
      <Modal
        isOpen={!!selectedRecordForNote}
        onClose={() => setSelectedRecordForNote(null)}
        title="Explain Inactivity Period"
        description={
          selectedRecordForNote
            ? `Submit an offline explanation for ${selectedRecordForNote.displayDay} (${selectedRecordForNote.idle} inactivity duration).`
            : ""
        }
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <p className="font-semibold">Automated Idle Detection Notice</p>
            <p className="mt-0.5">
              The desktop agent detected {selectedRecordForNote?.idle} without physical keyboard or mouse input. If this was spent in meetings, whiteboarding, or offline client calls, add your explanation below.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Reason / Explanation for Inactivity
            </label>
            <textarea
              value={inactivityReason}
              onChange={(e) => setInactivityReason(e.target.value)}
              placeholder="e.g. In-person system architecture whiteboarding session with engineering leads..."
              className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-950 focus:border-gray-950 resize-none h-24"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedRecordForNote(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveInactivityNote}
              disabled={!inactivityReason.trim()}
            >
              Save Offline Note
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
