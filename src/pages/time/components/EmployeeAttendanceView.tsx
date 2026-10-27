import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  CalendarRange,
  Plus,
  FileText,
} from "lucide-react";
import { useHrms } from "../../../lib/hrmsContext";
import { useAuth } from "../../../lib/authContext";
import { useToast } from "../../../lib/toastContext";
import { AttendanceRecord, Shift } from "../../../types/hrms";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { formatDate, formatTime } from "../../../lib/utils";
import { AttendanceRegisterTable } from "./AttendanceRegisterTable";
import { AttendanceSummaryStrip } from "./AttendanceSummaryStrip";
import { AttendanceCalendarView } from "./AttendanceCalendarView";
import { generate31DaysEmployeeAttendance } from "../../../lib/attendanceDemoData";

export interface EmployeeAttendanceViewProps {
  employeeId?: string;
  defaultSubTab?: "HISTORY" | "REGULARIZATIONS" | "SCHEDULE";
  onOpenRegularizationModal: (date?: string) => void;
  onOpenTimelineModal: (record: AttendanceRecord) => void;
}

export function EmployeeAttendanceView({
  employeeId,
  defaultSubTab,
  onOpenRegularizationModal,
  onOpenTimelineModal,
}: EmployeeAttendanceViewProps) {
  const { user } = useAuth();
  const {
    attendance,
    employees,
    shifts,
    regularizations,
    punchAttendance,
    holidays,
    designations,
  } = useHrms();
  const toast = useToast();

  const [activeSubTab, setActiveSubTab] = useState<"HISTORY" | "REGULARIZATIONS" | "SCHEDULE">(
    defaultSubTab || "HISTORY"
  );
  const [historyViewMode, setHistoryViewMode] = useState<"CALENDAR" | "TABLE">("CALENDAR");
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    if (defaultSubTab) {
      setActiveSubTab(defaultSubTab);
    }
  }, [defaultSubTab]);

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const effectiveEmployeeId = employeeId || user?.employeeId || "EMP-1004";
  const currentEmp = employees.find((e) => e.id === effectiveEmployeeId || e.employeeCode === effectiveEmployeeId) || employees[0];
  const assignedShift: Shift = shifts.find((s) => s.id === currentEmp?.shiftId) || shifts[0];
  const desigTitle = designations.find((d) => d.id === currentEmp?.designationId)?.title || "Employee";

  const todayStr = "2026-10-06";

  // Full 31-day attendance records for current employee (October 2026: Oct 01 to Oct 31)
  const myRecords = useMemo(() => {
    if (!currentEmp) return [];
    const existing = attendance.filter((a) => a.employeeId === currentEmp.id);
    // If the database has only partial or single-day data, generate/supplement full 31 days
    if (existing.length < 28) {
      return generate31DaysEmployeeAttendance(currentEmp.id, currentEmp.shiftId, existing);
    }
    return existing;
  }, [attendance, currentEmp]);

  // Today's record (connects with active punch widget)
  const todayRecord = useMemo(() => {
    return myRecords.find((a) => a.date === todayStr) || attendance.find((a) => a.employeeId === currentEmp?.id && a.date === todayStr);
  }, [myRecords, attendance, currentEmp?.id, todayStr]);

  // My regularization requests
  const myRegularizations = useMemo(() => {
    return regularizations.filter((r) => r.employeeId === currentEmp?.id);
  }, [regularizations, currentEmp?.id]);

  // Comprehensive monthly statistics for the 31-day period
  const presentDays = myRecords.filter((r) => r.status === "PRESENT").length;
  const lateDays = myRecords.filter((r) => r.status === "LATE").length;
  const halfDays = myRecords.filter((r) => r.status === "HALF_DAY").length;
  const leaveDays = myRecords.filter((r) => r.status === "LEAVE").length;
  const absentDays = myRecords.filter((r) => r.status === "ABSENT").length;
  const weeklyOffDays = myRecords.filter((r) => r.status === "WEEK_OFF").length;
  const holidayDays = myRecords.filter((r) => r.status === "HOLIDAY").length;
  const totalLoggedHours = Math.round(myRecords.reduce((acc, r) => acc + (r.workingHours || 0), 0) * 10) / 10;

  const isCheckedIn = Boolean(todayRecord?.firstIn);
  const isCheckedOut = Boolean(todayRecord?.lastOut && todayRecord?.lastOut !== todayRecord?.firstIn);

  const handlePunch = (type: "IN" | "OUT") => {
    if (!currentEmp) return;
    punchAttendance(currentEmp.id, type);
    toast.success(
      type === "IN"
        ? `Clocked in at ${formatTime(new Date().toTimeString().slice(0, 5))}.`
        : `Clocked out at ${formatTime(new Date().toTimeString().slice(0, 5))}. Shift ended.`
    );
  };

  const employeeMetrics = [
    { label: "Days Present", value: presentDays, dotColor: "bg-emerald-500" },
    { label: "Late Marks", value: lateDays, dotColor: "bg-amber-500", highlight: lateDays > 0 },
    { label: "Half Days", value: halfDays, dotColor: "bg-gray-400" },
    { label: "On Leave", value: leaveDays, dotColor: "bg-blue-500" },
    { label: "Absent Days", value: absentDays, dotColor: "bg-rose-500", highlight: absentDays > 0 },
    { label: "Weekly Off / Hol", value: `${weeklyOffDays + holidayDays}d`, dotColor: "bg-purple-400" },
    { label: "Total Logged", value: `${totalLoggedHours}h`, dotColor: "bg-brand-cyan" },
  ];

  return (
    <div className="space-y-4">
      {/* Attendance View (Calendar or Table) */}
      {activeSubTab === "HISTORY" && (
        <div className="space-y-3">
          {/* View Mode Switcher Header: Calendar vs Table */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-text-primary">
              {historyViewMode === "CALENDAR"
                ? "Monthly Attendance Calendar"
                : "Attendance Register Table"}
            </span>

            <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-surface-border text-xs shrink-0">
              <button
                onClick={() => setHistoryViewMode("CALENDAR")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  historyViewMode === "CALENDAR"
                    ? "bg-white shadow-sm text-brand-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => setHistoryViewMode("TABLE")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  historyViewMode === "TABLE"
                    ? "bg-white shadow-sm text-brand-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Register Table</span>
              </button>
            </div>
          </div>

          {historyViewMode === "CALENDAR" ? (
            <AttendanceCalendarView
              records={myRecords}
              currentDate={todayStr}
              assignedShift={assignedShift}
              holidays={holidays}
              regularizations={myRegularizations}
              onOpenTimeline={onOpenTimelineModal}
              onOpenRegularization={(d) => onOpenRegularizationModal(d)}
            />
          ) : (
            <div className="space-y-4">
              <AttendanceSummaryStrip metrics={employeeMetrics} />
              <AttendanceRegisterTable
                records={myRecords}
                onOpenTimeline={onOpenTimelineModal}
                onOpenCorrection={(rec) => onOpenRegularizationModal(rec.date)}
                canCorrect={true}
                canExport={true}
                showFilters={true}
                showDateColumn={true}
                showEmployeeColumn={false}
                defaultSortField="date"
                defaultSortAsc={false}
                customTitle="My October 2026 Attendance Register (31 Days)"
              />
            </div>
          )}
        </div>
      )}

      {activeSubTab === "REGULARIZATIONS" && (
        <div className="bg-white rounded-card border border-surface-border shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">
              Regularization Requests ({myRegularizations.length})
            </span>
            <Button
              onClick={() => onOpenRegularizationModal()}
              variant="outline"
              size="sm"
              className="h-7 text-xs font-medium"
              leftIcon={<Plus className="w-3 h-3" />}
            >
              New Request
            </Button>
          </div>

          <div className="divide-y divide-surface-border">
            {myRegularizations.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-xs">
                <FileText className="w-6 h-6 text-text-muted mx-auto mb-2 opacity-50" />
                <p className="font-medium text-text-primary">No regularization requests filed</p>
                <p className="mt-0.5 text-text-secondary">If you have a missing punch or incorrect record, submit a request above.</p>
              </div>
            ) : (
              myRegularizations.map((reg) => (
                <div key={reg.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-surface-subtle/40 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary">
                        Date: {formatDate(reg.date)}
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
                    </div>
                    <p className="text-xs text-text-secondary">
                      Correction: <strong className="text-text-primary">{reg.missingPunchType} at {formatTime(reg.requestedTime)}</strong>
                    </p>
                    <p className="text-xs text-text-muted italic">
                      "{reg.reason}"
                    </p>
                    {reg.comments && (
                      <p className="text-xs text-amber-800 bg-status-warning-bg px-2 py-0.5 rounded inline-block mt-0.5">
                        Manager Note: {reg.comments}
                      </p>
                    )}
                  </div>

                  <div className="text-right text-[11px] text-text-muted shrink-0">
                    Applied on {formatDate(reg.appliedDate)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSubTab === "SCHEDULE" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shift Details */}
          <div className="bg-white p-4 rounded-card border border-surface-border shadow-card space-y-3">
            <div className="flex items-center gap-2 border-b border-surface-border pb-2.5">
              <CalendarRange className="w-4 h-4 text-text-secondary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                Assigned Shift Rules
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-surface-border/40">
                <span className="text-text-secondary">Shift:</span>
                <span className="font-medium text-text-primary">{assignedShift?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-border/40">
                <span className="text-text-secondary">Hours:</span>
                <span className="font-mono tabular-nums text-text-primary">{assignedShift?.startTime} – {assignedShift?.endTime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-border/40">
                <span className="text-text-secondary">Grace Period:</span>
                <span className="text-text-primary">{assignedShift?.graceMinutes} minutes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-border/40">
                <span className="text-text-secondary">Working Days:</span>
                <span className="text-text-primary">{assignedShift?.workDays.join(", ")}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-secondary">Weekly Offs:</span>
                <span className="text-text-primary font-medium">Saturday & Sunday</span>
              </div>
            </div>
          </div>

          {/* Upcoming Public Holidays */}
          <div className="bg-white p-4 rounded-card border border-surface-border shadow-card space-y-3">
            <div className="flex items-center gap-2 border-b border-surface-border pb-2.5">
              <Calendar className="w-4 h-4 text-text-secondary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                Upcoming Public Holidays
              </h3>
            </div>
            <div className="divide-y divide-surface-border/50 text-xs">
              {holidays.slice(0, 4).map((h) => (
                <div key={h.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-text-primary block">{h.name}</span>
                    <span className="text-text-secondary text-[11px]">{h.day}</span>
                  </div>
                  <span className="font-mono tabular-nums text-xs text-text-secondary">
                    {formatDate(h.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
