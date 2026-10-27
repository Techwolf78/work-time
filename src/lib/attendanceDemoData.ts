import { AttendanceRecord, AttendanceStatus, PunchLog } from "../types/hrms";

/**
 * October 2026 (31 Days) Attendance Template
 * October 1, 2026 is a Thursday.
 * Holidays:
 * - 2026-10-02 (Fri): Mahatma Gandhi Jayanti
 * - 2026-10-20 (Tue): Dussehra (Vijayadashami)
 * Saturdays & Sundays: Weekly Offs (Oct 3, 4, 10, 11, 17, 18, 24, 25, 31)
 */

interface DaySchedule {
  day: number; // 1 to 31
  date: string; // "2026-10-01"
  dayOfWeek: string;
  status: AttendanceStatus;
  firstIn: string | null;
  lastOut: string | null;
  workingHours: number;
  lateMinutes: number;
  inSource?: PunchLog["source"];
  inLocation?: string;
  outSource?: PunchLog["source"];
  outLocation?: string;
  regularizationId?: string;
}

const OCTOBER_2026_DAYS: DaySchedule[] = [
  {
    day: 1,
    date: "2026-10-01",
    dayOfWeek: "Thursday",
    status: "PRESENT",
    firstIn: "09:22",
    lastOut: "18:35",
    workingHours: 9.2,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 2,
    date: "2026-10-02",
    dayOfWeek: "Friday",
    status: "HOLIDAY",
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
  {
    day: 3,
    date: "2026-10-03",
    dayOfWeek: "Saturday",
    status: "WEEK_OFF",
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
  {
    day: 4,
    date: "2026-10-04",
    dayOfWeek: "Sunday",
    status: "WEEK_OFF",
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
  {
    day: 5,
    date: "2026-10-05",
    dayOfWeek: "Monday",
    status: "LATE",
    firstIn: "10:15",
    lastOut: "18:45",
    workingHours: 8.5,
    lateMinutes: 30, // 30 mins after 09:45 grace
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
    regularizationId: "reg-001",
  },
  {
    day: 6,
    date: "2026-10-06",
    dayOfWeek: "Tuesday",
    status: "PRESENT",
    firstIn: "09:24",
    lastOut: "18:32",
    workingHours: 9.1,
    lateMinutes: 0,
    inSource: "WEB",
    inLocation: "Web Portal Check-In",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 7,
    date: "2026-10-07",
    dayOfWeek: "Wednesday",
    status: "PRESENT",
    firstIn: "09:18",
    lastOut: "18:40",
    workingHours: 9.35,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 8,
    date: "2026-10-08",
    dayOfWeek: "Thursday",
    status: "PRESENT",
    firstIn: "09:28",
    lastOut: "18:32",
    workingHours: 9.05,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 9,
    date: "2026-10-09",
    dayOfWeek: "Friday",
    status: "PRESENT",
    firstIn: "09:15",
    lastOut: "18:15",
    workingHours: 9.0,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 10,
    date: "2026-10-10",
    dayOfWeek: "Saturday",
    status: "WEEK_OFF",
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
  {
    day: 11,
    date: "2026-10-11",
    dayOfWeek: "Sunday",
    status: "WEEK_OFF",
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
  {
    day: 12,
    date: "2026-10-12",
    dayOfWeek: "Monday",
    status: "PRESENT",
    firstIn: "09:20",
    lastOut: "18:45",
    workingHours: 9.4,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 13,
    date: "2026-10-13",
    dayOfWeek: "Tuesday",
    status: "PRESENT",
    firstIn: "09:26",
    lastOut: "18:35",
    workingHours: 9.15,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 14,
    date: "2026-10-14",
    dayOfWeek: "Wednesday",
    status: "LATE",
    firstIn: "10:05",
    lastOut: "18:50",
    workingHours: 8.75,
    lateMinutes: 20, // 20 mins after 09:45 grace
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 15,
    date: "2026-10-15",
    dayOfWeek: "Thursday",
    status: "PRESENT",
    firstIn: "09:22",
    lastOut: "18:30",
    workingHours: 9.1,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 16,
    date: "2026-10-16",
    dayOfWeek: "Friday",
    status: "HALF_DAY",
    firstIn: "09:30",
    lastOut: "13:45",
    workingHours: 4.25,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out (Half Day Leave)",
  },
  {
    day: 17,
    date: "2026-10-17",
    dayOfWeek: "Saturday",
    status: "WEEK_OFF",
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
  {
    day: 18,
    date: "2026-10-18",
    dayOfWeek: "Sunday",
    status: "WEEK_OFF",
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
  {
    day: 19,
    date: "2026-10-19",
    dayOfWeek: "Monday",
    status: "PRESENT",
    firstIn: "09:25",
    lastOut: "18:30",
    workingHours: 9.1,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 20,
    date: "2026-10-20",
    dayOfWeek: "Tuesday",
    status: "HOLIDAY", // Dussehra
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
  {
    day: 21,
    date: "2026-10-21",
    dayOfWeek: "Wednesday",
    status: "PRESENT",
    firstIn: "09:19",
    lastOut: "18:35",
    workingHours: 9.25,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 22,
    date: "2026-10-22",
    dayOfWeek: "Thursday",
    status: "LEAVE",
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
  {
    day: 23,
    date: "2026-10-23",
    dayOfWeek: "Friday",
    status: "PRESENT",
    firstIn: "09:27",
    lastOut: "18:40",
    workingHours: 9.2,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 24,
    date: "2026-10-24",
    dayOfWeek: "Saturday",
    status: "WEEK_OFF",
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
  {
    day: 25,
    date: "2026-10-25",
    dayOfWeek: "Sunday",
    status: "WEEK_OFF",
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
  {
    day: 26,
    date: "2026-10-26",
    dayOfWeek: "Monday",
    status: "PRESENT",
    firstIn: "09:21",
    lastOut: "18:35",
    workingHours: 9.2,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 27,
    date: "2026-10-27",
    dayOfWeek: "Tuesday",
    status: "PRESENT",
    firstIn: "09:18",
    lastOut: "18:30",
    workingHours: 9.2,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 28,
    date: "2026-10-28",
    dayOfWeek: "Wednesday",
    status: "ABSENT",
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
  {
    day: 29,
    date: "2026-10-29",
    dayOfWeek: "Thursday",
    status: "PRESENT",
    firstIn: "09:23",
    lastOut: "18:36",
    workingHours: 9.2,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 30,
    date: "2026-10-30",
    dayOfWeek: "Friday",
    status: "PRESENT",
    firstIn: "09:16",
    lastOut: "18:25",
    workingHours: 9.15,
    lateMinutes: 0,
    inSource: "BIOMETRIC_DEVICE",
    inLocation: "Pune Hinjawadi Gate 1 (eSSL Device)",
    outSource: "WEB",
    outLocation: "Web Portal Punch-Out",
  },
  {
    day: 31,
    date: "2026-10-31",
    dayOfWeek: "Saturday",
    status: "WEEK_OFF",
    firstIn: null,
    lastOut: null,
    workingHours: 0,
    lateMinutes: 0,
  },
];

/**
 * Generates 31 full days of attendance records for October 2026 for a given employee.
 * Optionally integrates any live existing records (e.g. today's live punches on 2026-10-06).
 */
export function generate31DaysEmployeeAttendance(
  employeeId: string,
  shiftId: string = "shift-gen",
  existingRecords: AttendanceRecord[] = []
): AttendanceRecord[] {
  const existingMap = new Map<string, AttendanceRecord>();
  for (const rec of existingRecords) {
    if (rec.employeeId === employeeId) {
      existingMap.set(rec.date, rec);
    }
  }

  return OCTOBER_2026_DAYS.map((dayPlan) => {
    // If there is an existing live record for today (2026-10-06) or this date, use it
    if (existingMap.has(dayPlan.date)) {
      return existingMap.get(dayPlan.date)!;
    }

    const punches: PunchLog[] = [];
    if (dayPlan.firstIn) {
      punches.push({
        id: `p-${employeeId}-${dayPlan.day}-in`,
        time: dayPlan.firstIn,
        type: "IN",
        source: dayPlan.inSource || "BIOMETRIC_DEVICE",
        location: dayPlan.inLocation || "Pune Hinjawadi Gate 1 (eSSL Device)",
      });
    }

    if (dayPlan.lastOut) {
      punches.push({
        id: `p-${employeeId}-${dayPlan.day}-out`,
        time: dayPlan.lastOut,
        type: "OUT",
        source: dayPlan.outSource || "WEB",
        location: dayPlan.outLocation || "Web Portal Punch-Out",
      });
    }

    return {
      id: `att-${dayPlan.date}-${employeeId}`,
      employeeId,
      date: dayPlan.date,
      shiftId,
      firstIn: dayPlan.firstIn,
      lastOut: dayPlan.lastOut,
      workingHours: dayPlan.workingHours,
      lateMinutes: dayPlan.lateMinutes,
      status: dayPlan.status,
      punches,
      regularizationId: dayPlan.regularizationId,
    };
  });
}
