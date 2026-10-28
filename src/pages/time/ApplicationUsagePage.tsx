import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  AppWindow,
  Filter,
  Download,
  Search,
  CheckCircle,
  AlertTriangle,
  Monitor,
  Clock,
  Sparkles,
  Users,
  Calendar,
} from "lucide-react";
import { Input } from "../../components/ui/Input";
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
import { useRbacScope } from "../../lib/rbacScope";

interface AppUsageSummary {
  executable: string;
  category: "work" | "neutral" | "restricted";
  totalSeconds: number;
  intervalCount: number;
  users: Set<string>;
  lastSeen: string;
  sampleTitles: string[];
}

const DEFAULT_WORK_APPS = [
  "code.exe",
  "devenv.exe",
  "figma.exe",
  "postman.exe",
  "slack.exe",
  "teams.exe",
  "terminal",
  "cmd.exe",
  "powershell.exe",
  "node.exe",
  "githubdesktop.exe",
  "git.exe",
  "ga-work-time.exe",
  "workpulsetray.exe",
];

const DEFAULT_RESTRICTED_APPS = [
  "steam.exe",
  "spotify.exe",
  "discord.exe",
  "netflix.exe",
  "epicgameslauncher.exe",
  "torrent.exe",
];

function classifyApp(appName: string): "work" | "neutral" | "restricted" {
  const lower = (appName || "").toLowerCase().trim();
  if (DEFAULT_WORK_APPS.some((app) => lower.includes(app))) return "work";
  if (DEFAULT_RESTRICTED_APPS.some((app) => lower.includes(app))) return "restricted";
  return "neutral";
}

