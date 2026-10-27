import React, { useState, useMemo, useEffect } from "react";
import {
  ClockAlert,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { useHrms } from "../../../lib/hrmsContext";
import { useAuth } from "../../../lib/authContext";
import {
  AttendanceRecord,
  AttendanceRegularization,
} from "../../../types/hrms";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Avatar } from "../../../components/ui/Avatar";
import { formatDate, formatTime } from "../../../lib/utils";
import { AttendanceRegisterTable } from "./AttendanceRegisterTable";
import { ApprovalDetailsModal } from "./ApprovalDetailsModal";
import { AttendanceSummaryStrip } from "./AttendanceSummaryStrip";

export interface ManagerAttendanceViewProps {
  currentDate: string;
  onOpenTimelineModal: (record: AttendanceRecord) => void;
  onOpenCorrectionModal: (record: AttendanceRecord) => void;
  defaultTab?: "REGISTER" | "APPROVALS";
}

export function ManagerAttendanceView({
  currentDate,
  onOpenTimelineModal,
  onOpenCorrectionModal,
  defaultTab,
}: ManagerAttendanceViewProps) {
  const { user } = useAuth();
  const {
    attendance,
    employees,
    regularizations,
    approveRegularization,
    rejectRegularization,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<"REGISTER" | "APPROVALS">(
    defaultTab || "REGISTER",
  );
  const [reviewingRequest, setReviewingRequest] =
    useState<AttendanceRegularization | null>(null);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const managerEmpId = user?.employeeId || "EMP-1003";

  // Team scope: Employees where managerId === managerEmpId OR in the manager's department (excluding self)
  const myTeamEmployees = useMemo(() => {
    const manager = employees.find(
      (e) => e.id === managerEmpId || e.employeeCode === managerEmpId,
    );
    return employees.filter(
      (e) =>
        e.id !== manager?.id &&
        (e.managerId === managerEmpId ||
          (manager && e.departmentId === manager.departmentId)),
    );
  }, [employees, managerEmpId]);

  const teamEmpIds = useMemo(
    () => new Set(myTeamEmployees.map((e) => e.id)),
    [myTeamEmployees],
  );

  // Team attendance records for currentDate
  const teamDateRecords = useMemo(() => {
    return attendance.filter(
      (a) => a.date === currentDate && teamEmpIds.has(a.employeeId),
    );
  }, [attendance, currentDate, teamEmpIds]);

  // Team pending regularization requests (including self-requests tagged for compliance)
  const teamPendingRegularizations = useMemo(() => {
    return regularizations.filter(
      (r) =>
        (teamEmpIds.has(r.employeeId) || r.employeeId === managerEmpId) &&
        r.status === "PENDING",
    );
  }, [regularizations, teamEmpIds, managerEmpId]);

  // Team stats for date
  const teamPresent = teamDateRecords.filter(
    (a) =>
      a.status === "PRESENT" || a.status === "LATE" || a.status === "HALF_DAY",
  ).length;
  const teamLate = teamDateRecords.filter((a) => a.status === "LATE").length;
  const teamAbsent = teamDateRecords.filter(
    (a) => a.status === "ABSENT",
  ).length;
  const teamLeave = teamDateRecords.filter((a) => a.status === "LEAVE").length;

  const teamMetrics = [
    { label: "Assigned Team", value: myTeamEmployees.length },
    { label: "Present", value: teamPresent, dotColor: "bg-emerald-500" },
    { label: "Late Arrivals", value: teamLate, dotColor: "bg-amber-500" },
    { label: "Absent", value: teamAbsent, dotColor: "bg-rose-500" },
    { label: "On Leave", value: teamLeave, dotColor: "bg-blue-500" },
    {
      label: "Pending Approvals",
      value: teamPendingRegularizations.length,
      dotColor: "bg-purple-500",
      highlight: teamPendingRegularizations.length > 0,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Register View */}
      {activeTab === "REGISTER" && (
        <div className="space-y-4">
          <AttendanceSummaryStrip metrics={teamMetrics} />
          <AttendanceRegisterTable
            records={teamDateRecords}
            onOpenTimeline={onOpenTimelineModal}
            onOpenCorrection={onOpenCorrectionModal}
            canCorrect={true}
            canExport={true}
            showFilters={true}
            customTitle={`Team Attendance (${formatDate(currentDate)})`}
          />
        </div>
      )}

      {/* Approvals View */}
      {activeTab === "APPROVALS" && (
        <div className="bg-white rounded-card border border-surface-border shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-text-primary">
                Regularization Requests Awaiting Decision (
                {teamPendingRegularizations.length})
              </span>
              <p className="text-[11px] text-text-muted mt-0.5">
                Inspect requested punch modifications and submit approval
                decisions
              </p>
            </div>
          </div>

          <div className="divide-y divide-surface-border">
            {teamPendingRegularizations.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-60" />
                <p className="font-medium text-text-primary">All caught up</p>
                <p className="mt-0.5 text-text-secondary">
                  No pending regularization requests from your team.
                </p>
              </div>
            ) : (
              teamPendingRegularizations.map((reg) => {
                const emp = employees.find((e) => e.id === reg.employeeId);
                const isSelf = reg.employeeId === managerEmpId;

                return (
                  <div
                    key={reg.id}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isSelf
                        ? "bg-rose-50/30 border-l-2 border-l-rose-500 hover:bg-rose-50/50"
                        : "hover:bg-surface-subtle/40"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar
                        src={emp?.avatar}
                        name={`${emp?.firstName || ""} ${emp?.lastName || ""}`}
                        size="sm"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-text-primary">
                            {emp?.firstName} {emp?.lastName}
                          </span>
                          <span className="text-[10px] font-mono text-text-secondary">
                            {emp?.employeeCode}
                          </span>
                          <Badge variant="warning" size="sm">
                            Pending
                          </Badge>
                          {isSelf && (
                            <span className="text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                              Self-Request · Self-Approval Prohibited
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">
                          Date:{" "}
                          <strong className="text-text-primary">
                            {formatDate(reg.date)}
                          </strong>{" "}
                          · Requested:{" "}
                          <strong className="text-text-primary font-mono">
                            {reg.missingPunchType} at{" "}
                            {formatTime(reg.requestedTime)}
                          </strong>
                        </p>
                        <p className="text-xs text-text-muted italic">
                          "{reg.reason}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        onClick={() => setReviewingRequest(reg)}
                        variant={isSelf ? "outline" : "primary"}
                        size="sm"
                        className={`h-7 text-xs font-medium ${isSelf ? "text-rose-700 border-rose-200 hover:bg-rose-50" : ""}`}
                        leftIcon={<Eye className="w-3 h-3" />}
                      >
                        {isSelf ? "Review (Locked)" : "Review & Decide"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Approval Details Modal */}
      <ApprovalDetailsModal
        isOpen={!!reviewingRequest}
        onClose={() => setReviewingRequest(null)}
        request={reviewingRequest}
        onApprove={approveRegularization}
        onReject={rejectRegularization}
        onEscalate={(id) => {
          rejectRegularization(
            id,
            "Escalated to HR Operations for secondary biometric check.",
          );
        }}
      />
    </div>
  );
}
