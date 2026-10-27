import React, { useState } from "react";
import {
  ClockAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Avatar } from "../../../components/ui/Avatar";
import { useHrms } from "../../../lib/hrmsContext";
import { useAuth } from "../../../lib/authContext";
import { AttendanceRegularization } from "../../../types/hrms";
import { formatDate, formatTime } from "../../../lib/utils";

export interface ApprovalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AttendanceRegularization | null;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onEscalate?: (id: string) => void;
}

export function ApprovalDetailsModal({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
  onEscalate,
}: ApprovalDetailsModalProps) {
  const { employees, departments, attendance } = useHrms();
  const { user } = useAuth();

  const [decisionComment, setDecisionComment] = useState("");
  const [rejectMode, setRejectMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!request) return null;

  const requester = employees.find((e) => e.id === request.employeeId);
  const dept = departments.find((d) => d.id === requester?.departmentId);
  const existingRecord = attendance.find(
    (a) => a.employeeId === request.employeeId && a.date === request.date
  );

  // Self-approval guard: Managers/Approvers cannot approve their own requests
  const isSelfRequest = requester?.id === user?.employeeId || requester?.employeeCode === user?.employeeId;

  const handleApprove = () => {
    if (isSelfRequest) {
      setErrorMessage("Policy violation: You cannot approve your own attendance regularization.");
      return;
    }
    onApprove(request.id);
    onClose();
  };

  const handleReject = () => {
    if (!decisionComment.trim()) {
      setErrorMessage("A rejection reason is mandatory.");
      return;
    }
    onReject(request.id, decisionComment.trim());
    onClose();
  };

  const handleEscalate = () => {
    if (onEscalate) {
      onEscalate(request.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance Regularization Review"
      description={`Review correction request submitted on ${formatDate(request.appliedDate)}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Self-Approval Warning */}
        {isSelfRequest && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-900">Self-Approval Prohibited by Governance Policy</p>
              <p className="text-rose-700 leading-relaxed">
                HR compliance rules prevent approving your own attendance adjustments across all system roles (Super Admin, HR Admin, Manager). You cannot approve or reject your own request.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[11px] font-mono text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                  Routed to: Secondary HR Approver / Independent Reviewer
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Requester Identity Banner */}
        <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={requester?.avatar}
              name={`${requester?.firstName || "Unknown"} ${requester?.lastName || "Employee"}`}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-950 text-sm">
                  {requester?.firstName} {requester?.lastName}
                </span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-200/70 text-gray-700">
                  {requester?.employeeCode}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {dept?.name || "Corporate Operations"} • Attendance Date: <strong className="text-gray-800">{formatDate(request.date)}</strong>
              </p>
            </div>
          </div>
          <Badge
            variant={
              request.status === "APPROVED"
                ? "success"
                : request.status === "REJECTED"
                ? "danger"
                : "warning"
            }
            size="md"
          >
            {request.status}
          </Badge>
        </div>

        {/* Comparison: Original vs Requested Correction */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Original Record */}
          <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Original Recorded Log
              </span>
              <Badge variant="neutral" size="sm">System Capture</Badge>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">First In:</span>
                <span className="font-mono font-semibold text-gray-900">
                  {existingRecord?.firstIn ? formatTime(existingRecord.firstIn) : "--:-- (Missing)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Out:</span>
                <span className="font-mono font-semibold text-gray-900">
                  {existingRecord?.lastOut ? formatTime(existingRecord.lastOut) : "--:-- (Missing)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-semibold text-gray-700">{existingRecord?.status || "ABSENT"}</span>
              </div>
            </div>
          </div>

          {/* Proposed Correction */}
          <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-emerald-200/50 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Requested Adjustment
              </span>
              <Badge variant="success" size="sm">Correction</Badge>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Correction Type:</span>
                <span className="font-semibold text-gray-900">
                  {request.missingPunchType === "IN"
                    ? "Missing Check-In"
                    : request.missingPunchType === "OUT"
                    ? "Missing Check-Out"
                    : "Missing Both Punches"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Requested Time:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatTime(request.requestedTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Calculated Status:</span>
                <span className="font-semibold text-emerald-800">PRESENT (Regularized)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reason from Employee */}
        <div className="p-3.5 bg-gray-50/60 rounded-xl border border-gray-200 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
            Employee Justification
          </span>
          <p className="text-xs text-gray-800 leading-relaxed italic">
            "{request.reason || "No written justification provided."}"
          </p>
        </div>

        {/* Decision Input if still pending (hidden if self-request) */}
        {request.status === "PENDING" && !isSelfRequest && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700">
              {rejectMode ? "Mandatory Rejection Reason" : "Reviewer Decision Notes (Optional)"}
            </label>
            <textarea
              rows={2}
              value={decisionComment}
              onChange={(e) => {
                setDecisionComment(e.target.value);
                setErrorMessage("");
              }}
              placeholder={
                rejectMode
                  ? "State the reason for rejecting this regularization (visible to employee)..."
                  : "Add administrative notes, biometric verification references, or remarks..."
              }
              className="w-full text-xs p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-950/5 focus:border-gray-900 transition-all resize-none"
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200/80">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          {request.status === "PENDING" && (
            <div className="flex items-center gap-2">
              {isSelfRequest ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted italic hidden sm:inline">
                    Self-approval locked by governance policy
                  </span>
                  <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                    Decision Locked
                  </Button>
                </div>
              ) : (
                <>
                  {onEscalate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEscalate}
                      className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                    >
                      Escalate to HR
                    </Button>
                  )}

                  {rejectMode ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRejectMode(false);
                          setErrorMessage("");
                        }}
                      >
                        Back to Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleReject}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Confirm Rejection
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRejectMode(true);
                          setErrorMessage("");
                        }}
                        className="text-rose-600 hover:bg-rose-50 border-rose-200"
                      >
                        Reject...
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleApprove}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Approve Request
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