export function ApplicationUsagePage() {
  const [logs, setLogs] = useState<ActivityIntervalRecord[]>([]);
  const [devices, setDevices] = useState<TelemetryDevice[]>([]);
  const [crmStaff, setCrmStaff] = useState<CrmEmployeeSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>(getTodayDateString());

  // Load CRM staff for RBAC team mapping
  useEffect(() => {
    fetchCrmEmployees().then((staff) => setCrmStaff(staff));
  }, []);

  // Subscribe to real-time activity intervals
  useEffect(() => {
    const unsubscribeLogs = subscribeToActivityLogs(
      { date: dateFilter },
      (fetchedLogs) => {
        setLogs(fetchedLogs);
      }
    );

    const unsubscribeDevices = subscribeToTelemetryDevices((fetchedDevices) => {
      setDevices(fetchedDevices);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeDevices();
    };
  }, [dateFilter]);

  // Centralized RBAC Scoping
  const { isManager, isEmployee, isSuperAdmin, scopedLogs, scopedStaff } = useRbacScope(
    crmStaff,
    devices,
    logs
  );

  // Aggregate scoped logs into application metrics
  const { appList, totalTrackedSeconds, workSeconds, neutralSeconds, restrictedSeconds } =
    useMemo(() => {
      const map = new Map<string, AppUsageSummary>();
      let workSec = 0;
      let neutralSec = 0;
      let restrictedSec = 0;
      let totalSec = 0;

      scopedLogs.forEach((log) => {
        const app = log.executable || "System";
        const cat = log.category || classifyApp(app);
        const dur = log.durationSeconds || 15;

        totalSec += dur;
        if (cat === "work") workSec += dur;
        else if (cat === "restricted") restrictedSec += dur;
        else neutralSec += dur;

        if (!map.has(app)) {
          map.set(app, {
            executable: app,
            category: cat,
            totalSeconds: 0,
            intervalCount: 0,
            users: new Set(),
            lastSeen: log.endTime || log.startTime || "",
            sampleTitles: [],
          });
        }

        const entry = map.get(app)!;
        entry.totalSeconds += dur;
        entry.intervalCount += 1;
        if (log.employeeName || log.employeeEmail) {
          entry.users.add(log.employeeName || log.employeeEmail!);
        }
        if (log.windowTitle && !entry.sampleTitles.includes(log.windowTitle)) {
          entry.sampleTitles.push(log.windowTitle);
          if (entry.sampleTitles.length > 3) entry.sampleTitles.shift();
        }
      });

      // Also merge current foreground apps from active devices
      devices.forEach((dev) => {
        if (dev.online && dev.currentApp) {
          const app = dev.currentApp;
          const cat = classifyApp(app);
          if (!map.has(app)) {
            map.set(app, {
              executable: app,
              category: cat,
              totalSeconds: dev.todayTrackedSeconds || 300,
              intervalCount: 1,
              users: new Set([dev.employeeName || dev.employeeEmail]),
              lastSeen: "Active right now",
              sampleTitles: dev.windowTitle ? [dev.windowTitle] : [],
            });
            totalSec += dev.todayTrackedSeconds || 300;
            if (cat === "work") workSec += dev.todayTrackedSeconds || 300;
            else if (cat === "restricted") restrictedSec += dev.todayTrackedSeconds || 300;
            else neutralSec += dev.todayTrackedSeconds || 300;
          }
        }
      });

      const list = Array.from(map.values()).sort(
        (a, b) => b.totalSeconds - a.totalSeconds
      );

      return {
        appList: list,
        totalTrackedSeconds: totalSec,
        workSeconds: workSec,
        neutralSeconds: neutralSec,
        restrictedSeconds: restrictedSec,
      };
    }, [scopedLogs, devices]);

  // Filtered list
  const filteredApps = useMemo(() => {
    return appList.filter((app) => {
      const matchesSearch =
        app.executable.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.sampleTitles.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        categoryFilter === "all" ||
        app.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [appList, searchQuery, categoryFilter]);

  const workPct = totalTrackedSeconds > 0 ? ((workSeconds / totalTrackedSeconds) * 100).toFixed(1) : "0";
  const neutralPct = totalTrackedSeconds > 0 ? ((neutralSeconds / totalTrackedSeconds) * 100).toFixed(1) : "0";
  const restrictedPct = totalTrackedSeconds > 0 ? ((restrictedSeconds / totalTrackedSeconds) * 100).toFixed(1) : "0";

  const handleExportCsv = () => {
    const headers = ["Application", "Category", "Duration (Seconds)", "Duration (Display)", "Active Users", "Sample Titles"];
    const rows = filteredApps.map((a) => [
      `"${a.executable}"`,
      `"${a.category.toUpperCase()}"`,
      a.totalSeconds,
      `"${formatSecondsToDuration(a.totalSeconds)}"`,
      `"${Array.from(a.users).join(", ")}"`,
      `"${a.sampleTitles.join("; ")}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `app_usage_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Usage & Foreground Analytics"
        subtitle={
          isManager
            ? `Autonomous tracking of foreground window focus durations across your team (${scopedStaff.length} members).`
            : isEmployee
            ? "Autonomous tracking of your workstation foreground window focus durations."
            : "Autonomous tracking of foreground window focus durations and application categorization streamed from desktop agents."
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Telemetry & Time" },
          { label: "Application Usage" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs bg-white border border-surface-border rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5"
              disabled={filteredApps.length === 0}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs text-text-muted font-medium">Work Tools (Productive)</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {formatSecondsToDuration(workSeconds)}
          </p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">
            {workPct}% of monitored time
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs text-text-muted font-medium">Neutral Tools / Browsers</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {formatSecondsToDuration(neutralSeconds)}
          </p>
          <p className="text-xs text-blue-600 mt-1 font-medium">
            {neutralPct}% of monitored time
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs text-text-muted font-medium">Restricted / Non-Work</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {formatSecondsToDuration(restrictedSeconds)}
          </p>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            {restrictedPct}% of monitored time
          </p>
        </Card>
      </div>

      {/* App Table Card */}
      <Card>
        <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-sm w-full">
            <Input
              placeholder="Search application or window title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs"
              leftIcon={<Search className="w-3.5 h-3.5 text-text-muted" />}
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant={categoryFilter === "all" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
            >
              All ({appList.length})
            </Button>
            <Button
              variant={categoryFilter === "work" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setCategoryFilter("work")}
            >
              Work Only
            </Button>
            <Button
              variant={categoryFilter === "neutral" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setCategoryFilter("neutral")}
            >
              Neutral
            </Button>
            <Button
              variant={categoryFilter === "restricted" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setCategoryFilter("restricted")}
            >
              Restricted
            </Button>
          </div>
        </div>

        {/* Dynamic App Catalog Table */}
        {filteredApps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-surface-border text-text-secondary uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Application / Executable</th>
                  <th className="py-3 px-4 font-semibold">Classification</th>
                  <th className="py-3 px-4 font-semibold">Total Duration</th>
                  <th className="py-3 px-4 font-semibold">Share of Session</th>
                  <th className="py-3 px-4 font-semibold">Active Users</th>
                  <th className="py-3 px-4 font-semibold">Recent Window Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredApps.map((app) => {
                  const sharePct =
                    totalTrackedSeconds > 0
                      ? Math.round((app.totalSeconds / totalTrackedSeconds) * 100)
                      : 0;

                  return (
                    <tr key={app.executable} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-700 text-xs">
                            <AppWindow className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary text-xs">
                              {app.executable}
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {app.intervalCount} tracking intervals
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {app.category === "work" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Work Tool
                          </span>
                        ) : app.category === "restricted" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Restricted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Neutral / Browser
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-semibold text-text-primary">
                        {formatSecondsToDuration(app.totalSeconds)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                app.category === "work"
                                  ? "bg-emerald-500"
                                  : app.category === "restricted"
                                  ? "bg-amber-500"
                                  : "bg-blue-500"
                              }`}
                              style={{ width: `${Math.min(sharePct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-text-muted">{sharePct}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-text-secondary">
                        {app.users.size > 0 ? (
                          <span>{Array.from(app.users).slice(0, 2).join(", ")}{app.users.size > 2 ? ` +${app.users.size - 2}` : ""}</span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-text-muted max-w-xs truncate" title={app.sampleTitles[app.sampleTitles.length - 1]}>
                        {app.sampleTitles.length > 0 ? (
                          <span className="truncate block">{app.sampleTitles[app.sampleTitles.length - 1]}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-text-muted space-y-2">
            <AppWindow className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="font-semibold text-text-primary">No application intervals recorded for {dateFilter}</p>
            <p className="max-w-md mx-auto text-text-muted text-[11px]">
              Desktop agents automatically stream foreground process ticks to Firestore. Once employees use applications on their linked computers, real-time usage graphs and breakdowns appear here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
