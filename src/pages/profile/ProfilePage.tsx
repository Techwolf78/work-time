import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  Laptop,
  Clock,
  Download,
  Users,
  LogOut,
  Sliders,
  Building,
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
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
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

  const roleDisplayName = isSuperAdmin
    ? "Super Admin"
    : isManager
    ? "Manager"
    : "Employee";

  return (
    <div className="space-y-6">
      {/* Standard App Page Header */}
      <PageHeader
        title="My Profile"
        subtitle="View and manage your account details, corporate identity, and linked workstation endpoint."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Profile" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Personal Identity & Security */}
        <div className="space-y-6">
          {/* Card 1: Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Corporate identity details registered with Gryphon Academy
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Full Name"
                value={user?.name || ""}
                disabled
              />

              <Input
                label="Corporate Email Address"
                value={user?.email || ""}
                disabled
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Department"
                  value={department}
                  disabled
                />
                <Input
                  label="Designation / Role"
                  value={designation}
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Reporting Manager"
                  value={reportingManager}
                  disabled
                />
                <Input
                  label="Account Role"
                  value={roleDisplayName}
                  disabled
                />
              </div>

              <Input
                label="Company / Legal Entity"
                value="Gryphon Academy Pvt. Ltd."
                disabled
              />
            </CardContent>
          </Card>

          {/* Card 2: Security & Session */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Account Security</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Authentication session and sign out controls
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Authentication Provider:</span>
                  <span className="font-medium text-gray-900">Google Workspace SSO</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Session Status:</span>
                  <span className="font-medium text-gray-900">Active</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Account Status:</span>
                  <span className="font-medium text-gray-900">Active Employee</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={logout}
                  className="w-full text-xs text-rose-600 hover:bg-rose-50 border-gray-200 gap-1.5"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out of GA WORK-TIME</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Workstation Telemetry & Role Context */}
        <div className="space-y-6">
          {/* Card 3: Workstation Telemetry */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Laptop className="w-4 h-4 text-gray-800" />
                </div>
                <div>
                  <CardTitle>Workstation Endpoint</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Desktop client telemetry and presence streaming
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {myDevice ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Computer Hostname"
                      value={myDevice.hostname}
                      disabled
                    />
                    <Input
                      label="Operating System"
                      value={myDevice.os || "Windows 10/11"}
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Agent Version"
                      value={myDevice.agentVersion || "v1.2.0"}
                      disabled
                    />
                    <Input
                      label="Connection Status"
                      value={myDevice.online ? "Online (Active Tracking)" : "Offline / Standby"}
                      disabled
                    />
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Today's Tracked Time:</span>
                      <span className="font-semibold text-gray-900">
                        {formatSecondsToDuration(myDevice.todayTrackedSeconds || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Focus Score:</span>
                      <span className="font-semibold text-gray-900">
                        {myDevice.focusRatio || "100%"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Foreground Window:</span>
                      <span className="font-semibold text-gray-900 truncate max-w-[200px]" title={myDevice.currentApp}>
                        {myDevice.currentApp || "Standby"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Telemetry Heartbeat:</span>
                      <span className="font-semibold text-gray-900">
                        {myDevice.lastHeartbeat ? new Date(myDevice.lastHeartbeat).toLocaleTimeString() : "Recent"}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate("/time/timeline")}
                    className="w-full text-xs gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>View 24-Hour Activity Timeline</span>
                  </Button>
                </>
              ) : (
                <div className="py-4 space-y-4 text-center">
                  <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                    No desktop agent is currently paired with this account. Download and install GA-Work-Time to begin automated background telemetry.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setShowDownloadModal(true)}
                    className="gap-1.5 text-xs mx-auto"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Desktop Client (.exe)</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Role-Specific Management / Navigation */}
          {isManager && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle>Direct Reports ({scopedStaff.length} Members)</CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Employees reporting directly under your management
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                        <th className="py-2 px-3">Team Member</th>
                        <th className="py-2 px-3">Department</th>
                        <th className="py-2 px-3 text-right">Workstation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {scopedStaff.map((staff) => {
                        const dev = devices.find(
                          (d) => d.employeeEmail.toLowerCase() === staff.email.toLowerCase()
                        );
                        return (
                          <tr key={staff.id} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3">
                              <p className="font-semibold text-gray-900">{staff.name}</p>
                              <p className="text-[11px] text-gray-500 font-mono">{staff.email}</p>
                            </td>
                            <td className="py-2 px-3 text-gray-600">{staff.department}</td>
                            <td className="py-2 px-3 text-right text-gray-600 font-mono">
                              {dev ? (dev.online ? "Online" : "Offline") : "Unpaired"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate("/people/employees")}
                  className="w-full text-xs"
                >
                  Manage Team Directory
                </Button>
              </CardContent>
            </Card>
          )}

          {isSuperAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle>Administration Controls</CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Quick shortcuts to organization parameters
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate("/people/employees")}
                  className="w-full text-xs justify-start"
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span>Workforce & Hardware Fleet Directory</span>
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate("/admin/policies")}
                  className="w-full text-xs justify-start"
                >
                  <Sliders className="w-4 h-4 mr-2" />
                  <span>Tracking Policies & Idle Schedules</span>
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate("/admin/settings")}
                  className="w-full text-xs justify-start"
                >
                  <Building className="w-4 h-4 mr-2" />
                  <span>Company Profile & Settings</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {isEmployee && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle>Workday Navigation</CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Access your personal activity dashboard and timeline
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate("/dashboard")}
                  className="w-full text-xs justify-start"
                >
                  <span>Go to My Activity Dashboard &rarr;</span>
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate("/time/timeline")}
                  className="w-full text-xs justify-start"
                >
                  <span>Go to My 24-Hour Timeline &rarr;</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <DownloadAgentModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
}
