import React, { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "../../lib/authContext";
import { useHrms } from "../../lib/hrmsContext";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";

export function DashboardPage() {
  const { user } = useAuth();
  const { employees, departments } = useHrms();
  const navigate = useNavigate();

  const role = user?.role || "SUPER_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN" || role === "HR_ADMIN";
  const isManager = role === "MANAGER";
  const isEmployee = !isSuperAdmin && !isManager;

  // Mock Telemetry dataset mapped to active users
  const [teamTelemetry] = useState([
    {
      id: "EMP-1001",
      name: "Ajay Pawar",
      department: "Engineering",
      role: "Lead Full Stack Engineer",
      device: "DESKTOP-AJAYP",
      os: "Windows 11 Pro",
      status: "active" as const,
      currentApp: "Visual Studio Code (Code.exe)",
      todayTracked: "6h 45m",
      todayActive: "5h 52m",
      todayIdle: "53m",
      weeklyTotal: "32h 10m",
      lastSync: "Just now",
    },
    {
      id: "EMP-1002",
      name: "Priya Sharma",
      department: "Human Resources",
      role: "HR Business Partner",
      device: "LAPTOP-PRIYA",
      os: "Windows 11 Enterprise",
      status: "active" as const,
      currentApp: "Google Chrome (chrome.exe)",
      todayTracked: "6h 12m",
      todayActive: "5h 20m",
      todayIdle: "52m",
      weeklyTotal: "30h 40m",
      lastSync: "1m ago",
    },
    {
      id: "EMP-1003",
      name: "Rajesh Kulkarni",
      department: "Engineering",
      role: "Architect & Manager",
      device: "DESKTOP-RAJESH",
      os: "Windows 11 Pro",
      status: "active" as const,
      currentApp: "Figma (Figma.exe)",
      todayTracked: "7h 05m",
      todayActive: "6h 15m",
      todayIdle: "50m",
      weeklyTotal: "34h 50m",
      lastSync: "Just now",
    },
    {
      id: "EMP-1004",
      name: "Ananya Iyer",
      department: "Engineering",
      role: "Senior Software Engineer",
      device: "LAPTOP-ANANYA",
      os: "Windows 10 Pro",
      status: "idle" as const,
      currentApp: "Away / Idle (>5m no input)",
      todayTracked: "5h 40m",
      todayActive: "4h 45m",
      todayIdle: "55m",
      weeklyTotal: "28h 15m",
      lastSync: "6m ago",
    },
    {
      id: "EMP-1005",
      name: "Vikram Malhotra",
      department: "Product",
      role: "Product Manager",
      device: "LAPTOP-VIKRAM",
      os: "Windows 11 Home",
      status: "active" as const,
      currentApp: "Slack (slack.exe)",
      todayTracked: "6h 30m",
      todayActive: "5h 40m",
      todayIdle: "50m",
      weeklyTotal: "31h 00m",
      lastSync: "2m ago",
    },
    {
      id: "EMP-1006",
      name: "Sneha Patil",
      department: "Design",
      role: "UI/UX Designer",
      device: "DESKTOP-SNEHA",
      os: "Windows 11 Pro",
      status: "disconnected" as const,
      currentApp: "Agent Offline",
      todayTracked: "4h 10m",
      todayActive: "3h 40m",
      todayIdle: "30m",
      weeklyTotal: "24h 30m",
      lastSync: "2h ago",
    },
  ]);

  // Employee's personal app breakdown
  const personalAppBreakdown = [
    { app: "Visual Studio Code", exe: "Code.exe", category: "Work", duration: "3h 52m", pct: 57 },
    { app: "Google Chrome", exe: "chrome.exe", category: "Neutral", duration: "1h 35m", pct: 23 },
    { app: "Windows Terminal (PowerShell)", exe: "wt.exe", category: "Work", duration: "48m", pct: 12 },
    { app: "Slack", exe: "slack.exe", category: "Work", duration: "30m", pct: 8 },
  ];

  // Employee weekly summary
  const weeklyHistory = [
    { day: "Mon, Oct 20", total: "7h 45m", active: "6h 50m", idle: "55m", status: "Full Shift" },
    { day: "Tue, Oct 21", total: "8h 10m", active: "7h 15m", idle: "55m", status: "Full Shift" },
    { day: "Wed, Oct 22", total: "7h 30m", active: "6h 35m", idle: "55m", status: "Full Shift" },
    { day: "Thu, Oct 23", total: "8h 05m", active: "7h 00m", idle: "1h 05m", status: "Full Shift" },
    { day: "Fri, Oct 24", total: "7h 20m", active: "6h 25m", idle: "55m", status: "Full Shift" },
    { day: "Today (Mon, Oct 26)", total: "6h 45m", active: "5h 52m", idle: "53m", status: "In Progress" },
  ];

  // Filter team items for Manager (Engineering department team members)
  const managerTeam = teamTelemetry.filter(
    (t) => t.department === "Engineering" || t.name.includes("Ananya") || t.name.includes("Ajay")
  );

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
              ? "Autonomous Windows telemetry across all enrolled workstations"
              : isManager
              ? "Real-time employee tracking status and team durations captured via desktop agents"
              : "Automatically tracked device utilization captured by your Windows desktop agent"}
          </p>
        </div>

        {/* Header Indicators */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Agent Active • Win11</span>
          </div>
          <span className="text-gray-400">|</span>
          <span className="text-text-muted font-medium">Monday, Oct 26, 2026</span>
        </div>
      </div>

      {/* Role-Specific Metric Cards Grid (Clean, iOS-inspired minimal cards) */}
      {isSuperAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Total Tracked Today</p>
            <p className="text-2xl font-bold text-gray-950 mt-1">158h 40m</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Across 24 enrolled endpoints</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Active Agents</p>
            <p className="text-2xl font-bold text-gray-950 mt-1">21 / 24</p>
            <p className="text-[11px] text-text-muted mt-0.5">87.5% fleet reporting online</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Active Focus Ratio</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">84.2%</p>
            <p className="text-[11px] text-text-muted mt-0.5">Device input vs idle threshold</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Inactive / Disconnected</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">3</p>
            <p className="text-[11px] text-text-muted mt-0.5">Off duty or offline</p>
          </div>
        </div>
      )}

      {isManager && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Team Tracked Today</p>
            <p className="text-2xl font-bold text-gray-950 mt-1">48h 15m</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Target: 64h 00m shift</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Online Members</p>
            <p className="text-2xl font-bold text-gray-950 mt-1">
              {managerTeam.filter((m) => m.status === "active").length} / {managerTeam.length}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">Active foreground windows</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Team Focus Ratio</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">86.4%</p>
            <p className="text-[11px] text-text-muted mt-0.5">High workstation presence</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Idle / Away</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {managerTeam.filter((m) => m.status === "idle").length}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">Periods &gt; 5m no input</p>
          </div>
        </div>
      )}

      {isEmployee && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Today's Tracked Time</p>
            <p className="text-2xl font-bold text-gray-950 mt-1">6h 45m</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">84% of 8h 00m shift target</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Active Focus Time</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">5h 52m</p>
            <p className="text-[11px] text-text-muted mt-0.5">Physical input detected</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Idle Duration</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">53m</p>
            <p className="text-[11px] text-text-muted mt-0.5">Inactivity threshold (&gt;5m)</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-medium text-text-muted">Desktop Agent Status</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">Online</p>
            <p className="text-[11px] text-text-muted mt-0.5">Win11 • v1.0.0 (Zero keylogging)</p>
          </div>
        </div>
      )}

      {/* Super Admin & Manager: Live Agent Activity Table */}
      {(isSuperAdmin || isManager) && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-950">
                {isSuperAdmin ? "Organization Agent Activity & Telemetry" : "My Team Live Tracking"}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Automatically recorded via Windows Win32 API • 5-min batched sync
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/reports")}
                className="text-xs"
              >
                View Detailed Reports
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
                  <th className="py-2.5 px-4">Today's Time</th>
                  <th className="py-2.5 px-4">Week Total</th>
                  <th className="py-2.5 px-4 text-right">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(isManager ? managerTeam : teamTelemetry).map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-gray-950">{member.name}</p>
                        <p className="text-[11px] text-text-muted">{member.role}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-600">
                      <div>{member.device}</div>
                      <div className="text-[10px] text-gray-400">{member.os}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800">{member.currentApp}</span>
                    </td>
                    <td className="py-3 px-4">
                      {member.status === "active" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      )}
                      {member.status === "idle" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Idle
                        </span>
                      )}
                      {member.status === "disconnected" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{member.todayTracked}</td>
                    <td className="py-3 px-4 text-text-muted font-mono">{member.weeklyTotal}</td>
                    <td className="py-3 px-4 text-right text-text-muted text-[11px]">
                      {member.lastSync}
                    </td>
                  </tr>
                ))}
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
              <Badge variant="neutral">Oct 26, 2026</Badge>
            </div>

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
          </Card>

          {/* This Week's Tracked History */}
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-950">Weekly Tracked History</h3>
                <p className="text-xs text-text-muted">Past days recorded by desktop agent</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                39h 05m this week
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {weeklyHistory.map((item) => (
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
          </Card>
        </div>
      )}
    </div>
  );
}
