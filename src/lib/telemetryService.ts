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
          status: (data.status as any) || "offline",
          currentApp: data.currentApp || "System",
          windowTitle: data.windowTitle || "",
          idleSeconds: data.idleSeconds || 0,
          online: Boolean(data.online),
          lastHeartbeat: data.lastHeartbeat || new Date().toISOString(),
          todayTrackedSeconds: data.todayTrackedSeconds || 0,
          todayActiveSeconds: data.todayActiveSeconds || 0,
          todayIdleSeconds: data.todayIdleSeconds || 0,
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
 * Helper to safely extract a HH:mm display string from a timestamp or ISO string
 */
export function parseTimeToDisplay(val: any, fallbackIso?: string): string {
  if (val && typeof val === "string" && val.length >= 5) {
    if (val.includes("T")) {
      const parts = val.split("T")[1];
      return parts ? parts.substring(0, 5) : val.substring(0, 5);
    }
    return val.substring(0, 5);
  }
  const iso = parseTimestampToIso(val) || fallbackIso;
  if (iso && iso.includes("T")) {
    const parts = iso.split("T")[1];
    return parts ? parts.substring(0, 5) : "";
  }
  return "--:--";
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
        const startDisplay = data.startDisplay || parseTimeToDisplay(data.startTime, startIso);
        const endDisplay = data.endDisplay || parseTimeToDisplay(data.endTime, endIso);
        const durationSec = Number(data.durationSeconds) || 0;
        const durationMin = Math.round(durationSec / 60);

        logs.push({
          id: docSnap.id,
          intervalId: data.intervalId || docSnap.id,
          employeeId: data.employeeId || "",
          employeeEmail: data.employeeEmail || "",
          employeeName: data.employeeName || "",
          deviceId: data.deviceId || "",
          date: data.date || (startIso ? startIso.substring(0, 10) : ""),
          startTime: startIso,
          endTime: endIso,
          startDisplay: startDisplay,
          endDisplay: endDisplay,
          durationSeconds: durationSec,
          durationMinutes: durationMin,
          durationDisplay: data.durationDisplay || formatSecondsToDuration(durationSec),
          state: (data.state as any) || "active",
          executable: data.executable || data.application || "System",
          windowTitle: data.windowTitle || "",
          category: (data.category as any) || "work",
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
        logs = logs.filter((l) => l.date === options.date);
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
