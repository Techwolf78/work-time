import React, { useState, useMemo } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  ClockAlert,
} from "lucide-react";
import { AttendanceRecord, Shift, Holiday, AttendanceRegularization } from "../../../types/hrms";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { formatDate, formatTime } from "../../../lib/utils";

export interface AttendanceCalendarViewProps {
  records: AttendanceRecord[];
  currentDate?: string; // e.g. "2026-10-06"
  assignedShift?: Shift;
  holidays?: Holiday[];
  regularizations?: AttendanceRegularization[];
  onOpenTimeline: (record: AttendanceRecord) => void;
  onOpenRegularization: (date: string, record?: AttendanceRecord) => void;
  isCheckedIn?: boolean;
  isCheckedOut?: boolean;
  onPunch?: (type: "IN" | "OUT") => void;
}

export function AttendanceCalendarView({
  records,
  currentDate = "2026-10-06",
  assignedShift,
  holidays = [],
  regularizations = [],
  onOpenTimeline,
  onOpenRegularization,
  isCheckedIn = false,
  isCheckedOut = false,
  onPunch,
}: AttendanceCalendarViewProps) {
  // Calendar Navigation: defaulting to October 2026
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(9); // 0-indexed: 9 = October
  const [selectedDateStr, setSelectedDateStr] = useState<string>(currentDate);

  // Compute records map by YYYY-MM-DD
  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach((r) => map.set(r.date, r));
    return map;
  }, [records]);

  // Compute pending regularizations by date
  const pendingRegMap = useMemo(() => {
    const map = new Map<string, AttendanceRegularization>();
    regularizations
      .filter((r) => r.status === "PENDING")
      .forEach((r) => map.set(r.date, r));
    return map;
  }, [regularizations]);

  // Compute holidays map by date
  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  // Month navigation helpers
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setSelectedYear(2026);
    setSelectedMonth(9);
    setSelectedDateStr(currentDate);
  };

  // Generate 7-day grid cells for the month
  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay(); // Sunday=0
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      record?: AttendanceRecord;
      holiday?: Holiday;
      pendingReg?: AttendanceRegularization;
    }> = [];

    // Preceding month filler days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === currentDate,
        record: recordMap.get(dateStr),
        holiday: holidayMap.get(dateStr),
        pendingReg: pendingRegMap.get(dateStr),
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: true,
        isToday: dateStr === currentDate,
        record: recordMap.get(dateStr),
        holiday: holidayMap.get(dateStr),
        pendingReg: pendingRegMap.get(dateStr),
      });
    }

    // Trailing month filler days to complete full grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === currentDate,
        record: recordMap.get(dateStr),
        holiday: holidayMap.get(dateStr),
        pendingReg: pendingRegMap.get(dateStr),
      });
    }

    return cells;
  }, [selectedYear, selectedMonth, currentDate, recordMap, holidayMap, pendingRegMap]);

  // Selected date record details
  const selectedRecord = recordMap.get(selectedDateStr);
  const selectedHoliday = holidayMap.get(selectedDateStr);
  const selectedPendingReg = pendingRegMap.get(selectedDateStr);

  // Month Statistics
  const totalPresent = records.filter((r) => r.status === "PRESENT").length;
  const totalAbsent = records.filter((r) => r.status === "ABSENT").length;
  const totalLate = records.filter((r) => r.status === "LATE").length;
  const totalHalfDay = records.filter((r) => r.status === "HALF_DAY").length;
  const totalWeekOff = records.filter((r) => r.status === "WEEK_OFF").length;
  const totalHolidays = records.filter((r) => r.status === "HOLIDAY").length;
  const totalHours = records.reduce((acc, r) => acc + (r.workingHours || 0), 0);
  const averageHoursPerWorkingDay = totalPresent + totalLate > 0 
    ? (totalHours / (totalPresent + totalLate)).toFixed(1) 
    : "8.5";

  // Today's record
  const todayRecord = recordMap.get(currentDate);

  return (
    <div className="space-y-4">
      {/* 1. Sleek Enterprise Monthly Summary Bar (No AI-slop colorful cards or 01-06 numbered circles) */}
      <div className="bg-white rounded-card border border-surface-border px-4 py-3 shadow-card flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-xs">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-baseline gap-1.5">
            <span className="text-text-secondary text-[11px] font-medium">Present Days</span>
            <span className="font-bold text-text-primary text-sm">{totalPresent}</span>
            <span className="text-[10px] text-emerald-600 font-medium">({((totalPresent / 22) * 100).toFixed(0)}%)</span>
          </div>

          <div className="h-4 w-px bg-surface-border hidden sm:block" />

          <div className="flex items-baseline gap-1.5">
            <span className="text-text-secondary text-[11px] font-medium">Late Marks</span>
            <span className={`font-bold text-sm ${totalLate > 0 ? "text-amber-700" : "text-text-primary"}`}>
              {totalLate}
            </span>
          </div>

          <div className="h-4 w-px bg-surface-border hidden sm:block" />

          <div className="flex items-baseline gap-1.5">
            <span className="text-text-secondary text-[11px] font-medium">Half Day / Leave</span>
            <span className="font-bold text-text-primary text-sm">{totalHalfDay}</span>
          </div>

          <div className="h-4 w-px bg-surface-border hidden sm:block" />

          <div className="flex items-baseline gap-1.5">
            <span className="text-text-secondary text-[11px] font-medium">Absent</span>
            <span className={`font-bold text-sm ${totalAbsent > 0 ? "text-rose-700" : "text-text-primary"}`}>
              {totalAbsent}
            </span>
          </div>

          <div className="h-4 w-px bg-surface-border hidden md:block" />

          <div className="flex items-baseline gap-1.5">
            <span className="text-text-secondary text-[11px] font-medium">Holidays & Offs</span>
            <span className="font-bold text-text-primary text-sm">{totalHolidays + totalWeekOff}d</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-text-secondary text-[11px] font-mono tabular-nums">
          <span>Avg Logged:</span>
          <strong className="text-text-primary font-bold">{averageHoursPerWorkingDay}h / day</strong>
        </div>
      </div>

      {/* 2. Main Calendar & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Calendar (8 cols on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-card border border-surface-border shadow-card overflow-hidden">
          {/* Calendar Header with Navigation and Legend */}
          <div className="px-4 py-3 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <h2 className="text-sm font-bold text-text-primary tracking-tight min-w-[130px] text-center">
                {monthNames[selectedMonth]} {selectedYear}
              </h2>

              <button
                onClick={handleNextMonth}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleJumpToToday}
                className="ml-1 px-2 py-0.5 rounded text-[11px] text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors font-medium border border-surface-border"
              >
                Today
              </button>
            </div>

            {/* Subtle Legend */}
            <div className="flex items-center gap-3 text-[11px] text-text-secondary flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Present
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Late
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Absent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Holiday
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                Off
              </span>
            </div>
          </div>

          {/* Weekday Row (Clean neutral border, NOT electric blue) */}
          <div className="grid grid-cols-7 border-b border-surface-border bg-surface-subtle/50 text-[11px] font-semibold text-text-secondary uppercase tracking-wider py-2 text-center">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar 7-Day Grid */}
          <div className="grid grid-cols-7 border-collapse divide-x divide-y divide-surface-border">
            {calendarCells.map((cell) => {
              const isSelected = selectedDateStr === cell.dateStr;
              const status = cell.record?.status;

              // Clean enterprise cell styling
              let cellBg = "bg-white";
              let statusLabel = "";
              let statusBadgeClass = "text-text-muted";

              if (cell.holiday) {
                cellBg = "bg-blue-50/20";
                statusLabel = cell.holiday.name;
                statusBadgeClass = "text-blue-700 bg-blue-50 border border-blue-200/60 font-medium";
              } else if (cell.pendingReg) {
                cellBg = "bg-amber-50/20";
                statusLabel = "Reg Pending";
                statusBadgeClass = "text-amber-800 bg-amber-50 border border-amber-300 font-semibold";
              } else if (status === "PRESENT") {
                cellBg = "bg-white";
                statusLabel = "Present";
                statusBadgeClass = "text-emerald-700 bg-emerald-50/70 border border-emerald-200/50";
              } else if (status === "LATE") {
                cellBg = "bg-amber-50/20";
                statusLabel = `Late (${cell.record?.lateMinutes || 15}m)`;
                statusBadgeClass = "text-amber-800 bg-amber-50 border border-amber-200";
              } else if (status === "HALF_DAY") {
                cellBg = "bg-amber-50/20";
                statusLabel = "Half Day";
                statusBadgeClass = "text-amber-700 bg-amber-50 border border-amber-200";
              } else if (status === "ABSENT") {
                cellBg = "bg-rose-50/20";
                statusLabel = "Absent";
                statusBadgeClass = "text-rose-700 bg-rose-50 border border-rose-200";
              } else if (status === "WEEK_OFF") {
                cellBg = "bg-surface-subtle/35";
                statusLabel = "Week Off";
                statusBadgeClass = "text-text-muted font-normal";
              }

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[82px] sm:min-h-[92px] p-2 transition-all cursor-pointer relative flex flex-col justify-between ${cellBg} ${
                    !cell.isCurrentMonth ? "opacity-30 bg-surface-subtle/20" : ""
                  } ${
                    isSelected
                      ? "ring-2 ring-brand-navy z-10 shadow-sm bg-white"
                      : "hover:bg-surface-subtle/60"
                  }`}
                >
                  {/* Top Row: Date Number and Today Indicator */}
                  <div className="flex items-center justify-between">
                    {cell.isToday ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-navy text-white">
                        Today
                      </span>
                    ) : <span />}

                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        cell.isToday
                          ? "text-brand-navy font-bold"
                          : cell.isCurrentMonth
                          ? "text-text-primary"
                          : "text-text-muted"
                      }`}
                    >
                      {String(cell.dayNum).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Middle: Status Tag */}
                  <div className="my-1">
                    {statusLabel ? (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded inline-block truncate max-w-full ${statusBadgeClass}`}
                        title={statusLabel}
                      >
                        {statusLabel}
                      </span>
                    ) : null}
                  </div>

                  {/* Bottom: Punch Time / Hours */}
                  <div className="text-[10px] font-mono tabular-nums text-text-secondary flex items-center justify-between">
                    {cell.record?.firstIn && cell.record?.lastOut ? (
                      <span className="truncate text-text-muted">
                        {formatTime(cell.record.firstIn)} – {formatTime(cell.record.lastOut)}
                      </span>
                    ) : cell.record?.workingHours ? (
                      <span className="text-text-muted">{cell.record.workingHours}h</span>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Day Inspector & Punch Control (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Day Inspector Panel */}
          {selectedRecord ? (
            <div className="bg-white rounded-card border border-surface-border p-4 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    {formatDate(selectedRecord.date)}
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {assignedShift?.name || "General Shift"} · {assignedShift?.startTime} to {assignedShift?.endTime}
                  </p>
                </div>
                <Badge
                  variant={
                    selectedRecord.status === "PRESENT"
                      ? "success"
                      : selectedRecord.status === "ABSENT"
                      ? "danger"
                      : selectedRecord.status === "WEEK_OFF"
                      ? "neutral"
                      : "warning"
                  }
                  size="sm"
                >
                  {selectedRecord.status.replace("_", " ")}
                </Badge>
              </div>

              {/* Day Punch Times */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-surface-subtle/70 border border-surface-border flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-text-muted block">First In</span>
                    <span className="font-mono font-bold text-sm text-text-primary">
                      {selectedRecord.firstIn ? formatTime(selectedRecord.firstIn) : "—"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-text-muted block">Last Out</span>
                    <span className="font-mono font-bold text-sm text-text-primary">
                      {selectedRecord.lastOut ? formatTime(selectedRecord.lastOut) : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1 text-xs text-text-secondary">
                  <span>Gross Working Hours:</span>
                  <span className="font-mono font-bold text-text-primary">{selectedRecord.workingHours} hrs</span>
                </div>

                {selectedRecord.lateMinutes > 0 && (
                  <div className="flex items-center justify-between px-1 text-xs text-amber-700">
                    <span>Late Arrival:</span>
                    <span className="font-mono font-semibold">{selectedRecord.lateMinutes} mins</span>
                  </div>
                )}

                {selectedHoliday && (
                  <div className="p-2 rounded bg-blue-50/70 border border-blue-200 text-xs text-blue-800">
                    <strong>Statutory Holiday:</strong> {selectedHoliday.name} ({selectedHoliday.isOptional ? "Restricted" : "Gazetted"})
                  </div>
                )}

                {selectedPendingReg && (
                  <div className="p-2 rounded bg-amber-50/70 border border-amber-200 text-xs text-amber-800">
                    <strong>Regularization Filed:</strong> Request for {selectedPendingReg.missingPunchType} at {selectedPendingReg.requestedTime}
                  </div>
                )}
              </div>

              {/* Action Buttons for this day */}
              <div className="pt-2 border-t border-surface-border flex items-center justify-between gap-2">
                <Button
                  onClick={() => onOpenTimeline(selectedRecord)}
                  variant="ghost"
                  size="sm"
                  className="text-text-secondary text-xs"
                  leftIcon={<Clock className="w-3.5 h-3.5" />}
                >
                  Raw Punches ({selectedRecord.punches?.length || 0})
                </Button>

                <Button
                  onClick={() => onOpenRegularization(selectedRecord.date, selectedRecord)}
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium"
                  leftIcon={<ClockAlert className="w-3.5 h-3.5 text-text-secondary" />}
                >
                  Regularize
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-card border border-surface-border p-4 shadow-card text-center py-8 text-xs text-text-muted">
              Select a date on the calendar to view punch breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
