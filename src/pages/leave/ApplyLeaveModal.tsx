import React, { useState, useMemo, useRef, useEffect } from "react";
import { Paperclip, X, AlertCircle } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useHrms } from "../../lib/hrmsContext";
import { useAuth } from "../../lib/authContext";
import { useToast } from "../../lib/toastContext";
import { cn } from "../../lib/utils";

export interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LeaveDuration = "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";

interface UploadedFile {
  name: string;
  size: number;
}

export function ApplyLeaveModal({ isOpen, onClose }: ApplyLeaveModalProps) {
  const { leaveTypes, employees, applyLeave, leaveRequests, uploadDocument } = useHrms();
  const { user } = useAuth();
  const { error: toastError } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTodayStr = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayStr = getTodayStr();

  // State
  const [employeeId, setEmployeeId] = useState(user?.employeeId || employees[0]?.id || "EMP-1001");
  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id || "lt-cl");
  const [duration, setDuration] = useState<LeaveDuration>("FULL_DAY");
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<UploadedFile | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  useEffect(() => {
    if (user?.employeeId) {
      setEmployeeId(user.employeeId);
    }
  }, [user]);

  const selectedPolicy = useMemo(() => {
    return leaveTypes.find((t) => t.id === leaveTypeId) || leaveTypes[0];
  }, [leaveTypes, leaveTypeId]);

  // Quota calculation
  const { availableQuota } = useMemo(() => {
    if (!selectedPolicy) return { availableQuota: 0 };
    const used = leaveRequests
      .filter(
        (l) =>
          l.employeeId === employeeId &&
          l.leaveTypeId === selectedPolicy.id &&
          l.status === "APPROVED"
      )
      .reduce((sum, l) => sum + (l.days || 0), 0);
    return { availableQuota: Math.max(0, selectedPolicy.annualQuota - used) };
  }, [leaveRequests, employeeId, selectedPolicy]);

  // Working days calculation
  const requestedDays = useMemo(() => {
    if (duration !== "FULL_DAY") return 0.5;
    try {
      const d1 = new Date(fromDate);
      const d2 = new Date(toDate);
      if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return 0;
      let count = 0;
      const cur = new Date(d1);
      while (cur <= d2) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
        cur.setDate(cur.getDate() + 1);
      }
      return count > 0 ? count : 1;
    } catch {
      return 1;
    }
  }, [duration, fromDate, toDate]);

  const projectedBalance = availableQuota - requestedDays;

  const isDirty = useMemo(() => {
    return reason.trim().length > 0 || attachment !== null || fromDate !== todayStr || duration !== "FULL_DAY";
  }, [reason, attachment, fromDate, duration, todayStr]);

  const handleClose = () => {
    if (isDirty) {
      setShowConfirmDiscard(true);
    } else {
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setReason("");
    setAttachment(null);
    setDuration("FULL_DAY");
    setFromDate(todayStr);
    setToDate(todayStr);
    setErrorMessage("");
    setIsSubmitting(false);
    onClose();
  };

  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    setErrorMessage("");
    if (duration !== "FULL_DAY" || toDate < val) {
      setToDate(val);
    }
  };

  const handleToDateChange = (val: string) => {
    if (val < fromDate) {
      setErrorMessage("End date cannot be earlier than start date.");
    } else {
      setErrorMessage("");
    }
    setToDate(val);
  };

  const handleDurationChange = (type: LeaveDuration) => {
    setDuration(type);
    if (type !== "FULL_DAY") {
      setToDate(fromDate);
    }
    setErrorMessage("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Attachment size exceeds 5MB limit.");
        return;
      }
      setAttachment({ name: file.name, size: file.size });
      setErrorMessage("");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setErrorMessage("Please enter a brief reason for your leave.");
      return;
    }

    if (duration === "FULL_DAY" && toDate < fromDate) {
      setErrorMessage("End date cannot be earlier than start date.");
      return;
    }

    setIsSubmitting(true);

    try {
      const isHalf = duration !== "FULL_DAY";
      const session = duration === "FIRST_HALF" ? "MORNING" : duration === "SECOND_HALF" ? "AFTERNOON" : undefined;

      applyLeave({
        employeeId,
        leaveTypeId: selectedPolicy?.id || leaveTypeId,
        fromDate,
        toDate: isHalf ? fromDate : toDate,
        days: requestedDays,
        isHalfDay: isHalf,
        halfDaySession: session,
        reason: reason.trim(),
      });

      if (attachment) {
        uploadDocument(
          {
            employeeId,
            title: `Leave Support - ${attachment.name}`,
            category: "OTHER",
            fileSize: formatFileSize(attachment.size),
            fileType: attachment.name.split(".").pop()?.toUpperCase() || "PDF",
          },
          { silent: true }
        );
      }

      resetAndClose();
    } catch {
      toastError("Failed to submit leave request.");
      setIsSubmitting(false);
    }
  };

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "HR_ADMIN";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="md"
        title="Apply for Leave"
        description="Submit a leave request for manager review and approval."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Admin employee selector */}
          {isAdmin && employees.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Applying on behalf of
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-950"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Leave Type Selector (Segmented Cards) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Leave Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {leaveTypes.map((type) => {
                const isSelected = type.id === selectedPolicy?.id;
                const used = leaveRequests
                  .filter(
                    (l) =>
                      l.employeeId === employeeId &&
                      l.leaveTypeId === type.id &&
                      l.status === "APPROVED"
                  )
                  .reduce((sum, l) => sum + (l.days || 0), 0);
                const remaining = Math.max(0, type.annualQuota - used);

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setLeaveTypeId(type.id)}
                    className={cn(
                      "p-2.5 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-gray-950 bg-gray-950 text-white shadow-xs"
                        : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="text-xs font-semibold truncate">{type.name}</div>
                    <div className={cn("text-[11px] mt-0.5", isSelected ? "text-gray-300" : "text-gray-500")}>
                      {remaining}d left
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Duration <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 p-1 bg-gray-100 rounded-lg gap-1 text-xs">
              <button
                type="button"
                onClick={() => handleDurationChange("FULL_DAY")}
                className={cn(
                  "py-1.5 rounded-md font-medium transition-all text-center",
                  duration === "FULL_DAY"
                    ? "bg-white text-gray-950 shadow-xs font-semibold"
                    : "text-gray-600 hover:text-gray-950"
                )}
              >
                Full Day
              </button>
              <button
                type="button"
                onClick={() => handleDurationChange("FIRST_HALF")}
                className={cn(
                  "py-1.5 rounded-md font-medium transition-all text-center",
                  duration === "FIRST_HALF"
                    ? "bg-white text-gray-950 shadow-xs font-semibold"
                    : "text-gray-600 hover:text-gray-950"
                )}
              >
                First Half
              </button>
              <button
                type="button"
                onClick={() => handleDurationChange("SECOND_HALF")}
                className={cn(
                  "py-1.5 rounded-md font-medium transition-all text-center",
                  duration === "SECOND_HALF"
                    ? "bg-white text-gray-950 shadow-xs font-semibold"
                    : "text-gray-600 hover:text-gray-950"
                )}
              >
                Second Half
              </button>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                From Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                required
                className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                To Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={duration === "FULL_DAY" ? toDate : fromDate}
                onChange={(e) => handleToDateChange(e.target.value)}
                disabled={duration !== "FULL_DAY"}
                required
                className={cn(
                  "w-full h-9 px-3 text-xs border rounded-lg focus:outline-none",
                  duration !== "FULL_DAY"
                    ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white border-gray-200 text-gray-900 focus:border-gray-950"
                )}
              />
            </div>
          </div>

          {/* Compact summary */}
          <div className="flex items-center justify-between text-xs py-2 px-3 bg-gray-50 border border-gray-200/70 rounded-lg">
            <span className="text-gray-600">
              Duration: <strong className="text-gray-950 font-semibold">{requestedDays} {requestedDays === 1 ? "day" : "days"}</strong>
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-600">
              Available: <strong className="text-gray-950 font-semibold">{availableQuota} days</strong>
            </span>
            <span className="text-gray-300">•</span>
            <span className={cn(projectedBalance < 0 ? "text-amber-700 font-semibold" : "text-gray-600")}>
              Remaining: <strong className={projectedBalance < 0 ? "text-amber-700" : "text-gray-950"}>{projectedBalance} days</strong>
              {projectedBalance < 0 && " (Exceeded)"}
            </span>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                Reason <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-gray-400">{reason.length}/250</span>
            </div>
            <textarea
              value={reason}
              onChange={(e) => {
                if (e.target.value.length <= 250) setReason(e.target.value);
              }}
              placeholder="Brief reason for your absence..."
              rows={2}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-950 resize-none"
              required
            />
          </div>

          {/* Supporting Document (Optional) */}
          <div>
            {attachment ? (
              <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Paperclip className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <span className="font-medium text-gray-900 truncate">{attachment.name}</span>
                  <span className="text-gray-500 shrink-0">({formatFileSize(attachment.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="text-gray-400 hover:text-gray-900 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-950 transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                <span>Attach document (optional)</span>
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.docx"
              className="hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting || !reason.trim() || (duration === "FULL_DAY" && toDate < fromDate)}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discard confirmation */}
      <ConfirmDialog
        isOpen={showConfirmDiscard}
        onClose={() => setShowConfirmDiscard(false)}
        onConfirm={() => {
          setShowConfirmDiscard(false);
          resetAndClose();
        }}
        title="Discard Draft?"
        description="Are you sure you want to discard your leave request? Your entered details will be lost."
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="warning"
      />
    </>
  );
}
