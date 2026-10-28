import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Building2,
  Shield,
  Laptop,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  LogOut,
  Download,
  Users,
  Activity,
  Briefcase,
  Monitor,
  Eye,
  EyeOff,
  Cpu,
  Layers,
} from "lucide-react";
import { useAuth } from "../../lib/authContext";
import { useRbacScope } from "../../lib/rbacScope";
import {
  fetchCrmEmployees,
  subscribeToTelemetryDevices,
  formatSecondsToDuration,
  CrmEmployeeSummary,
  TelemetryDevice,
} from "../../lib/telemetryService";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";
import { DownloadAgentModal } from "../../components/layout/DownloadAgentModal";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [crmStaff, setCrmStaff] = useState<CrmEmployeeSummary[]>([]);
  const [devices, setDevices] = useState<TelemetryDevice[]>([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    fetchCrmEmployees().then(setCrmStaff);
    const unsub = subscribeToTelemetryDevices(setDevices);
    return () => unsub();
  }, []);

  const { isSuperAdmin, isManager, isEmployee, scopedStaff } = useRbacScope(crmStaff, devices);

  const userEmail = (user?.email || "").trim().toLowerCase();

  // Find user's CRM profile record
  const crmRecord = useMemo(() => {
    return crmStaff.find((s) => s.email.trim().toLowerCase() === userEmail);
  }, [crmStaff, userEmail]);

  // Find user's paired telemetry device
  const myDevice = useMemo(() => {
    return devices.find(
      (d) =>
        d.employeeEmail.trim().toLowerCase() === userEmail ||
        (user?.employeeId && d.employeeId === user.employeeId)
    );
  }, [devices, userEmail, user?.employeeId]);

  const reportingManager = crmRecord?.reportingManager || "Executive Leadership";
  const department = crmRecord?.department || user?.department || "Operations";
  const designation = crmRecord?.designation || crmRecord?.role || user?.crmOriginalRole || "Staff";

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Profile Hero Card */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-neutral-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-2xl shadow-lg ring-4 ring-white/10 shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {user?.name || "Corporate User"}
                </h1>
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider border",
                    isSuperAdmin
                      ? "bg-purple-950/80 text-purple-300 border-purple-700/50"
                      : isManager
                      ? "bg-indigo-950/80 text-indigo-300 border-indigo-700/50"
                      : "bg-emerald-950/80 text-emerald-300 border-emerald-700/50"
                  )}
                >
                  {isSuperAdmin ? "Super Admin" : isManager ? "Team Manager" : "Employee"}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Account
                </span>
              </div>
              <p className="text-sm text-neutral-400 font-mono flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                {user?.email}
              </p>
              <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                  {department}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-neutral-500" />
                  {designation}
                </span>
                <span>•</span>
                <span>Gryphon Academy Pvt. Ltd.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white text-xs gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Workstation Status Banner */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                myDevice
                  ? myDevice.online
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-gray-100 text-gray-500 border-gray-200"
                  : "bg-amber-50 text-amber-600 border-amber-200"
              )}
            >
              <Monitor className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-950">
                  {myDevice ? `Workstation: ${myDevice.hostname}` : "No Workstation Linked Yet"}
                </h3>
                {myDevice && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                      myDevice.online
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        myDevice.online ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                      )}
                    />
                    {myDevice.online ? "Agent Online" : "Agent Standby"}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">
                {myDevice
                  ? `${myDevice.os || "Windows 10/11"} • Client ${myDevice.agentVersion || "v1.2.0"} • Current: ${myDevice.currentApp || "Standby"}`
                  : "Download and pair the Windows GA-Work-Time agent to start automated time tracking."}
              </p>
              {myDevice && (
                <div className="flex items-center gap-4 text-xs font-mono text-gray-600 pt-1">
                  <span>Today's Tracked: <strong>{formatSecondsToDuration(myDevice.todayTrackedSeconds || 0)}</strong></span>
                  <span>•</span>
                  <span>Focus: <strong>{myDevice.focusRatio || "100%"}</strong></span>
                  <span>•</span>
                  <span>Last Seen: {myDevice.lastHeartbeat ? new Date(myDevice.lastHeartbeat).toLocaleTimeString() : "Recent"}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!myDevice ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowDownloadModal(true)}
                className="gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download Agent .exe
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/time/timeline")}
                className="gap-1.5 text-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                View 24h Timeline
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 3. Role-Specific Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Employment & Identity Details */}
        <Card className="p-5 space-y-4 lg:col-span-1">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <User className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-950">Employee Information</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-text-muted font-medium">Full Name</p>
              <p className="font-semibold text-gray-900 mt-0.5">{user?.name || "N/A"}</p>
            </div>

            <div>
              <p className="text-text-muted font-medium">Corporate Email</p>
              <p className="font-semibold text-gray-900 font-mono mt-0.5">{user?.email}</p>
            </div>

            <div>
              <p className="text-text-muted font-medium">Department</p>
              <p className="font-semibold text-gray-900 mt-0.5">{department}</p>
            </div>

            <div>
              <p className="text-text-muted font-medium">Job Designation / Role</p>
              <p className="font-semibold text-gray-900 mt-0.5">{designation}</p>
            </div>

            <div>
              <p className="text-text-muted font-medium">Reporting Manager</p>
              <p className="font-semibold text-gray-900 mt-0.5">{reportingManager}</p>
            </div>

            <div>
              <p className="text-text-muted font-medium">System Access Level</p>
              <p className="font-semibold text-indigo-700 mt-0.5">
                {isSuperAdmin
                  ? "Global Organization Administrator"
                  : isManager
                  ? "Team Management & Supervision"
                  : "Individual Contributor"}
              </p>
            </div>
          </div>
        </Card>

        {/* Right Columns: Scope, Privileges & Capabilities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Super Admin Privileges */}
          {isSuperAdmin && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-950">
                    Administrator Scope & Controls
                  </h3>
                </div>
                <Badge variant="purple">Full Org Access</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80 space-y-1">
                  <p className="font-semibold text-gray-900">Workforce & Hardware Fleet</p>
                  <p className="text-text-muted">
                    Manage all 25 registered employees and enrolled Windows desktop workstations.
                  </p>
                  <button
                    onClick={() => navigate("/people/employees")}
                    className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    View Directory &rarr;
                  </button>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80 space-y-1">
                  <p className="font-semibold text-gray-900">Tracking Policies & Rules</p>
                  <p className="text-text-muted">
                    Configure company-wide idle threshold (5 min), active window polling, and break rules.
                  </p>
                  <button
                    onClick={() => navigate("/admin/policies")}
                    className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    View Policies &rarr;
                  </button>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80 space-y-1">
                  <p className="font-semibold text-gray-900">Application Usage Analytics</p>
                  <p className="text-text-muted">
                    Org-wide categorization of productivity software, browsers, and background tools.
                  </p>
                  <button
                    onClick={() => navigate("/time/apps")}
                    className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    App Analytics &rarr;
                  </button>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80 space-y-1">
                  <p className="font-semibold text-gray-900">Exportable Reports</p>
                  <p className="text-text-muted">
                    Generate daily summaries, endpoint utilization stats, and CSV audit logs.
                  </p>
                  <button
                    onClick={() => navigate("/reports")}
                    className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    Open Reports &rarr;
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Manager Privileges & Team Members */}
          {isManager && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-gray-950">
                    Your Monitored Team ({scopedStaff.length} Members)
                  </h3>
                </div>
                <Badge variant="cyan">Manager Scoped</Badge>
              </div>

              <p className="text-xs text-text-muted">
                As a manager, your telemetry access is strictly scoped to yourself and your direct reporting employees.
              </p>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                {scopedStaff.map((staff) => {
                  const dev = devices.find(
                    (d) => d.employeeEmail.toLowerCase() === staff.email.toLowerCase()
                  );
                  return (
                    <div
                      key={staff.id}
                      className="p-3 bg-white flex items-center justify-between text-xs hover:bg-gray-50/70 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{staff.name}</p>
                        <p className="text-text-muted font-mono text-[11px]">{staff.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-500 font-medium">{staff.department}</span>
                        {dev ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                              dev.online
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                dev.online ? "bg-emerald-500" : "bg-gray-400"
                              )}
                            />
                            {dev.online ? "Online" : "Offline"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium">Awaiting Agent</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/people/employees")}
                  className="text-xs"
                >
                  Manage Team
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/time/timeline")}
                  className="text-xs"
                >
                  View Team Timeline
                </Button>
              </div>
            </Card>
          )}

          {/* Employee Focus & Privacy Notice */}
          {isEmployee && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-950">
                    Personal Workday Tracking
                  </h3>
                </div>
                <Badge variant="neutral">Individual Contributor</Badge>
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                Your computer activity is autonomously recorded by the lightweight Windows desktop agent. You can review your daily tracked hours, active application breakdown, and break durations directly on your personal dashboard and timeline.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-950 text-xs">
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    What Is Monitored
                  </div>
                  <ul className="text-[11px] text-emerald-900 space-y-0.5 list-disc list-inside">
                    <li>Active foreground window title & app name</li>
                    <li>Keyboard/mouse idle periods (&gt; 5 min)</li>
                    <li>Windows session lock & unlock timestamps</li>
                  </ul>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 text-xs">
                    <EyeOff className="w-3.5 h-3.5 text-neutral-700" />
                    What Is NEVER Monitored
                  </div>
                  <ul className="text-[11px] text-neutral-600 space-y-0.5 list-disc list-inside">
                    <li>Zero keystroke or keyboard logging</li>
                    <li>Zero screen recordings or screenshots</li>
                    <li>Zero webcam or audio capture</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="text-xs"
                >
                  Go to My Activity Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/time/timeline")}
                  className="text-xs"
                >
                  View 24-Hour Timeline
                </Button>
              </div>
            </Card>
          )}

          {/* Security & Authentication Card */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Lock className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-950">Security & Authentication</h3>
            </div>
            <div className="text-xs text-text-muted space-y-1.5">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="font-medium text-gray-700">Identity Provider:</span>
                <span className="font-mono text-gray-900">Gryphon Academy Google Workspace SSO</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="font-medium text-gray-700">Session Security:</span>
                <span className="text-emerald-700 font-semibold">Active & Encrypted</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium text-gray-700">Client Agent:</span>
                <span className="font-mono text-gray-900">GA-Work-Time v1.2.0</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <DownloadAgentModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
}
