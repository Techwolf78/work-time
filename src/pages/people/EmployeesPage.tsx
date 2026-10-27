import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { useAuth } from "../../lib/authContext";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { cn } from "../../lib/utils";

export function EmployeesPage() {
  const { employees, departments } = useHrms();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isManager = user?.role === "MANAGER";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "IDLE" | "OFFLINE">("ALL");

  // Telemetry attributes mapped to each employee
  const employeesWithTelemetry = useMemo(() => {
    const workstations = [
      { hostname: "DESKTOP-AJAYP", os: "Windows 11 Pro", status: "ACTIVE" as const, tracked: "6h 45m", week: "32h 10m", currentApp: "VS Code" },
      { hostname: "LAPTOP-PRIYA", os: "Windows 11 Enterprise", status: "ACTIVE" as const, tracked: "6h 12m", week: "30h 40m", currentApp: "Chrome" },
      { hostname: "DESKTOP-RAJESH", os: "Windows 11 Pro", status: "ACTIVE" as const, tracked: "7h 05m", week: "34h 50m", currentApp: "Figma" },
      { hostname: "LAPTOP-ANANYA", os: "Windows 10 Pro", status: "IDLE" as const, tracked: "5h 40m", week: "28h 15m", currentApp: "Idle (>5m)" },
      { hostname: "LAPTOP-VIKRAM", os: "Windows 11 Home", status: "ACTIVE" as const, tracked: "6h 30m", week: "31h 00m", currentApp: "Slack" },
      { hostname: "DESKTOP-SNEHA", os: "Windows 11 Pro", status: "OFFLINE" as const, tracked: "4h 10m", week: "24h 30m", currentApp: "Offline" },
    ];

    return employees.map((emp, index) => {
      const mockWs = workstations[index % workstations.length];
      const dept = departments.find((d) => d.id === emp.departmentId)?.name || "Engineering";

      return {
        ...emp,
        departmentName: dept,
        workstation: mockWs.hostname,
        os: mockWs.os,
        agentStatus: mockWs.status,
        todayTracked: mockWs.tracked,
        weekTotal: mockWs.week,
        activeApp: mockWs.currentApp,
        agentVersion: "v1.0.0",
      };
    });
  }, [employees, departments]);

  // Filtering
  const filteredList = useMemo(() => {
    return employeesWithTelemetry.filter((item) => {
      // If Manager, filter to Engineering/their authorized team
      if (isManager && item.departmentName !== "Engineering" && !item.firstName.includes("Ananya")) {
        return false;
      }

      if (selectedDept !== "ALL" && item.departmentName !== selectedDept) return false;
      if (statusFilter !== "ALL" && item.agentStatus !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
        return (
          fullName.includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.workstation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [employeesWithTelemetry, isManager, selectedDept, statusFilter, searchQuery]);

  const activeCount = filteredList.filter((e) => e.agentStatus === "ACTIVE").length;
  const idleCount = filteredList.filter((e) => e.agentStatus === "IDLE").length;
  const offlineCount = filteredList.filter((e) => e.agentStatus === "OFFLINE").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title={isManager ? "My Team" : "People & Workstations"}
        subtitle={
          isManager
            ? "Authorized team members, workstation hardware, and automatically captured desktop activity"
            : "Platform-wide workforce directory, registered Windows endpoints, and agent tracking status"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: isManager ? "My Team" : "People" },
        ]}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">
            {isManager ? "Team Members" : "Total Workforce"}
          </p>
          <p className="text-2xl font-bold text-gray-950 mt-1">{filteredList.length}</p>
          <p className="text-[11px] text-text-muted mt-0.5">Enrolled Windows endpoints</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Active Agents</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          <p className="text-[11px] text-emerald-700 mt-0.5">Active input detected</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Idle / Away</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{idleCount}</p>
          <p className="text-[11px] text-text-muted mt-0.5">&gt;5m inactivity threshold</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Offline / Disconnected</p>
          <p className="text-2xl font-bold text-gray-500 mt-1">{offlineCount}</p>
          <p className="text-[11px] text-text-muted mt-0.5">Agent closed or PC off</p>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-sm w-full">
            <Input
              placeholder="Search by name, email, or workstation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Department Filter */}
            {!isManager && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-white border border-gray-200 text-xs rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none shadow-2xs font-medium"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant={statusFilter === "ALL" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setStatusFilter("ALL")}
                className="text-xs"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "ACTIVE" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setStatusFilter("ACTIVE")}
                className="text-xs"
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "IDLE" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setStatusFilter("IDLE")}
                className="text-xs"
              >
                Idle
              </Button>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 text-text-muted font-medium">
                <th className="py-2.5 px-4">Member</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Workstation Endpoint</th>
                <th className="py-2.5 px-4">Tracking Status</th>
                <th className="py-2.5 px-4">Today's Tracked Time</th>
                <th className="py-2.5 px-4">Weekly Total</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {emp.avatar ? (
                        <img
                          src={emp.avatar}
                          alt={emp.firstName}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-semibold text-xs border border-gray-200 shrink-0">
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-950">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[11px] text-text-muted">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-700">
                    {emp.departmentName}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-gray-900 font-medium">{emp.workstation}</div>
                    <div className="text-[10px] text-gray-400">{emp.os} • {emp.agentVersion}</div>
                  </td>
                  <td className="py-3 px-4">
                    {emp.agentStatus === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active • {emp.activeApp}
                      </span>
                    )}
                    {emp.agentStatus === "IDLE" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Idle (&gt;5m)
                      </span>
                    )}
                    {emp.agentStatus === "OFFLINE" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        Offline
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">{emp.todayTracked}</td>
                  <td className="py-3 px-4 font-mono text-text-muted">{emp.weekTotal}</td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/time/timeline")}
                      className="text-xs gap-1"
                    >
                      <span>Timeline</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
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
