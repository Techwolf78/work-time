/**
 * GA-Work-Time Real-time Firestore Telemetry Service
 * 
 * Provides real-time subscriptions (onSnapshot) to:
 * - `timetrack_devices` (Workstation heartbeats and live statuses)
 * - `timetrack_activity_logs` (Micro-interval activity timeline)
 * - `timetrack_daily_summaries` (Aggregated day summaries & focus ratios)
 * - CRM `users` (Active organization staff list)
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { TIMETRACK_COLLECTIONS, CRM_COLLECTIONS } from "./collections";

export interface TelemetryDevice {
  id: string;
  deviceId: string;
  hostname: string;
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
  department?: string;
  os: string;
  agentVersion: string;
  status: "active" | "idle" | "offline";
  currentApp: string;
  windowTitle?: string;
  idleSeconds?: number;
  online: boolean;
  lastHeartbeat: string;
  todayTrackedSeconds?: number;
  todayActiveSeconds?: number;
  todayIdleSeconds?: number;
  focusRatio?: string;
}

export interface ActivityIntervalRecord {
  id: string;
  intervalId: string;
  employeeId: string;
  employeeEmail?: string;
  employeeName?: string;
  deviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO 8601
  endTime: string;
  startDisplay: string;
  endDisplay: string;
  durationSeconds: number;
  durationMinutes: number;
  durationDisplay: string;
  state: "active" | "idle" | "locked";
  executable: string;
  windowTitle: string;
  category: "work" | "neutral" | "restricted";
  inactivityReason?: string;
  createdAt?: string;
}

export interface ConsolidatedIntervalRecord extends ActivityIntervalRecord {
  tickCount: number; // how many 15s micro-intervals were merged
  subTitles: string[]; // unique window titles within this continuous session
  rawIntervals: ActivityIntervalRecord[]; // underlying raw ticks for modal breakdown
}

export interface ClubbedAppRecord {
  appKey: string; // normalized executable key (e.g. "antigravity ide")
  appName: string; // clean display name (e.g. "Antigravity IDE", "Google Chrome", "Brave")
  executable: string; // original executable filename
  totalSeconds: number; // total cumulative seconds across the day
  totalDisplay: string; // e.g. "6h 18m" or "15s"
  percentage: number; // percentage of total tracked workday
  percentageDisplay: string; // e.g. "72.4%"
  activeSeconds: number;
  idleSeconds: number;
  lockedSeconds: number;
  category: "work" | "neutral" | "restricted";
  heartbeatCount: number;
  sessionCount: number;
  firstSeenDisplay: string;
  lastSeenDisplay: string;
  windowTitles: { title: string; seconds: number; count: number; percentage: number }[];
  sessions: ConsolidatedIntervalRecord[];
  rawIntervals: ActivityIntervalRecord[];
}

export interface DailySummaryRecord {
  id: string;
  summaryId: string;
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
  department?: string;
  deviceId: string;
  date: string;
  observedSeconds: number;
  activeSeconds: number;
  idleSeconds: number;
  lockedSeconds: number;
  focusRatio: string;
  focusRatioNum: number;
  topApp: string;
  status: "In Progress" | "Full Shift" | "Partial Shift";
  inactivityNote?: string;
  updatedAt?: string;
}

export interface CrmEmployeeSummary {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  designation?: string;
  status: "active" | "inactive";
}

/**
 * Format seconds into human readable duration e.g. "6h 45m" or "52s"
 */
export function formatSecondsToDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h === 0) return `${remM}m`;
  return `${h}h ${remM}m`;
}

/**
 * Get today's local date string YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 1. Subscribe to Live Workstation Devices in Firestore
 */
