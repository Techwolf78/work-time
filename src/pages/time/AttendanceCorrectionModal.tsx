import React, { useState, useMemo, useRef, useEffect } from "react";
import { Paperclip, X, AlertCircle, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useHrms } from "../../lib/hrmsContext";
import { useAuth } from "../../lib/authContext";
import { useToast } from "../../lib/toastContext";
import { formatTime, cn } from "../../lib/utils";

export type CorrectionType =
  | "MISSING_IN"
  | "MISSING_OUT"
  | "MISSING_BOTH"
  | "INCORRECT_PUNCH"
  | "OTHER_DISCREPANCY";

export interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillDate?: string;
  prefillEmployeeId?: string;
  prefillCorrectionType?: CorrectionType;
}

interface UploadedFile {
  name: string;
  size: number;
}

export function AttendanceCorrectionModal({
  isOpen,
  onClose,
  prefillDate,
  prefillEmployeeId,
  prefillCorrectionType,
}: AttendanceCorrectionModalProps) {
  const {
    attendance,
    employees,
    shifts,
    applyRegularization,
    uploadDocument,
  } = useHrms();
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
  const [employeeId, setEmployeeId] = useState(
    prefillEmployeeId || user?.employeeId || employees[0]?.id || "EMP-1001"
  );
  const [date, setDate] = useState(prefillDate || "2026-10-06");
  const [correctionType, setCorrectionType] = useState<CorrectionType>(
    prefillCorrectionType || "MISSING_OUT"
  );

  // Time Inputs
  const [requestedInTime, setRequestedInTime] = useState("09:30");
  const [requestedOutTime, setRequestedOutTime] = useState("18:30");
  const [targetPunchType, setTargetPunchType] = useState<"IN" | "OUT">("IN");
  const [correctedTime, setCorrectedTime] = useState("09:30");
  const [isOvernightShift, setIsOvernightShift] = useState(false);

  // Reason & Attachment
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<UploadedFile | null>(null);

  // Validation & Control
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  // Sync props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (prefillDate) setDate(prefillDate);
      if (prefillEmployeeId) setEmployeeId(prefillEmployeeId);
      if (prefillCorrectionType) setCorrectionType(prefillCorrectionType);
    }
  }, [isOpen, prefillDate, prefillEmployeeId, prefillCorrectionType]);

  // Selected Employee
  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.id === employeeId) || employees[0];
  }, [employees, employeeId]);

  // Look up current attendance record for this employee and date
  const currentRecord = useMemo(() => {
    return attendance.find((a) => a.employeeId === employeeId && a.date === date);
  }, [attendance, employeeId, date]);

  // Look up shift details
  const currentShift = useMemo(() => {
    if (currentRecord?.shiftId) {
      return shifts.find((s) => s.id === currentRecord.shiftId) || shifts[0];
    }
    return shifts[0];
  }, [shifts, currentRecord]);

  // Prepopulate default times based on shift if available
  useEffect(() => {
    if (currentShift) {
      if (currentShift.startTime) {
        setRequestedInTime(currentShift.startTime);
        setCorrectedTime(currentShift.startTime);
      }
      if (currentShift.endTime) {
        setRequestedOutTime(currentShift.endTime);
      }
    }
  }, [currentShift]);

  // Helper for status badge
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge variant="success" size="sm" dot>Present</Badge>;
      case "LATE":
        return <Badge variant="warning" size="sm" dot>Late</Badge>;
      case "HALF_DAY":
        return <Badge variant="neutral" size="sm" dot>Half Day</Badge>;
      case "ABSENT":
        return <Badge variant="danger" size="sm" dot>Absent</Badge>;
      case "LEAVE":
        return <Badge variant="neutral" size="sm" dot>On Leave</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status || "Not Recorded"}</Badge>;
    }
  };

  // Determine if form is dirty
  const isDirty = useMemo(() => {
    return reason.trim().length > 0 || attachment !== null;
  }, [reason, attachment]);

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
    setErrorMessage("");
    setIsSubmitting(false);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  // Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      setErrorMessage("Please select a valid attendance date.");
      return;
    }

    if (!reason.trim()) {
      setErrorMessage("Please provide a reason for this attendance correction.");
      return;
    }

    // Time validation checks
    if (correctionType === "MISSING_IN" && !requestedInTime) {
      setErrorMessage("Please specify the requested punch in time.");
      return;
    }
    if (correctionType === "MISSING_OUT" && !requestedOutTime) {
      setErrorMessage("Please specify the requested punch out time.");
      return;
    }
    if (correctionType === "MISSING_BOTH") {
      if (!requestedInTime || !requestedOutTime) {
        setErrorMessage("Please specify both punch in and punch out times.");
        return;
      }
      if (requestedOutTime <= requestedInTime && !isOvernightShift) {
        setErrorMessage("Punch out time cannot be earlier than punch in time unless marked as an overnight shift.");
        return;
      }
    }
    if (correctionType === "INCORRECT_PUNCH" && !correctedTime) {
      setErrorMessage("Please enter the corrected punch time.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Map correction type to backend missingPunchType
      let missingType: "IN" | "OUT" | "BOTH" = "OUT";
      let timeValue = requestedOutTime;

      if (correctionType === "MISSING_IN") {
        missingType = "IN";
        timeValue = requestedInTime;
      } else if (correctionType === "MISSING_OUT") {
        missingType = "OUT";
        timeValue = requestedOutTime;
      } else if (correctionType === "MISSING_BOTH") {
        missingType = "BOTH";
        timeValue = `${requestedInTime} - ${requestedOutTime}`;
      } else if (correctionType === "INCORRECT_PUNCH") {
        missingType = targetPunchType;
        timeValue = correctedTime;
      } else {
        missingType = "BOTH";
        timeValue = requestedInTime;
      }

      applyRegularization({
        employeeId,
        date,
        missingPunchType: missingType,
        requestedTime: timeValue,
        reason: reason.trim(),
      });

      if (attachment) {
        uploadDocument(
          {
            employeeId,
            title: `Attendance Support - ${date} (${attachment.name})`,
            category: "OTHER",
            fileSize: formatFileSize(attachment.size),
            fileType: attachment.name.split(".").pop()?.toUpperCase() || "PDF",
          },
          { silent: true }
        );
      }

      resetAndClose();
    } catch {
      toastError("Failed to submit attendance correction request.");
      setIsSubmitting(false);
    }
  };

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "HR_ADMIN";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="lg"
        title="Request Attendance Correction"
        description="Correct a missing punch or report an attendance discrepancy."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Employee (Admin only) & Attendance Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isAdmin && !prefillEmployeeId && employees.length > 1 ? (
              <div>
                <label className="block text-xs font-medium text-gray-750 mb-1">
                  Employee (Managed Unit) <span className="text-rose-500">*</span>
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
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-750 mb-1">
                  Requester Identity
                </label>
                <div className="h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{currentEmployee?.firstName} {currentEmployee?.lastName}</span>
                    <span className="font-mono text-[10px] text-text-muted bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border">{currentEmployee?.employeeCode}</span>
                  </div>
                  <span className="text-[10px] text-brand-primary font-medium bg-brand-primary-light px-2 py-0.5 rounded">
                    Personal Self-Service
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-750 mb-1">
                Attendance Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setErrorMessage("");
                }}
                required
                className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-950"
              />
            </div>
          </div>

          {/* Row 2: Correction Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-750">
              Correction Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: "MISSING_IN", label: "Missing Punch In" },
                { id: "MISSING_OUT", label: "Missing Punch Out" },
                { id: "MISSING_BOTH", label: "Missing In & Out" },
                { id: "INCORRECT_PUNCH", label: "Incorrect Punch Time" },
                { id: "OTHER_DISCREPANCY", label: "Other Discrepancy" },
              ].map((opt) => {
                const isSelected = correctionType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setCorrectionType(opt.id as CorrectionType);
                      setErrorMessage("");
                    }}
                    className={cn(
                      "py-2 px-2.5 rounded-lg border text-left font-medium transition-all",
                      isSelected
                        ? "border-gray-950 bg-gray-950 text-white shadow-xs font-semibold"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section D: Current Attendance Details (Read-only) */}
          <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between text-gray-500 pb-1.5 border-b border-gray-200/60 font-medium">
              <span>Current Attendance Summary</span>
              <span>{date}</span>
            </div>

            {currentRecord ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-[11px] text-gray-500 block">Shift</span>
                  <span className="font-semibold text-gray-900">
                    {currentShift?.name || "Standard Shift"}
                  </span>
                  <span className="text-[10px] text-gray-400 block">
                    {currentShift?.startTime} - {currentShift?.endTime}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 block">Punch In</span>
                  <span className="font-semibold text-gray-900">
                    {currentRecord.firstIn ? formatTime(currentRecord.firstIn) : "Not Recorded"}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 block">Punch Out</span>
                  <span className="font-semibold text-gray-900">
                    {currentRecord.lastOut ? formatTime(currentRecord.lastOut) : "Not Recorded"}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 block">Status / Hours</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {renderStatusBadge(currentRecord.status)}
                    <span className="text-[11px] text-gray-600 font-medium">
                      {currentRecord.workingHours > 0 ? `${currentRecord.workingHours} hrs` : "0 hrs"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 py-1 text-center">
                No existing punch records found for this date.
              </div>
            )}
          </div>

          {/* Section E: Requested Correction Inputs */}
          <div className="p-3 bg-white border border-gray-200 rounded-lg space-y-3">
            <span className="block text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Requested Time Adjustments
            </span>

            {/* Dynamic Inputs per correctionType */}
            {correctionType === "MISSING_IN" && (
              <div className="max-w-xs">
                <label className="block text-xs font-medium text-gray-750 mb-1">
                  Requested Punch In Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={requestedInTime}
                  onChange={(e) => setRequestedInTime(e.target.value)}
                  required
                  className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-950"
                />
              </div>
            )}

            {correctionType === "MISSING_OUT" && (
              <div className="max-w-xs">
                <label className="block text-xs font-medium text-gray-750 mb-1">
                  Requested Punch Out Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={requestedOutTime}
                  onChange={(e) => setRequestedOutTime(e.target.value)}
                  required
                  className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-950"
                />
              </div>
            )}

            {correctionType === "MISSING_BOTH" && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-750 mb-1">
                      Requested Punch In Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={requestedInTime}
                      onChange={(e) => setRequestedInTime(e.target.value)}
                      required
                      className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-750 mb-1">
                      Requested Punch Out Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={requestedOutTime}
                      onChange={(e) => setRequestedOutTime(e.target.value)}
                      required
                      className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-950"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="overnight-shift-check"
                    checked={isOvernightShift}
                    onChange={(e) => setIsOvernightShift(e.target.checked)}
                    className="rounded border-gray-300 text-gray-950 focus:ring-gray-950/20 w-3.5 h-3.5"
                  />
                  <label htmlFor="overnight-shift-check" className="text-xs text-gray-600 cursor-pointer">
                    Overnight shift (Punch out occurs on the following calendar day)
                  </label>
                </div>
              </div>
            )}

            {correctionType === "INCORRECT_PUNCH" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-750 mb-1">
                    Punch to Correct <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={targetPunchType}
                    onChange={(e) => setTargetPunchType(e.target.value as "IN" | "OUT")}
                    className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-950"
                  >
                    <option value="IN">Punch In</option>
                    <option value="OUT">Punch Out</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-750 mb-1">
                    Existing Record Time
                  </label>
                  <div className="h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-600 flex items-center">
                    {targetPunchType === "IN"
                      ? currentRecord?.firstIn ? formatTime(currentRecord.firstIn) : "Not Recorded"
                      : currentRecord?.lastOut ? formatTime(currentRecord.lastOut) : "Not Recorded"}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-750 mb-1">
                    Corrected Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={correctedTime}
                    onChange={(e) => setCorrectedTime(e.target.value)}
                    required
                    className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-950"
                  />
                </div>
              </div>
            )}

            {correctionType === "OTHER_DISCREPANCY" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-750 mb-1">
                    Corrected Punch In Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={requestedInTime}
                    onChange={(e) => setRequestedInTime(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-750 mb-1">
                    Corrected Punch Out Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={requestedOutTime}
                    onChange={(e) => setRequestedOutTime(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-950"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section F: Reason for Correction */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-750">
                Reason for Correction <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-gray-400">{reason.length}/250</span>
            </div>
            <textarea
              value={reason}
              onChange={(e) => {
                if (e.target.value.length <= 250) setReason(e.target.value);
              }}
              placeholder="Explain why your attendance needs correction (e.g. biometric reader failure, official client visit, forgot punch)..."
              rows={2}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-950 resize-none"
              required
            />
          </div>

          {/* Section G: Supporting Attachment (Optional) */}
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
                <span>Attach supporting document (optional)</span>
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

          {/* Section H: Approval Information */}
          <div className="px-3 py-2 bg-gray-50 border border-gray-200/70 rounded-lg flex items-center justify-between text-xs text-gray-600">
            <span>Approval Route: <strong className="text-gray-900 font-semibold">Reporting Manager</strong></span>
            <span className="text-gray-500 text-[11px]">Your request will be sent for review.</span>
          </div>

          {/* Section I: Footer Actions */}
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
              disabled={isSubmitting || !reason.trim() || !date}
            >
              Submit Correction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discard Confirmation */}
      <ConfirmDialog
        isOpen={showConfirmDiscard}
        onClose={() => setShowConfirmDiscard(false)}
        onConfirm={() => {
          setShowConfirmDiscard(false);
          resetAndClose();
        }}
        title="Discard Correction Request?"
        description="Are you sure you want to discard your correction request? Your entered details will be lost."
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="warning"
      />
    </>
  );
}
