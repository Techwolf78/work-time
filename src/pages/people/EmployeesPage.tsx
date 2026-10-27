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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "IDLE" | "OFFLINE">("ALL");

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
    // If CRM users loaded, prioritize CRM users
    if (crmStaff.length > 0) {
      return crmStaff.map((staff) => {
        const emailLower = staff.email.toLowerCase();
        const matchedDev = devices.find(
          (d) => d.employeeEmail.toLowerCase() === emailLower || d.employeeId === staff.id
        );

        const nameParts = staff.name.trim().split(" ");
        const firstName = nameParts[0] || staff.name;
        const lastName = nameParts.slice(1).join(" ") || "";

        return {
          id: staff.id,
          firstName,
          lastName,
          email: staff.email,
          avatar: "",
          departmentName: staff.department || "Operations",
          workstation: matchedDev ? matchedDev.hostname : "Awaiting Agent",
          os: matchedDev ? matchedDev.os : "Windows 10/11",
          agentStatus: matchedDev
            ? matchedDev.online
              ? matchedDev.status === "active"
                ? ("ACTIVE" as const)
                : ("IDLE" as const)
              : ("OFFLINE" as const)
            : ("OFFLINE" as const),
          todayTracked: matchedDev
            ? formatSecondsToDuration(matchedDev.todayTrackedSeconds || 0)
            : "0m",
          weekTotal: matchedDev
            ? formatSecondsToDuration(matchedDev.todayTrackedSeconds || 0)
            : "0m",
          activeApp: matchedDev ? matchedDev.currentApp : "Not reporting",
          agentVersion: matchedDev ? matchedDev.agentVersion : "v1.2.0",
        };
      });
    }

    // Fallback to local HRMS list if CRM fetch is waiting
    return employees.map((emp) => {
      const emailLower = emp.email.toLowerCase();
      const matchedDev = devices.find(
        (d) => d.employeeEmail.toLowerCase() === emailLower || d.employeeId === emp.id
      );

      const dept = departments.find((d) => d.id === emp.departmentId)?.name || "Engineering";

      return {
        ...emp,
        departmentName: dept,
        workstation: matchedDev ? matchedDev.hostname : "Awaiting Agent",
        os: matchedDev ? matchedDev.os : "Windows 10/11",
        agentStatus: matchedDev
          ? matchedDev.online
            ? matchedDev.status === "active"
              ? ("ACTIVE" as const)
              : ("IDLE" as const)
            : ("OFFLINE" as const)
          : ("OFFLINE" as const),
        todayTracked: matchedDev
          ? formatSecondsToDuration(matchedDev.todayTrackedSeconds || 0)
          : "0m",
        weekTotal: matchedDev
          ? formatSecondsToDuration(matchedDev.todayTrackedSeconds || 0)
          : "0m",
        activeApp: matchedDev ? matchedDev.currentApp : "Not reporting",
        agentVersion: matchedDev ? matchedDev.agentVersion : "v1.2.0",
      };
    });
  }, [crmStaff, employees, departments, devices]);

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
          <p className="text-[11px] text-text-muted mt-0.5">Enrolled staff accounts</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Active Agents</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          <p className="text-[11px] text-text-muted mt-0.5">Physical input detected</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Idle Workstations</p>
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
                <option value="Admin">Admin</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Placement">Placement</option>
                <option value="Operations">Operations</option>
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
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-semibold text-xs border border-indigo-200 shrink-0">
                          {emp.firstName?.[0] || "U"}
                          {emp.lastName?.[0] || ""}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-950">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[11px] text-text-muted font-mono">{emp.email}</p>
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
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
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
