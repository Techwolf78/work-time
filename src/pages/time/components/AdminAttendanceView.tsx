import React, { useState, useMemo, useEffect } from "react";
import {
  Eye,
  ClockAlert,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useHrms } from "../../../lib/hrmsContext";
import { useAuth } from "../../../lib/authContext";
import { AttendanceRecord, AttendanceRegularization } from "../../../types/hrms";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Avatar } from "../../../components/ui/Avatar";
import { formatDate, formatTime } from "../../../lib/utils";
import { AttendanceRegisterTable } from "./AttendanceRegisterTable";
import { ApprovalDetailsModal } from "./ApprovalDetailsModal";
import { AttendancePolicySettingsView } from "./AttendancePolicySettingsView";
import { AttendanceSummaryStrip } from "./AttendanceSummaryStrip";

export interface AdminAttendanceViewProps {
  currentDate: string;
  onOpenTimelineModal: (record: AttendanceRecord) => void;
  onOpenCorrectionModal: (record?: AttendanceRecord) => void;
  isSuperAdmin?: boolean;
  defaultTab?: "REGISTER" | "EXCEPTIONS" | "REGULARIZATIONS" | "POLICY" | "AUDIT";
}

export function AdminAttendanceView({
  currentDate,
  onOpenTimelineModal,
  onOpenCorrectionModal,
  isSuperAdmin = false,
  defaultTab,
}: AdminAttendanceViewProps) {
  const { user } = useAuth();
  const {
    attendance,
    employees,
    departments,
    regularizations,
    approveRegularization,
    rejectRegularization,
    auditLogs,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<"REGISTER" | "EXCEPTIONS" | "REGULARIZATIONS" | "POLICY" | "AUDIT">(
    defaultTab || "REGISTER"
  );
  const [reviewingRequest, setReviewingRequest] = useState<AttendanceRegularization | null>(null);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const adminEmpId = user?.employeeId;

  // Date records
  const dateRecords = useMemo(() => {
    return attendance.filter((a) => a.date === currentDate);
  }, [attendance, currentDate]);

  // Operational Exceptions Queue (Missing In, Missing Out, Absent without leave)
  const exceptionsQueue = useMemo(() => {
    return dateRecords.filter(
      (r) =>
        r.status === "ABSENT" ||
        (!r.firstIn && r.lastOut) ||
        (r.firstIn && !r.lastOut) ||
        (r.lateMinutes > 30)
    );
  }, [dateRecords]);

  // Pending Regularization Requests
  const pendingRegularizations = useMemo(() => {
    return regularizations.filter((r) => r.status === "PENDING");
  }, [regularizations]);

  // Overall KPI counts
  const presentCount = dateRecords.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "HALF_DAY"
  ).length;
  const lateCount = dateRecords.filter((a) => a.status === "LATE").length;
  const halfDayCount = dateRecords.filter((a) => a.status === "HALF_DAY").length;
  const absentCount = dateRecords.filter((a) => a.status === "ABSENT").length;
  const leaveCount = dateRecords.filter((a) => a.status === "LEAVE").length;

  const adminMetrics = [
    { label: "Total In Scope", value: dateRecords.length },
    { label: "Present", value: presentCount, dotColor: "bg-emerald-500" },
    { label: "Late Arrivals", value: lateCount, dotColor: "bg-amber-500" },
    { label: "Half Day", value: halfDayCount, dotColor: "bg-gray-400" },
    { label: "Absent", value: absentCount, dotColor: "bg-rose-500" },
    { label: "On Leave", value: leaveCount, dotColor: "bg-blue-500" },
    {
      label: "Exceptions",
      value: exceptionsQueue.length,
      dotColor: "bg-amber-600",
      highlight: exceptionsQueue.length > 0,
    },
    {
      label: "Pending Review",
      value: pendingRegularizations.length,
      dotColor: "bg-purple-600",
      highlight: pendingRegularizations.length > 0,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Register View */}
      {activeTab === "REGISTER" && (
        <div className="space-y-4">
          <AttendanceSummaryStrip metrics={adminMetrics} />
          <AttendanceRegisterTable
            records={dateRecords}
            onOpenTimeline={onOpenTimelineModal}
            onOpenCorrection={onOpenCorrectionModal}
            canCorrect={true}
            canExport={true}
            showFilters={true}
            customTitle={`Attendance Register (${formatDate(currentDate)})`}
          />
        </div>
      )}

      {/* Exception Queue Tab */}
      {activeTab === "EXCEPTIONS" && (
        <div className="bg-white rounded-card border border-surface-border shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-text-primary">
                Daily Attendance Exceptions ({exceptionsQueue.length})
              </span>
              <p className="text-[11px] text-text-muted mt-0.5">
                Missing punch events, excessive late arrivals (&gt;30m), and unregularized absences for {formatDate(currentDate)}
              </p>
            </div>
            <Badge variant="warning" size="sm">
              {exceptionsQueue.length} Unresolved
            </Badge>
          </div>

          <div className="divide-y divide-surface-border">
            {exceptionsQueue.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-60" />
                <p className="font-medium text-text-primary">No exceptions</p>
                <p className="mt-0.5 text-text-secondary">All attendance records for this date are reconciled.</p>
              </div>
            ) : (
              exceptionsQueue.map((rec) => {
                const emp = employees.find((e) => e.id === rec.employeeId);
                const dept = departments.find((d) => d.id === emp?.departmentId);

                const exceptionReason =
                  rec.status === "ABSENT"
                    ? "Full Day Absent (No sensor punches recorded)"
                    : !rec.firstIn
                    ? "Missing Check-In Record"
                    : !rec.lastOut
                    ? "Missing Check-Out Record"
                    : rec.lateMinutes > 30
                    ? `Excessive Late Arrival (+${rec.lateMinutes} mins)`
                    : "Punch Discrepancy";

                return (
                  <div
                    key={rec.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-subtle/40 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar
                        src={emp?.avatar}
                        name={`${emp?.firstName || ""} ${emp?.lastName || ""}`}
                        size="sm"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-text-primary">
                            {emp?.firstName} {emp?.lastName}
                          </span>
                          <span className="text-[10px] font-mono text-text-secondary">
                            {emp?.employeeCode}
                          </span>
                          <span className="text-text-muted text-xs">· {dept?.name || "Corporate"}</span>
                        </div>
                        <p className="text-xs font-medium text-rose-700 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{exceptionReason}</span>
                        </p>
                        <p className="text-[11px] text-text-muted font-mono tabular-nums">
                          In: {rec.firstIn ? formatTime(rec.firstIn) : "--:--"} · Out:{" "}
                          {rec.lastOut ? formatTime(rec.lastOut) : "--:--"} · Logged: {rec.workingHours}h
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => onOpenTimelineModal(rec)}
                        className="h-7 px-2.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded transition-colors"
                      >
                        Punches
                      </button>
                      <Button
                        onClick={() => onOpenCorrectionModal(rec)}
                        variant="primary"
                        size="sm"
                        className="h-7 text-xs font-medium"
                      >
                        Correct Record
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Regularizations Tab */}
      {activeTab === "REGULARIZATIONS" && (
        <div className="bg-white rounded-card border border-surface-border shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">
              All Regularization Requests ({regularizations.length})
            </span>
            <span className="text-[11px] text-text-secondary">
              {pendingRegularizations.length} pending review
            </span>
          </div>

          <div className="divide-y divide-surface-border">
            {regularizations.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-xs">
                No regularization requests filed.
              </div>
            ) : (
              regularizations.map((reg) => {
                const emp = employees.find((e) => e.id === reg.employeeId);
                const isSelf = reg.employeeId === adminEmpId;

                return (
                  <div
                    key={reg.id}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isSelf ? "bg-rose-50/30 border-l-2 border-l-rose-500 hover:bg-rose-50/50" : "hover:bg-surface-subtle/40"
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
                          <Badge
                            variant={
                              reg.status === "APPROVED"
                                ? "success"
                                : reg.status === "REJECTED"
                                ? "danger"
                                : "warning"
                            }
                            size="sm"
                          >
                            {reg.status}
                          </Badge>
                          {isSelf && (
                            <span className="text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                              Self-Request · Self-Approval Prohibited
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">
                          Date: <strong className="text-text-primary">{formatDate(reg.date)}</strong> · Requested:{" "}
                          <strong className="text-text-primary font-mono">
                            {reg.missingPunchType} at {formatTime(reg.requestedTime)}
                          </strong>
                        </p>
                        <p className="text-xs text-text-muted italic">
                          "{reg.reason}"
                        </p>
                        {reg.comments && (
                          <p className="text-xs text-text-secondary bg-surface-subtle px-2 py-0.5 rounded inline-block">
                            Decision note: {reg.comments} (by {reg.approvedBy || "Admin"})
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        onClick={() => setReviewingRequest(reg)}
                        variant={isSelf ? "outline" : reg.status === "PENDING" ? "primary" : "outline"}
                        size="sm"
                        className={`h-7 text-xs font-medium ${isSelf ? "text-rose-700 border-rose-200 hover:bg-rose-50" : ""}`}
                      >
                        {isSelf ? "Review (Locked)" : reg.status === "PENDING" ? "Review & Decide" : "View Details"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Policy & Compliance Tab */}
      {activeTab === "POLICY" && <AttendancePolicySettingsView />}

      {/* Audit History Tab */}
      {activeTab === "AUDIT" && (
        <div className="bg-white rounded-card border border-surface-border shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">
              Attendance Modification & Decision Audit Trail
            </span>
            <span className="text-[11px] text-text-muted font-mono">
              Immutable System Log
            </span>
          </div>

          <div className="divide-y divide-surface-border text-xs">
            {auditLogs
              .filter((log) => log.module === "ATTENDANCE" || log.action.toLowerCase().includes("attendance") || log.action.toLowerCase().includes("regularization"))
              .slice(0, 15)
              .map((log) => (
                <div key={log.id} className="p-3 flex items-start justify-between gap-3 hover:bg-surface-subtle/30">
                  <div>
                    <span className="font-medium text-text-primary block">{log.action}</span>
                    <span className="text-text-secondary text-[11px] mt-0.5 block">{log.details}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-text-muted font-mono block">{log.timestamp}</span>
                    <span className="text-[10px] text-text-secondary">{log.userName}</span>
                  </div>
                </div>
              ))}
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
      />
    </div>
  );
}
