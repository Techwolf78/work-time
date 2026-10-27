import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/authContext";

interface TelemetryInterval {
  id: string;
  start: string;
  end: string;
  durationMinutes: number;
  durationDisplay: string;
  state: "active" | "idle" | "locked";
  executable: string;
  windowTitle: string;
  category: "work" | "neutral" | "restricted";
}

interface EmployeeTimelineData {
  id: string;
  name: string;
  device: string;
  os: string;
  totalTracked: string;
  activeTime: string;
  activeRatio: string;
  idleTime: string;
  lockedTime: string;
  intervals: TelemetryInterval[];
}

const EMPLOYEES_DATA: Record<string, EmployeeTimelineData> = {
  "EMP-1001": {
    id: "EMP-1001",
    name: "Ajay Pawar",
    device: "DESKTOP-AJAYP",
    os: "Windows 11 Pro 23H2",
    totalTracked: "6h 45m",
    activeTime: "5h 52m",
    activeRatio: "87%",
    idleTime: "53m",
    lockedTime: "45m",
    intervals: [
      {
        id: "int-01",
        start: "08:30 AM",
        end: "10:15 AM",
        durationMinutes: 105,
        durationDisplay: "1h 45m",
        state: "active",
        executable: "Code.exe",
        windowTitle: "ActivityTimelinePage.tsx - ga-work-time - Visual Studio Code",
        category: "work",
      },
      {
        id: "int-02",
        start: "10:15 AM",
        end: "10:35 AM",
        durationMinutes: 20,
        durationDisplay: "20m",
        state: "idle",
        executable: "idle.exe",
        windowTitle: "Away from desk (>5m no physical mouse/keyboard input)",
        category: "neutral",
      },
      {
        id: "int-03",
        start: "10:35 AM",
        end: "12:15 PM",
        durationMinutes: 100,
        durationDisplay: "1h 40m",
        state: "active",
        executable: "chrome.exe",
        windowTitle: "Google Chrome - GitHub Pull Requests & Cloud Firestore Docs",
        category: "work",
      },
      {
        id: "int-04",
        start: "12:15 PM",
        end: "01:00 PM",
        durationMinutes: 45,
        durationDisplay: "45m",
        state: "locked",
        executable: "LockApp.exe",
        windowTitle: "Windows Workstation Session Locked (Lunch Break)",
        category: "neutral",
      },
      {
        id: "int-05",
        start: "01:00 PM",
        end: "02:45 PM",
        durationMinutes: 105,
        durationDisplay: "1h 45m",
        state: "active",
        executable: "Code.exe",
        windowTitle: "App.tsx - ga-work-time - Visual Studio Code",
        category: "work",
      },
      {
        id: "int-06",
        start: "02:45 PM",
        end: "03:18 PM",
        durationMinutes: 33,
        durationDisplay: "33m",
        state: "idle",
        executable: "idle.exe",
        windowTitle: "Away from desk (Offline whiteboard discussion)",
        category: "neutral",
      },
      {
        id: "int-07",
        start: "03:18 PM",
        end: "04:00 PM",
        durationMinutes: 42,
        durationDisplay: "42m",
        state: "active",
        executable: "wt.exe",
        windowTitle: "Windows Terminal - PowerShell (npm run build)",
        category: "work",
      },
    ],
  },
  "EMP-1004": {
    id: "EMP-1004",
    name: "Ananya Iyer",
    device: "LAPTOP-ANANYA",
    os: "Windows 10 Pro",
    totalTracked: "5h 40m",
    activeTime: "4h 45m",
    activeRatio: "84%",
    idleTime: "55m",
    lockedTime: "30m",
    intervals: [
      {
        id: "int-11",
        start: "09:00 AM",
        end: "11:15 AM",
        durationMinutes: 135,
        durationDisplay: "2h 15m",
        state: "active",
        executable: "Code.exe",
        windowTitle: "database.ts - Backend Services - VS Code",
        category: "work",
      },
      {
        id: "int-12",
        start: "11:15 AM",
        end: "11:45 AM",
        durationMinutes: 30,
        durationDisplay: "30m",
        state: "idle",
        executable: "idle.exe",
        windowTitle: "Away from desk (>5m no physical input)",
        category: "neutral",
      },
      {
        id: "int-13",
        start: "11:45 AM",
        end: "01:30 PM",
        durationMinutes: 105,
        durationDisplay: "1h 45m",
        state: "active",
        executable: "slack.exe",
        windowTitle: "Slack - #engineering-standup",
        category: "work",
      },
      {
        id: "int-14",
        start: "01:30 PM",
        end: "02:00 PM",
        durationMinutes: 30,
        durationDisplay: "30m",
        state: "locked",
        executable: "LogonUI.exe",
        windowTitle: "Workstation Locked",
        category: "neutral",
      },
      {
        id: "int-15",
        start: "02:00 PM",
        end: "02:45 PM",
        durationMinutes: 45,
        durationDisplay: "45m",
        state: "active",
        executable: "chrome.exe",
        windowTitle: "Stack Overflow & API Documentation",
        category: "work",
      },
    ],
  },
  "EMP-1003": {
    id: "EMP-1003",
    name: "Rajesh Kulkarni",
    device: "DESKTOP-RAJESH",
    os: "Windows 11 Pro",
    totalTracked: "7h 05m",
    activeTime: "6h 15m",
    activeRatio: "88%",
    idleTime: "50m",
    lockedTime: "40m",
    intervals: [
      {
        id: "int-21",
        start: "08:15 AM",
        end: "10:30 AM",
        durationMinutes: 135,
        durationDisplay: "2h 15m",
        state: "active",
        executable: "Figma.exe",
        windowTitle: "Figma - WorkPulse UI Specs & iOS Layouts",
        category: "work",
      },
      {
        id: "int-22",
        start: "10:30 AM",
        end: "10:55 AM",
        durationMinutes: 25,
        durationDisplay: "25m",
        state: "idle",
        executable: "idle.exe",
        windowTitle: "Away from desk",
        category: "neutral",
      },
      {
        id: "int-23",
        start: "10:55 AM",
        end: "01:15 PM",
        durationMinutes: 140,
        durationDisplay: "2h 20m",
        state: "active",
        executable: "msedge.exe",
        windowTitle: "Microsoft Edge - Cloud Console",
        category: "work",
      },
      {
        id: "int-24",
        start: "01:15 PM",
        end: "01:55 PM",
        durationMinutes: 40,
        durationDisplay: "40m",
        state: "locked",
        executable: "LockApp.exe",
        windowTitle: "Session Locked",
        category: "neutral",
      },
      {
        id: "int-25",
        start: "01:55 PM",
        end: "03:35 PM",
        durationMinutes: 100,
        durationDisplay: "1h 40m",
        state: "active",
        executable: "Code.exe",
        windowTitle: "VS Code - Architecture Review",
        category: "work",
      },
    ],
  },
};

