import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Radio,
  Users,
  Filter,
  CheckCircle2,
  RefreshCw,
  Search,
  Laptop,
  Clock,
  AppWindow,
  Shield,
  Activity,
  Coffee,
} from "lucide-react";
import { Input } from "../../components/ui/Input";
import { useHrms } from "../../lib/hrmsContext";
import {
  subscribeToTelemetryDevices,
  formatSecondsToDuration,
  TelemetryDevice,
} from "../../lib/telemetryService";

export function TeamLiveActivityPage() {
  const { employees, departments } = useHrms();
  const [devices, setDevices] = useState<TelemetryDevice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "idle" | "offline">("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to live Firestore timetrack_devices
  useEffect(() => {
    const unsubscribe = subscribeToTelemetryDevices((fetchedDevices) => {
      setDevices(fetchedDevices);
    });
    return () => unsubscribe();
  }, []);

  // Merge enrolled devices with employees
  const staffMembers = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      email: string;
      department: string;
      hostname: string;
      os: string;
      agentVersion: string;
      status: "active" | "idle" | "offline";
      currentApp: string;
      windowTitle: string;
      trackedSeconds: number;
      idleSeconds: number;
      focusRatio: string;
      lastHeartbeat: string;
      online: boolean;
    }> = [];

    // Map existing devices
    devices.forEach((dev) => {
      list.push({
        id: dev.deviceId || dev.id,
        name: dev.employeeName || dev.hostname || "Workstation",
        email: dev.employeeEmail || "agent@workstation.local",
        department: dev.department || "Operations",
        hostname: dev.hostname || dev.deviceId,
        os: dev.os || "Windows 11",
        agentVersion: dev.agentVersion || "v1.2.0",
        status: dev.online ? dev.status : "offline",
        currentApp: dev.currentApp || "System",
        windowTitle: dev.windowTitle || "Foreground focus",
        trackedSeconds: dev.todayTrackedSeconds || 0,
        idleSeconds: dev.todayIdleSeconds || 0,
        focusRatio: dev.focusRatio || "100%",
        lastHeartbeat: dev.lastHeartbeat,
        online: dev.online,
      });
    });

    // Add employees who don't have an enrolled device yet as offline
    employees.forEach((emp) => {
      const empName = `${emp.firstName} ${emp.lastName}`.trim();
      const deptName =
        departments.find((d) => d.id === emp.departmentId)?.name || "Staff";

      const alreadyAdded = list.some(
        (m) =>
          m.email.toLowerCase() === emp.email.toLowerCase() ||
          m.name.toLowerCase() === empName.toLowerCase()
      );
      if (!alreadyAdded) {
        list.push({
          id: emp.id,
          name: empName,
          email: emp.email,
          department: deptName,
          hostname: "Unlinked PC",
          os: "Windows",
          agentVersion: "—",
          status: "offline",
          currentApp: "Offline",
          windowTitle: "Agent not connected",
          trackedSeconds: 0,
          idleSeconds: 0,
          focusRatio: "—",
          lastHeartbeat: "",
          online: false,
        });
      }
    });

    return list;
  }, [devices, employees, departments]);

  // KPIs
  const activeCount = staffMembers.filter((m) => m.status === "active").length;
  const idleCount = staffMembers.filter((m) => m.status === "idle").length;
  const offlineCount = staffMembers.filter((m) => m.status === "offline").length;
  const totalMonitored = staffMembers.length;

  // Filtered members
  const filteredStaff = useMemo(() => {
    return staffMembers.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.currentApp.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || m.status === statusFilter;

      const matchesDept =
        deptFilter === "all" || m.department.toLowerCase() === deptFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [staffMembers, searchQuery, statusFilter, deptFilter]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    staffMembers.forEach((m) => {
      if (m.department) depts.add(m.department);
    });
    return Array.from(depts);
  }, [staffMembers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Team Activity & Pulse"
        subtitle="Real-time device utilization and current foreground tool overview across all team members."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Workforce" },
          { label: "Live Team Activity" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{activeCount} / {totalMonitored} Active Online</span>
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh Pulse</span>
            </Button>
          </div>
        }
      />

      {/* Real-time KPI summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card
          onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
          className={`p-3.5 border transition-all cursor-pointer ${
            statusFilter === "active"
              ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200"
              : "bg-emerald-50/30 border-emerald-200/50 hover:bg-emerald-50/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-emerald-800 font-semibold">Active Right Now</p>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-emerald-950 mt-1">{activeCount}</p>
          <p className="text-[10px] text-emerald-700 mt-0.5">Typing or focused in app</p>
        </Card>

        <Card
          onClick={() => setStatusFilter(statusFilter === "idle" ? "all" : "idle")}
          className={`p-3.5 border transition-all cursor-pointer ${
            statusFilter === "idle"
              ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-200"
              : "bg-amber-50/30 border-amber-200/50 hover:bg-amber-50/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-amber-800 font-semibold">Idle / Away on Break</p>
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-950 mt-1">{idleCount}</p>
          <p className="text-[10px] text-amber-700 mt-0.5">No input &gt; 5 minutes</p>
        </Card>

        <Card
          onClick={() => setStatusFilter(statusFilter === "offline" ? "all" : "offline")}
          className={`p-3.5 border transition-all cursor-pointer ${
            statusFilter === "offline"
              ? "bg-gray-100 border-gray-400 ring-2 ring-gray-300"
              : "bg-gray-50 border-gray-200 hover:bg-gray-100/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-700 font-semibold">Offline / Shift Over</p>
            <span className="w-2 h-2 rounded-full bg-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{offlineCount}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Workstation closed / off</p>
        </Card>

        <Card className="p-3.5 bg-indigo-50/30 border-indigo-200/50">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-indigo-800 font-semibold">Total Monitored Fleet</p>
            <Laptop className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-950 mt-1">{totalMonitored}</p>
          <p className="text-[10px] text-indigo-700 mt-0.5">Enrolled endpoints</p>
        </Card>
      </div>

      {/* Main Grid View */}
      <Card>
        {/* Controls Bar */}
        <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-sm w-full">
            <Input
              placeholder="Search staff, app, or computer hostname..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs"
              leftIcon={<Search className="w-3.5 h-3.5 text-text-muted" />}
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant={deptFilter === "all" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setDeptFilter("all")}
            >
              All Teams
            </Button>
            {uniqueDepartments.slice(0, 4).map((d) => (
              <Button
                key={d}
                variant={deptFilter === d ? "primary" : "secondary"}
                size="sm"
                onClick={() => setDeptFilter(d)}
              >
                {d}
              </Button>
            ))}
          </div>
        </div>

        {/* Real-time Workforce Presence Grid */}
        <div className="p-5">
          {filteredStaff.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    staff.status === "active"
                      ? "bg-white border-emerald-200 shadow-xs hover:border-emerald-300"
                      : staff.status === "idle"
                      ? "bg-white border-amber-200 shadow-xs hover:border-amber-300"
                      : "bg-gray-50/70 border-gray-200 opacity-80"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {staff.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-text-primary text-xs truncate">
                          {staff.name}
                        </p>
                        <p className="text-[11px] text-text-muted truncate">
                          {staff.email}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {staff.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE
                      </span>
                    ) : staff.status === "idle" ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        ON BREAK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        OFFLINE
                      </span>
                    )}
                  </div>

                  {/* Workstation & Live App Chip */}
                  <div className="p-2.5 bg-gray-50/80 rounded-lg border border-gray-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span className="flex items-center gap-1">
                        <Laptop className="w-3 h-3 text-gray-500" />
                        <span>{staff.hostname}</span>
                      </span>
                      <span>{staff.department}</span>
                    </div>

                    <div className="pt-1 border-t border-gray-200/60 flex items-center justify-between gap-2">
                      <span className="font-medium text-text-primary text-[11px] truncate flex items-center gap-1.5">
                        <AppWindow className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{staff.currentApp}</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-white border border-emerald-200 rounded px-1.5 py-0.2 shrink-0">
                        {staff.focusRatio} Focus
                      </span>
                    </div>

                    {staff.windowTitle && (
                      <p className="text-[10px] text-text-muted truncate pt-0.5" title={staff.windowTitle}>
                        {staff.windowTitle}
                      </p>
                    )}
                  </div>

                  {/* Day Progress Strip */}
                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                    <span className="flex items-center gap-1 text-text-primary font-medium">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span>{formatSecondsToDuration(staff.trackedSeconds)} Tracked</span>
                    </span>
                    <span>
                      Idle: {formatSecondsToDuration(staff.idleSeconds)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-text-muted space-y-2">
              <Users className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="font-semibold text-text-primary">No team members match this filter</p>
              <p className="text-text-muted text-[11px]">
                Try adjusting your search query or department filter.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
