import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Clock,
  Activity,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  ArrowUpRight,
  Shield,
  Monitor,
  Filter,
  Terminal,
  Play,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../lib/authContext";
import { useHrms } from "../../lib/hrmsContext";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";
import {
  subscribeToTelemetryDevices,
  subscribeToDailySummaries,
  subscribeToActivityLogs,
  fetchAllDailySummaries,
  formatSecondsToDuration,
  getTodayDateString,
  TelemetryDevice,
  DailySummaryRecord,
  ActivityIntervalRecord,
} from "../../lib/telemetryService";

export function DashboardPage() {
  const { user } = useAuth();
  const { employees, departments } = useHrms();
  const navigate = useNavigate();

  const role = user?.role || "SUPER_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN" || role === "HR_ADMIN";
  const isManager = role === "MANAGER";
  const isEmployee = !isSuperAdmin && !isManager;

  const todayStr = useMemo(() => getTodayDateString(), []);
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // Real-time Firestore States
  const [devices, setDevices] = useState<TelemetryDevice[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummaryRecord[]>([]);
  const [todayLogs, setTodayLogs] = useState<ActivityIntervalRecord[]>([]);
  const [allSummaries, setAllSummaries] = useState<DailySummaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to Live Firestore Streams
  useEffect(() => {
    setIsLoading(true);

    // 1. Subscribe to Live Workstation Devices
    const unsubDevices = subscribeToTelemetryDevices((devs) => {
      setDevices(devs);
      setIsLoading(false);
    });

    // 2. Subscribe to Today's Daily Summaries
    const unsubSummaries = subscribeToDailySummaries(todayStr, (sums) => {
      setDailySummaries(sums);
    });

    // 3. Subscribe to Today's Activity Logs
    const unsubLogs = subscribeToActivityLogs(
      { date: todayStr },
      (logs) => {
        setTodayLogs(logs);
      }
    );

    // 4. Fetch past summaries for weekly history
    fetchAllDailySummaries().then((sums) => {
      setAllSummaries(sums);
    });

    return () => {
      unsubDevices();
      unsubSummaries();
      unsubLogs();
    };
  }, [todayStr]);

  // Find current employee's device and summary
  const myEmail = (user?.email || "").toLowerCase();
  const myDevice = devices.find(
    (d) =>
      d.employeeEmail.toLowerCase() === myEmail ||
      d.employeeId === user?.employeeId
  );

  const mySummary = dailySummaries.find(
    (s) =>
      s.employeeEmail.toLowerCase() === myEmail ||
      s.employeeId === user?.employeeId
  );

  // Compute Fleet Totals
  const fleetTotalSeconds = useMemo(() => {
    return dailySummaries.reduce((acc, curr) => acc + (curr.observedSeconds || 0), 0);
  }, [dailySummaries]);

  const fleetActiveSeconds = useMemo(() => {
    return dailySummaries.reduce((acc, curr) => acc + (curr.activeSeconds || 0), 0);
  }, [dailySummaries]);

  const fleetFocusRatio = useMemo(() => {
    if (fleetTotalSeconds <= 0) return "100%";
    return `${Math.round((fleetActiveSeconds / fleetTotalSeconds) * 100)}%`;
  }, [fleetTotalSeconds, fleetActiveSeconds]);

  const onlineDevicesCount = devices.filter((d) => d.online && d.status === "active").length;
  const idleDevicesCount = devices.filter((d) => d.online && d.status === "idle").length;
  const offlineDevicesCount = devices.filter((d) => !d.online || d.status === "offline").length;

  // Filter for Manager (by department)
  const managerDevices = useMemo(() => {
    if (!isManager) return devices;
    const dept = user?.crmDepartment || user?.department || "Engineering";
    return devices.filter(
      (d) => !d.department || d.department.toLowerCase() === dept.toLowerCase()
    );
  }, [devices, isManager, user]);

  // Personal app breakdown from today's real logs
  const personalAppBreakdown = useMemo(() => {
    const userLogs = todayLogs.filter(
      (l) =>
        (l.employeeEmail && l.employeeEmail.toLowerCase() === myEmail) ||
        l.employeeId === user?.employeeId
    );

    const appMap: Record<string, { durationSec: number; exe: string; category: string }> = {};
    let totalSec = 0;

    userLogs.forEach((l) => {
      const app = l.executable || "System";
      if (!appMap[app]) {
        appMap[app] = { durationSec: 0, exe: l.executable, category: l.category || "work" };
      }
      appMap[app].durationSec += l.durationSeconds || 0;
      totalSec += l.durationSeconds || 0;
    });

    return Object.entries(appMap)
      .map(([app, data]) => ({
        app,
        exe: data.exe,
        category: data.category === "work" ? "Work" : "Neutral",
        duration: formatSecondsToDuration(data.durationSec),
        pct: totalSec > 0 ? Math.round((data.durationSec / totalSec) * 100) : 0,
        rawSec: data.durationSec,
      }))
      .sort((a, b) => b.rawSec - a.rawSec)
      .slice(0, 5);
  }, [todayLogs, myEmail, user]);

  // Personal weekly history from allSummaries
  const myWeeklyHistory = useMemo(() => {
    return allSummaries
      .filter(
        (s) =>
          (s.employeeEmail && s.employeeEmail.toLowerCase() === myEmail) ||
          s.employeeId === user?.employeeId
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7)
      .map((s) => ({
        day: s.date === todayStr ? `Today (${s.date})` : s.date,
        total: formatSecondsToDuration(s.observedSeconds),
        active: formatSecondsToDuration(s.activeSeconds),
        idle: formatSecondsToDuration(s.idleSeconds),
        status: s.status,
      }));
  }, [allSummaries, myEmail, user, todayStr]);

  return (
    <div className="space-y-6">
      {/* Crisp Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight">
              {isSuperAdmin
                ? "Organization Overview"
                : isManager
                ? "Team Activity Overview"
                : "My Activity"}
            </h1>
            <Badge variant="neutral" size="sm">
              {isSuperAdmin ? "Super Admin" : isManager ? "Manager" : "Employee"}
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {isSuperAdmin
              ? "Autonomous Windows telemetry streaming directly from Firestore `timetrack_*`"
              : isManager
              ? "Live employee tracking status and team durations captured via desktop agents"
              : "Automatically tracked device utilization captured by your Windows desktop agent"}
          </p>
        </div>

        {/* Header Indicators */}
        <div className="flex items-center gap-2 text-xs">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border",
              onlineDevicesCount > 0 || (myDevice && myDevice.online)
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                onlineDevicesCount > 0 || (myDevice && myDevice.online)
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-gray-400"
              )}
            ></span>
            <span>
              {onlineDevicesCount > 0
                ? `${onlineDevicesCount} Agent${onlineDevicesCount > 1 ? "s" : ""} Online`
                : myDevice?.online
                ? "Agent Active"
                : "Agent Offline"}
            </span>
          </div>
          <span className="text-gray-400">|</span>
          <span className="text-text-muted font-medium">{todayFormatted}</span>
        </div>
      </div>

      {/* Role-Specific Metric Cards Grid */}
      {isSuperAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Total Tracked Today</p>
            <p className="text-2xl font-bold text-gray-950 mt-1">
              {formatSecondsToDuration(fleetTotalSeconds)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Across {devices.length} registered endpoint{devices.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Active Agents</p>
            <p className="text-2xl font-bold text-gray-950 mt-1">
              {onlineDevicesCount} / {Math.max(1, devices.length)}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {devices.length > 0
                ? `${Math.round((onlineDevicesCount / devices.length) * 100)}% fleet reporting active`
                : "Awaiting desktop agent"}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Active Focus Ratio</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{fleetFocusRatio}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Physical input vs idle threshold</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Idle / Offline</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {idleDevicesCount + offlineDevicesCount}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {idleDevicesCount} idle • {offlineDevicesCount} disconnected
            </p>
          </div>
        </div>
      )}

      {isManager && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Team Tracked Today</p>
            <p className="text-2xl font-bold text-gray-950 mt-1">
              {formatSecondsToDuration(fleetTotalSeconds)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Live aggregated duration</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Online Members</p>
            <p className="text-2xl font-bold text-gray-950 mt-1">
              {managerDevices.filter((m) => m.online && m.status === "active").length} /{" "}
              {Math.max(1, managerDevices.length)}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">Active foreground windows</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Team Focus Ratio</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{fleetFocusRatio}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Workstation presence</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Idle / Away</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {managerDevices.filter((m) => m.status === "idle").length}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">Periods &gt; 5m no input</p>
          </div>
        </div>
      )}

      {isEmployee && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Today's Tracked Time</p>
            <p className="text-2xl font-bold text-gray-950 mt-1">
              {mySummary ? formatSecondsToDuration(mySummary.observedSeconds) : "0m"}
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Live endpoint telemetry</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Active Focus Time</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {mySummary ? formatSecondsToDuration(mySummary.activeSeconds) : "0m"}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">Physical input detected</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Idle Duration</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {mySummary ? formatSecondsToDuration(mySummary.idleSeconds) : "0m"}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">Inactivity threshold (&gt;5m)</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Desktop Agent Status</p>
            <p
              className={cn(
                "text-2xl font-bold mt-1",
                myDevice?.online ? "text-emerald-600" : "text-gray-400"
              )}
            >
              {myDevice?.online ? (myDevice.status === "active" ? "Active" : "Idle") : "Offline"}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {myDevice?.hostname || "No agent running"}
            </p>
          </div>
        </div>
      )}

      {/* Zero Devices Agent Launch Helper Banner */}
      {devices.length === 0 && !isLoading && (
        <Card className="p-5 border-dashed border-indigo-300 bg-indigo-50/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-950">
                  Ready to stream real-time desktop telemetry!
                </h3>
              </div>
              <p className="text-xs text-text-muted">
                Run the WorkPulse native agent on your Windows workstation to immediately stream
                active foreground windows and idle intervals into Firebase Firestore.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gray-900 text-gray-100 font-mono text-xs px-3 py-2 rounded-lg shadow-sm border border-gray-800">
              <span className="text-emerald-400">$</span>
              <span>npm run agent</span>
            </div>
          </div>
        </Card>
      )}

      {/* Super Admin & Manager: Live Agent Activity Table */}
      {(isSuperAdmin || isManager) && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-950">
                {isSuperAdmin ? "Live Workstation Fleet Telemetry" : "My Team Live Tracking"}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Real-time heartbeats and active foreground windows captured via Win32 probe
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/time/timeline")}
                className="text-xs gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                24-Hour Timeline
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/reports")}
                className="text-xs"
              >
                Detailed Reports
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60 text-text-muted font-medium">
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Workstation / OS</th>
                  <th className="py-2.5 px-4">Current Application</th>
                  <th className="py-2.5 px-4">Agent Status</th>
                  <th className="py-2.5 px-4">Today's Tracked</th>
                  <th className="py-2.5 px-4">Focus Ratio</th>
                  <th className="py-2.5 px-4 text-right">Last Heartbeat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(isManager ? managerDevices : devices).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Monitor className="w-8 h-8 text-gray-300" />
                        <p className="font-medium text-gray-700">No workstation agents connected</p>
                        <p className="text-[11px] text-gray-400">
                          Launch <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">npm run agent</code> on your machine to begin streaming
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (isManager ? managerDevices : devices).map((device) => {
                    const devSummary = dailySummaries.find(
                      (s) => s.deviceId === device.deviceId || s.employeeEmail === device.employeeEmail
                    );

                    return (
                      <tr key={device.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold text-gray-950">{device.employeeName}</p>
                            <p className="text-[11px] text-text-muted font-mono">{device.employeeEmail}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-600">
                          <div className="font-semibold text-gray-800">{device.hostname}</div>
                          <div className="text-[10px] text-gray-400">{device.os}</div>
                        </td>
                        <td className="py-3 px-4 max-w-[240px]">
                          <p className="font-medium text-gray-800 truncate" title={device.currentApp}>
                            {device.currentApp}
                          </p>
                          {device.windowTitle && (
                            <p className="text-[10px] text-gray-400 truncate" title={device.windowTitle}>
                              {device.windowTitle}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {device.online && device.status === "active" && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active Focus
                            </span>
                          )}
                          {device.online && device.status === "idle" && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Idle ({device.idleSeconds}s)
                            </span>
                          )}
                          {(!device.online || device.status === "offline") && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              Offline
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {formatSecondsToDuration(
                            devSummary?.observedSeconds || device.todayTrackedSeconds || 0
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-indigo-600 font-medium">
                          {devSummary?.focusRatio || device.focusRatio || "100%"}
                        </td>
                        <td className="py-3 px-4 text-right text-text-muted text-[11px]">
                          {device.lastHeartbeat
                            ? new Date(device.lastHeartbeat).toLocaleTimeString()
                            : "N/A"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Employee View: Personal Telemetry Breakdown & History */}
      {isEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Application Breakdown */}
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-950">Today's Application Breakdown</h3>
                <p className="text-xs text-text-muted">Detected foreground window duration</p>
              </div>
              <Badge variant="neutral">{todayFormatted}</Badge>
            </div>

            {personalAppBreakdown.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-xs">
                No application intervals recorded yet today.
              </div>
            ) : (
              <div className="space-y-3">
                {personalAppBreakdown.map((item) => (
                  <div key={item.app} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-900">{item.app}</span>
                      <span className="font-semibold text-gray-950">{item.duration}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          item.category === "Work" ? "bg-indigo-600" : "bg-gray-400"
                        )}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span className="font-mono">{item.exe}</span>
                      <span>{item.pct}% of active session</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* This Week's Tracked History */}
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-950">Weekly Tracked History</h3>
                <p className="text-xs text-text-muted">Past days recorded by desktop agent</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {myWeeklyHistory.length} Days Recorded
              </span>
            </div>

            {myWeeklyHistory.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-xs">
                No past daily summaries logged yet.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {myWeeklyHistory.map((item) => (
                  <div
                    key={item.day}
                    className="p-2.5 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{item.day}</p>
                      <p className="text-[11px] text-gray-500">
                        Active: {item.active} • Idle: {item.idle}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-950">{item.total}</p>
                      <span className="text-[10px] text-emerald-600 font-medium">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