export function subscribeToTelemetryDevices(
  callback: (devices: TelemetryDevice[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, TIMETRACK_COLLECTIONS.DEVICES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const devices: TelemetryDevice[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const rawStatus = String(data.status || "offline").toLowerCase().trim();
        const normalizedStatus: "active" | "idle" | "offline" =
          rawStatus === "active" ? "active" : rawStatus === "idle" ? "idle" : "offline";

        devices.push({
          id: docSnap.id,
          deviceId: data.deviceId || docSnap.id,
          hostname: data.hostname || docSnap.id,
          employeeId: data.employeeId || "",
          employeeEmail: data.employeeEmail || "",
          employeeName: data.employeeName || data.hostname || "Workstation",
          department: data.department || "Engineering",
          os: data.os || "Windows 11",
          agentVersion: data.agentVersion || "v1.2.0",
          status: normalizedStatus,
          currentApp: data.currentApp || "System",
          windowTitle: data.windowTitle || "",
          idleSeconds: Number(data.idleSeconds) || 0,
          online: Boolean(data.online),
          lastHeartbeat: data.lastHeartbeat || new Date().toISOString(),
          todayTrackedSeconds: Number(data.todayTrackedSeconds) || 0,
          todayActiveSeconds: Number(data.todayActiveSeconds) || 0,
          todayIdleSeconds: Number(data.todayIdleSeconds) || 0,
          focusRatio: data.focusRatio || "100%",
        });
      });
      callback(devices);
    },
    (err) => {
      console.warn("Error listening to timetrack_devices:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Helper to safely extract an ISO string from a Firestore Timestamp, Date, string, or number
 */
export function parseTimestampToIso(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val.toDate === "function") {
    try {
      return val.toDate().toISOString();
    } catch {
      return "";
    }
  }
  if (typeof val.seconds === "number") {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (typeof val === "number") {
    return new Date(val).toISOString();
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  return "";
}

/**
 * Helper to safely format a timestamp or ISO string into a local HH:mm display string in the user's browser timezone
 */
export function parseTimeToDisplay(val: any, fallbackIso?: string): string {
  const target = val || fallbackIso;
  if (!target) return "--:--";

  try {
    let dateObj: Date | null = null;
    if (target instanceof Date) {
      dateObj = target;
    } else if (typeof target.toDate === "function") {
      dateObj = target.toDate();
    } else if (typeof target === "string") {
      // If it's already a clean simple time string without date e.g. "17:05"
      if (/^\d{2}:\d{2}$/.test(target.trim())) {
        return target.trim();
      }
      dateObj = new Date(target);
    } else if (typeof target.seconds === "number") {
      dateObj = new Date(target.seconds * 1000);
    } else if (typeof target === "number") {
      dateObj = new Date(target);
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }
  } catch (err) {
    console.warn("Error parsing local time:", err);
  }

  return "--:--";
}

/**
 * Helper to safely extract local YYYY-MM-DD date from a timestamp in browser's local timezone
 */
export function parseDateToLocalYmd(val: any): string {
  if (!val) return "";
  try {
    let dateObj: Date | null = null;
    if (val instanceof Date) dateObj = val;
    else if (typeof val.toDate === "function") dateObj = val.toDate();
    else if (typeof val === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) return val.trim();
      dateObj = new Date(val);
    } else if (typeof val.seconds === "number") dateObj = new Date(val.seconds * 1000);
    else if (typeof val === "number") dateObj = new Date(val);

    if (dateObj && !isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  } catch { }
  return "";
}

/**
 * Helper to format timestamp into local HH:mm:ss with seconds for 15s detailed breakdown
 */
export function parseTimeToDisplayWithSec(val: any, fallbackIso?: string): string {
  const target = val || fallbackIso;
  if (!target) return "--:--:--";
  try {
    let dateObj: Date | null = null;
    if (target instanceof Date) dateObj = target;
    else if (typeof target.toDate === "function") dateObj = target.toDate();
    else if (typeof target === "string") {
      if (/^\d{2}:\d{2}:\d{2}$/.test(target.trim())) return target.trim();
      dateObj = new Date(target);
    } else if (typeof target.seconds === "number") dateObj = new Date(target.seconds * 1000);
    else if (typeof target === "number") dateObj = new Date(target);

    if (dateObj && !isNaN(dateObj.getTime())) {
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      const seconds = String(dateObj.getSeconds()).padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    }
  } catch {}
  return "--:--:--";
}

/**
 * Normalizes executable string for robust comparison (case-insensitive, trims .exe)
 */
export function normalizeExecutableName(name?: string): string {
  if (!name) return "Unknown";
  return name.trim().toLowerCase().replace(/\.exe$/i, "");
}

/**
 * Consolidates consecutive 15-second heartbeat intervals of the same application/state
 * into clean, uninterrupted session blocks (e.g. 15:58 - 16:45 47m Antigravity IDE).
 * 
 * Consecutive intervals are clubbed together if:
 * 1. They share the same normalized executable (e.g. "Antigravity IDE")
 * 2. They share the same state ("active", "idle", or "locked")
 * 3. They share the same category ("work", "neutral", or "restricted")
 * 4. The time gap between the previous interval's end and current start is <= maxGapSeconds (default 90s)
 * 5. They share the same employeeId
 * 
 * If any of these change (user switches app, goes idle, locks screen, or leaves),
 * the streak breaks and a new session block starts.
 */
export function consolidateActivityIntervals(
  logs: ActivityIntervalRecord[],
  maxGapSeconds: number = 90
): ConsolidatedIntervalRecord[] {
  if (!logs || logs.length === 0) return [];

  // Sort ascending by startTime
  const sorted = [...logs].sort((a, b) => {
    const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return timeA - timeB;
  });

  const consolidated: ConsolidatedIntervalRecord[] = [];
  let currentGroup: ConsolidatedIntervalRecord | null = null;

  for (const log of sorted) {
    if (!currentGroup) {
      currentGroup = {
        ...log,
        tickCount: 1,
        subTitles: log.windowTitle ? [log.windowTitle] : [],
        rawIntervals: [log],
      };
      continue;
    }

    const sameExe =
      normalizeExecutableName(log.executable) ===
      normalizeExecutableName(currentGroup.executable);

    const sameState = log.state === currentGroup.state;
    const sameCategory = log.category === currentGroup.category;
    const sameEmp =
      !log.employeeId ||
      !currentGroup.employeeId ||
      log.employeeId.toLowerCase().trim() === currentGroup.employeeId.toLowerCase().trim();

    // Check time continuity
    let continuousTime = true;
    if (currentGroup.endTime && log.startTime) {
      const prevEndMs = new Date(currentGroup.endTime).getTime();
      const nextStartMs = new Date(log.startTime).getTime();
      if (!isNaN(prevEndMs) && !isNaN(nextStartMs)) {
        const gapSec = (nextStartMs - prevEndMs) / 1000;
        // Normal heartbeat is 15s. If gap > maxGapSeconds (e.g. 90s), workstation went to sleep or was off
        if (gapSec > maxGapSeconds || gapSec < -300) {
          continuousTime = false;
        }
      }
    }

    if (sameExe && sameState && sameCategory && sameEmp && continuousTime) {
      // Merge into current group
      currentGroup.endTime = log.endTime || currentGroup.endTime;
      currentGroup.endDisplay = log.endDisplay || currentGroup.endDisplay;
      currentGroup.durationSeconds =
        (currentGroup.durationSeconds || 0) + (log.durationSeconds || 15);
      currentGroup.durationMinutes = Math.round(currentGroup.durationSeconds / 60);
      currentGroup.durationDisplay = formatSecondsToDuration(currentGroup.durationSeconds);
      currentGroup.tickCount += 1;

      if (log.windowTitle) {
        currentGroup.windowTitle = log.windowTitle;
        if (!currentGroup.subTitles.includes(log.windowTitle)) {
          currentGroup.subTitles.push(log.windowTitle);
        }
      }

      currentGroup.rawIntervals.push(log);
    } else {
      // Streak broken! Push previous group and start new group
      consolidated.push(currentGroup);
      currentGroup = {
        ...log,
        tickCount: 1,
        subTitles: log.windowTitle ? [log.windowTitle] : [],
        rawIntervals: [log],
      };
    }
  }

  if (currentGroup) {
    consolidated.push(currentGroup);
  }

  return consolidated;
}

/**
 * Aggregates all intervals for an employee across the day clubbed by Application.
 * E.g. Antigravity IDE 6 hrs, Brave 3 hrs, Teams 15m, Snipping Tool 15s.
 * Computes exact cumulative time, percentage of workday, active vs idle split,
 * and top window titles/tabs used within that app.
 */
export function aggregateClubbedApps(logs: ActivityIntervalRecord[]): ClubbedAppRecord[] {
  if (!logs || logs.length === 0) return [];

  const groups = new Map<string, ActivityIntervalRecord[]>();
  let grandTotalSeconds = 0;

  logs.forEach((log) => {
    const key = normalizeExecutableName(log.executable) || "unknown";
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(log);
    const sec = log.durationSeconds && log.durationSeconds > 0 ? log.durationSeconds : 15;
    grandTotalSeconds += sec;
  });

  const result: ClubbedAppRecord[] = [];

  groups.forEach((groupLogs, key) => {
    let totalSec = 0;
    let activeSec = 0;
    let idleSec = 0;
    let lockedSec = 0;
    const titleMap = new Map<string, { seconds: number; count: number }>();
    let bestName = "";
    let bestExe = "";
    let earliestTime = Infinity;
    let latestTime = -Infinity;
    const categoryVotes: Record<string, number> = { work: 0, neutral: 0, restricted: 0 };

    groupLogs.forEach((l) => {
      const sec = l.durationSeconds && l.durationSeconds > 0 ? l.durationSeconds : 15;
      totalSec += sec;

      const isLock =
        (l.executable || "").toLowerCase().includes("lockapp") ||
        (l.executable || "").toLowerCase().includes("logonui") ||
        (l.windowTitle || "").toLowerCase().includes("lock screen");

      const state = isLock ? "locked" : (l.state || "").toLowerCase().trim();
      if (state === "locked") lockedSec += sec;
      else if (state === "idle") idleSec += sec;
      else activeSec += sec;

      const cat = l.category || "work";
      categoryVotes[cat] = (categoryVotes[cat] || 0) + 1;

      const title = (l.windowTitle || "").trim() || (state === "locked" ? "Screen Locked / Break" : "Focused Workspace");
      const existing = titleMap.get(title) || { seconds: 0, count: 0 };
      titleMap.set(title, {
        seconds: existing.seconds + sec,
        count: existing.count + 1,
      });

      if (!bestName && l.executable) bestName = l.executable;
      if (!bestExe && l.executable) bestExe = l.executable;

      const st = l.startTime ? new Date(l.startTime).getTime() : 0;
      const et = l.endTime ? new Date(l.endTime).getTime() : st;
      if (st && st < earliestTime) earliestTime = st;
      if (et && et > latestTime) latestTime = et;
    });

    const windowTitles = Array.from(titleMap.entries())
      .map(([title, data]) => ({
        title,
        seconds: data.seconds,
        count: data.count,
        percentage: totalSec > 0 ? Math.round((data.seconds / totalSec) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.seconds - a.seconds);

    let dominantCat: "work" | "neutral" | "restricted" = "work";
    if ((categoryVotes.restricted || 0) > (categoryVotes.work || 0) && (categoryVotes.restricted || 0) > (categoryVotes.neutral || 0)) {
      dominantCat = "restricted";
    } else if ((categoryVotes.neutral || 0) > (categoryVotes.work || 0)) {
      dominantCat = "neutral";
    }

    const pct = grandTotalSeconds > 0 ? (totalSec / grandTotalSeconds) * 100 : 0;
    const consolidatedSessions = consolidateActivityIntervals(groupLogs);

    result.push({
      appKey: key,
      appName: bestName || key,
      executable: bestExe || key,
      totalSeconds: totalSec,
      totalDisplay: formatSecondsToDuration(totalSec),
      percentage: Math.round(pct * 10) / 10,
      percentageDisplay: `${Math.round(pct * 10) / 10}%`,
      activeSeconds: activeSec,
      idleSeconds: idleSec,
      lockedSeconds: lockedSec,
      category: dominantCat,
      heartbeatCount: groupLogs.length,
      sessionCount: consolidatedSessions.length,
      firstSeenDisplay: earliestTime < Infinity ? parseTimeToDisplay(new Date(earliestTime)) : "--:--",
      lastSeenDisplay: latestTime > -Infinity ? parseTimeToDisplay(new Date(latestTime)) : "--:--",
      windowTitles,
      sessions: consolidatedSessions,
      rawIntervals: groupLogs,
    });
  });

  return result.sort((a, b) => b.totalSeconds - a.totalSeconds);
}

/**
 * 2. Subscribe to Activity Intervals for Timeline
 */
export function subscribeToActivityLogs(
  options: { employeeId?: string; date?: string; limitCount?: number },
  callback: (logs: ActivityIntervalRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, TIMETRACK_COLLECTIONS.LOGS);
  
  // Note: we fetch without complex multi-field inequality to avoid composite index requirements
  return onSnapshot(
    colRef,
    (snapshot) => {
      let logs: ActivityIntervalRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const startIso = parseTimestampToIso(data.startTime);
        const endIso = parseTimestampToIso(data.endTime);
        const startDisplay = parseTimeToDisplay(data.startTime, startIso);
        const endDisplay = parseTimeToDisplay(data.endTime, endIso);
        let durationSec = Number(data.durationSeconds) || 0;
        if (durationSec <= 0 && startIso && endIso) {
          const diff = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000);
          if (diff > 0) durationSec = diff;
        }
        if (durationSec <= 0) {
          durationSec = 15;
        }

        const durationMin = Math.round(durationSec / 60);
        const localDate = parseDateToLocalYmd(data.startTime) || data.date || (startIso ? startIso.substring(0, 10) : "");

        const appName = String(data.executable || data.application || "System").trim();
        const winTitle = String(data.windowTitle || "").trim();

        // Auto-detect Windows Lock Screen (LockApp, LogonUI, or lock screen window title)
        const isLockScreen =
          appName.toLowerCase().includes("lockapp") ||
          appName.toLowerCase().includes("logonui") ||
          winTitle.toLowerCase().includes("lock screen") ||
          winTitle.toLowerCase().includes("windows default lock");

        const rawState = String(data.state || "active").toLowerCase().trim();
        let normalizedState: "active" | "idle" | "locked" =
          rawState === "idle" ? "idle" : rawState === "locked" ? "locked" : "active";

        if (isLockScreen) {
          normalizedState = "locked";
        }

        const rawCat = String(data.category || "work").toLowerCase().trim();
        let normalizedCategory: "work" | "neutral" | "restricted" =
          rawCat === "neutral" ? "neutral" : rawCat === "restricted" ? "restricted" : "work";

        if (isLockScreen) {
          normalizedCategory = "neutral";
        }

        const displayTitle = isLockScreen
          ? (winTitle && !winTitle.includes("Focused Workspace") ? winTitle : "Screen Locked / Break")
          : (winTitle || "Focused Workspace");

        logs.push({
          id: docSnap.id,
          intervalId: data.intervalId || docSnap.id,
          employeeId: data.employeeId || "",
          employeeEmail: data.employeeEmail || "",
          employeeName: data.employeeName || "",
          deviceId: data.deviceId || "",
          date: localDate,
          startTime: startIso,
          endTime: endIso,
          startDisplay: startDisplay,
          endDisplay: endDisplay,
          durationSeconds: durationSec,
          durationMinutes: durationMin,
          durationDisplay: data.durationDisplay || formatSecondsToDuration(durationSec),
          state: normalizedState,
          executable: isLockScreen ? "LockApp" : appName,
          windowTitle: displayTitle,
          category: normalizedCategory,
          inactivityReason: data.inactivityReason,
          createdAt: data.createdAt,
        });
      });

      // Filter in-memory for requested employeeId and/or date
      if (options.employeeId) {
        const target = options.employeeId.toLowerCase().trim();
        logs = logs.filter(
          (l) =>
            l.employeeId.toLowerCase().trim() === target ||
            (l.employeeEmail && l.employeeEmail.toLowerCase().trim() === target)
        );
      }
      if (options.date) {
        logs = logs.filter(
          (l) =>
            l.date === options.date ||
            parseDateToLocalYmd(l.startTime) === options.date
        );
      }

      // Sort chronologically ascending safely
      logs.sort((a, b) => {
        const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return timeA - timeB;
      });

      if (options.limitCount && logs.length > options.limitCount) {
        logs = logs.slice(-options.limitCount);
      }

      callback(logs);
    },
    (err) => {
      console.warn("Error listening to timetrack_activity_logs:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * 3. Subscribe to Daily Summaries
 */
export function subscribeToDailySummaries(
  dateStr: string,
  callback: (summaries: DailySummaryRecord[]) => void,
  onError?: (err) => void
): () => void {
  const colRef = collection(db, TIMETRACK_COLLECTIONS.DAILY_SUMMARIES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const summaries: DailySummaryRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!dateStr || data.date === dateStr) {
          summaries.push({
            id: docSnap.id,
            summaryId: data.summaryId || docSnap.id,
            employeeId: data.employeeId || "",
            employeeEmail: data.employeeEmail || "",
            employeeName: data.employeeName || "Employee",
            department: data.department || "Operations",
            deviceId: data.deviceId || "",
            date: data.date || dateStr,
            observedSeconds: data.observedSeconds || 0,
            activeSeconds: data.activeSeconds || 0,
            idleSeconds: data.idleSeconds || 0,
            lockedSeconds: data.lockedSeconds || 0,
            focusRatio: data.focusRatio || "100%",
            focusRatioNum: data.focusRatioNum || 100,
            topApp: data.topApp || "System",
            status: (data.status as any) || "In Progress",
            inactivityNote: data.inactivityNote,
            updatedAt: data.updatedAt,
          });
        }
      });
      callback(summaries);
    },
    (err) => {
      console.warn("Error listening to timetrack_daily_summaries:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * 4. Fetch all Daily Summaries (for historical reports)
 */
export async function fetchAllDailySummaries(): Promise<DailySummaryRecord[]> {
  try {
    const colRef = collection(db, TIMETRACK_COLLECTIONS.DAILY_SUMMARIES);
    const snap = await getDocs(colRef);
    const list: DailySummaryRecord[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        summaryId: data.summaryId || docSnap.id,
        employeeId: data.employeeId || "",
        employeeEmail: data.employeeEmail || "",
        employeeName: data.employeeName || "Employee",
        department: data.department || "Operations",
        deviceId: data.deviceId || "",
        date: data.date || "",
        observedSeconds: data.observedSeconds || 0,
        activeSeconds: data.activeSeconds || 0,
        idleSeconds: data.idleSeconds || 0,
        lockedSeconds: data.lockedSeconds || 0,
        focusRatio: data.focusRatio || "100%",
        focusRatioNum: data.focusRatioNum || 100,
        topApp: data.topApp || "System",
        status: (data.status as any) || "In Progress",
        inactivityNote: data.inactivityNote,
        updatedAt: data.updatedAt,
      });
    });
    return list;
  } catch (err) {
    console.warn("Could not fetch daily summaries:", err);
    return [];
  }
}

/**
 * 5. Fetch real employees from CRM `users` collection
 */
export async function fetchCrmEmployees(): Promise<CrmEmployeeSummary[]> {
  try {
    const qUsers = query(collection(db, CRM_COLLECTIONS.USERS), limit(100));
    const snap = await getDocs(qUsers);
    const users: CrmEmployeeSummary[] = [];

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d.email) {
        users.push({
          id: docSnap.id,
          name: d.name || d.displayName || d.email.split("@")[0],
          email: d.email,
          department: d.department || d.departments?.[0] || "Operations",
          role: d.role || "Executive",
          designation: d.role || "Staff",
          status: d.isActive !== false ? "active" : "inactive",
        });
      }
    });

    return users;
  } catch (err) {
    console.warn("Could not fetch CRM employees:", err);
    return [];
  }
}

/**
 * 6. Save Inactivity Explanation Note to Firestore
 */
export async function saveInactivityExplanation(
  summaryId: string,
  note: string,
  employeeEmail: string
): Promise<void> {
  const summaryRef = doc(db, TIMETRACK_COLLECTIONS.DAILY_SUMMARIES, summaryId);
  await setDoc(summaryRef, { inactivityNote: note }, { merge: true });

  const noteId = `note_${Date.now()}`;
  const noteRef = doc(db, TIMETRACK_COLLECTIONS.INACTIVITY_NOTES, noteId);
  await setDoc(noteRef, {
    noteId,
    summaryId,
    employeeEmail,
    note,
    createdAt: new Date().toISOString(),
  });
}