export function ActivityTimelinePage() {
  const { user } = useAuth();
  const [selectedEmpId, setSelectedEmpId] = useState<string>("EMP-1001");
  const [filterState, setFilterState] = useState<"all" | "active" | "idle" | "locked">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const currentData = EMPLOYEES_DATA[selectedEmpId] || EMPLOYEES_DATA["EMP-1001"];

  const filteredIntervals = useMemo(() => {
    return currentData.intervals.filter((interval) => {
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
  }, [currentData, filterState, searchQuery]);

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
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="bg-transparent font-medium text-gray-900 focus:outline-none cursor-pointer pr-2"
              >
                <option value="EMP-1001">Ajay Pawar (EMP-1001)</option>
                <option value="EMP-1003">Rajesh Kulkarni (EMP-1003)</option>
                <option value="EMP-1004">Ananya Iyer (EMP-1004)</option>
              </select>
            </div>

            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>Today (Oct 26, 2026)</span>
            </Button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Total Workday Tracked</p>
          <p className="text-2xl font-bold text-gray-950 mt-1">{currentData.totalTracked}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Continuous session</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Active Computer Time</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{currentData.activeTime}</p>
          <p className="text-[11px] text-text-muted mt-0.5">{currentData.activeRatio} active presence</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Idle Inactivity</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{currentData.idleTime}</p>
          <p className="text-[11px] text-text-muted mt-0.5">Periods &gt; 5m without input</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Session Locked / Break</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{currentData.lockedTime}</p>
          <p className="text-[11px] text-text-muted mt-0.5">{currentData.device}</p>
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
              Hover over blocks to inspect active application and timestamp range
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
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
        <div className="w-full h-9 bg-gray-100 rounded-lg overflow-hidden flex items-stretch border border-gray-200 p-0.5 gap-0.5">
          {/* Pre-work hours (00:00 - 08:30) */}
          <div
            className="bg-gray-200/90 rounded-sm w-[35%] flex items-center justify-center text-[10px] text-gray-500 font-medium"
            title="Standby / Off (00:00 - 08:30)"
          >
            Standby (00:00 - 08:30)
          </div>

          {/* Dynamic intervals mapped */}
          {currentData.intervals.map((int) => {
            let bgColor = "bg-indigo-600";
            if (int.state === "idle") bgColor = "bg-amber-400";
            if (int.state === "locked") bgColor = "bg-purple-500";

            return (
              <div
                key={int.id}
                className={cn(
                  "rounded-sm transition-all duration-150 cursor-pointer relative group",
                  bgColor,
                  int.durationMinutes > 60 ? "flex-[2]" : "flex-[1]"
                )}
                title={`${int.start} - ${int.end} (${int.durationDisplay}) | ${int.executable}`}
              />
            );
          })}

          {/* Post-work hours */}
          <div
            className="bg-gray-200/90 rounded-sm flex-1 flex items-center justify-center text-[10px] text-gray-400"
            title="Future hours"
          ></div>
        </div>

        {/* 24-Hour Axis Labels */}
        <div className="flex justify-between text-[11px] text-gray-400 px-1 font-mono">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>23:59</span>
        </div>
      </Card>

      {/* Telemetry Intervals Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-sm w-full">
            <Input
              placeholder="Search by window title or executable..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant={filterState === "all" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilterState("all")}
              className="text-xs"
            >
              All ({currentData.intervals.length})
            </Button>
            <Button
              variant={filterState === "active" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilterState("active")}
              className="text-xs"
            >
              Active Only
            </Button>
            <Button
              variant={filterState === "idle" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilterState("idle")}
              className="text-xs"
            >
              Idle Only
            </Button>
            <Button
              variant={filterState === "locked" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilterState("locked")}
              className="text-xs"
            >
              Locked Only
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 text-text-muted font-medium">
                <th className="py-2.5 px-4">Time Span</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">State</th>
                <th className="py-2.5 px-4">Application</th>
                <th className="py-2.5 px-4">Active Window Title</th>
                <th className="py-2.5 px-4 text-right">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredIntervals.map((interval) => (
                <tr key={interval.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-gray-900">
                    {interval.start} - {interval.end}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-950">
                    {interval.durationDisplay}
                  </td>
                  <td className="py-3 px-4">
                    {interval.state === "active" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        Active
                      </span>
                    )}
                    {interval.state === "idle" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Idle (&gt;5m)
                      </span>
                    )}
                    {interval.state === "locked" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        Session Locked
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-700 font-medium">
                    {interval.executable}
                  </td>
                  <td className="py-3 px-4 text-gray-800 max-w-md truncate" title={interval.windowTitle}>
                    {interval.windowTitle}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant={interval.category === "work" ? "success" : "neutral"} size="sm">
                      {interval.category.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
