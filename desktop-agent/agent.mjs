/**
 * GA-Work-Time (WorkPulse) Native Desktop Telemetry Agent
 * 
 * Runs as a background probe daemon on Windows workstations, sampling Win32
 * foreground window titles, active process executables, and physical keyboard/mouse
 * idle time via P/Invoke APIs, streaming structured telemetry to Firestore.
 */

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase Configurations
const FIREBASE_CONFIGS = {
  dev: {
    apiKey: "AIzaSyD9SBw0ZckY3ht0CwH39C5pPRWwkR2zR4M",
    authDomain: "authencation-39485.firebaseapp.com",
    databaseURL: "https://authencation-39485-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "authencation-39485",
    storageBucket: "authencation-39485.firebasestorage.app",
    messagingSenderId: "366538675183",
    appId: "1:366538675183:web:8504a18fce2d563c491c1a",
  },
  prod: {
    apiKey: "AIzaSyCxxJYJwEUDm4O5ZWRC2rLG3F0Q7f-icWA",
    authDomain: "gryphon-sync.firebaseapp.com",
    projectId: "gryphon-sync",
    storageBucket: "gryphon-sync.firebasestorage.app",
    messagingSenderId: "711708349362",
    appId: "1:711708349362:web:e69239dbaafc2971490aab",
  },
};

// Default Configuration File
const CONFIG_PATH = resolve(__dirname, "config.json");

function loadConfig() {
  const defaults = {
    env: "dev",
    email: "ajay@gryphonacademy.co.in",
    password: "",
    sampleCadenceSeconds: 5,
    flushCadenceSeconds: 30,
    deviceId: os.hostname(),
  };

  if (existsSync(CONFIG_PATH)) {
    try {
      const parsed = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
      return { ...defaults, ...parsed };
    } catch (e) {
      console.warn("Could not read config.json, using defaults.");
    }
  } else {
    try {
      writeFileSync(CONFIG_PATH, JSON.stringify(defaults, null, 2), "utf-8");
    } catch (e) {}
  }
  return defaults;
}

// Parse Command Line Flags
function parseArgs(defaults) {
  const args = process.argv.slice(2);
  const config = { ...defaults };

  for (const arg of args) {
    if (arg.startsWith("--env=")) config.env = arg.split("=")[1].trim();
    if (arg.startsWith("--email=")) config.email = arg.split("=")[1].trim();
    if (arg.startsWith("--password=")) config.password = arg.split("=")[1].trim();
    if (arg.startsWith("--cadence=")) config.sampleCadenceSeconds = parseInt(arg.split("=")[1].trim(), 10) || 5;
    if (arg.startsWith("--flush=")) config.flushCadenceSeconds = parseInt(arg.split("=")[1].trim(), 10) || 30;
  }
  return config;
}

const config = parseArgs(loadConfig());
const fbConfig = FIREBASE_CONFIGS[config.env] || FIREBASE_CONFIGS.dev;

const app = initializeApp(fbConfig, "desktop-telemetry-agent");
const db = getFirestore(app);
const auth = getAuth(app);

// State tracking
let currentEmployee = {
  id: "EMP-1001",
  name: "Ajay Pawar",
  email: config.email,
  department: "Engineering",
};

let activeInterval = null;
let appUsageSeconds = {};
let todayTotals = {
  activeSeconds: 0,
  idleSeconds: 0,
  lockedSeconds: 0,
  totalSeconds: 0,
};

function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTimeDisplay(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h === 0) return `${remM}m`;
  return `${h}h ${remM}m`;
}

// Resolve user profile from CRM
async function resolveUserProfile() {
  console.log(`\x1b[36m[Agent Init]\x1b[0m Resolving CRM profile for ${config.email}...`);

  // If password provided, sign in with Firebase Auth
  if (config.password) {
    try {
      await signInWithEmailAndPassword(auth, config.email, config.password);
      console.log(`\x1b[32m[Auth]\x1b[0m Authenticated with Firebase Auth.`);
    } catch (err) {
      console.warn(`\x1b[33m[Auth]\x1b[0m Firebase Auth notice: ${err.message}`);
    }
  }

  try {
    const qUsers = query(
      collection(db, "users"),
      where("email", "==", config.email.trim().toLowerCase()),
      limit(1)
    );
    const snap = await getDocs(qUsers);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      currentEmployee = {
        id: snap.docs[0].id,
        name: data.name || data.displayName || config.email.split("@")[0],
        email: config.email,
        department: data.department || data.departments?.[0] || "Operations",
        role: data.role || "Executive",
      };
      console.log(
        `\x1b[32m[Profile Found]\x1b[0m ${currentEmployee.name} (${currentEmployee.department}) | Role: ${currentEmployee.role}`
      );
      return;
    }
  } catch (err) {
    console.warn(`\x1b[33m[Profile]\x1b[0m Could not query users collection: ${err.message}`);
  }

  console.log(`\x1b[33m[Profile Default]\x1b[0m Using default employee profile for ${config.email}`);
}

// Execute Win32 probe script
function runProbe() {
  return new Promise((resolvePromise) => {
    const probeScript = resolve(__dirname, "probe.ps1");
    const ps = spawn("powershell", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      probeScript,
    ]);

    let stdout = "";
    let stderr = "";

    ps.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    ps.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ps.on("close", (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout.trim());
          resolvePromise(parsed);
          return;
        } catch (e) {}
      }
      // Fallback
      resolvePromise({
        windowTitle: "",
        processName: "System",
        idleSeconds: 0,
        state: "ACTIVE",
        category: "work",
        computerName: os.hostname(),
        windowsUser: os.userInfo().username,
        timestamp: new Date().toISOString(),
      });
    });
  });
}

// Sync device heartbeat to Firestore
async function syncDeviceHeartbeat(probeData) {
  const deviceDocRef = doc(db, "timetrack_devices", config.deviceId);
  const now = new Date();

  const total = todayTotals.activeSeconds + todayTotals.idleSeconds + todayTotals.lockedSeconds;
  const ratio = total > 0 ? Math.round((todayTotals.activeSeconds / total) * 100) : 100;

  const deviceData = {
    id: config.deviceId,
    deviceId: config.deviceId,
    hostname: os.hostname(),
    employeeId: currentEmployee.id,
    employeeEmail: currentEmployee.email,
    employeeName: currentEmployee.name,
    department: currentEmployee.department,
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    agentVersion: "v1.2.0",
    status: probeData.state.toLowerCase(),
    currentApp: probeData.processName || "System",
    windowTitle: probeData.windowTitle || "",
    idleSeconds: probeData.idleSeconds || 0,
    online: true,
    lastHeartbeat: now.toISOString(),
    todayTrackedSeconds: total,
    todayActiveSeconds: todayTotals.activeSeconds,
    todayIdleSeconds: todayTotals.idleSeconds,
    focusRatio: `${ratio}%`,
  };

  try {
    await setDoc(deviceDocRef, deviceData, { merge: true });
  } catch (err) {
    console.error(`\x1b[31m[Heartbeat Error]\x1b[0m ${err.message}`);
  }
}

// Flush activity interval to Firestore
async function flushInterval(interval) {
  if (!interval || interval.durationSeconds < 2) return;

  const dateStr = getTodayString();
  const docId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const logDocRef = doc(db, "timetrack_activity_logs", docId);

  const durationMin = Math.max(1, Math.round(interval.durationSeconds / 60));
  const record = {
    id: docId,
    intervalId: docId,
    employeeId: currentEmployee.id,
    employeeEmail: currentEmployee.email,
    employeeName: currentEmployee.name,
    deviceId: config.deviceId,
    date: dateStr,
    startTime: interval.startTime.toISOString(),
    endTime: interval.endTime.toISOString(),
    startDisplay: formatTimeDisplay(interval.startTime),
    endDisplay: formatTimeDisplay(interval.endTime),
    durationSeconds: interval.durationSeconds,
    durationMinutes: durationMin,
    durationDisplay: formatDuration(interval.durationSeconds),
    state: interval.state.toLowerCase(),
    executable: interval.processName,
    windowTitle: interval.windowTitle || interval.processName,
    category: interval.category || "work",
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(logDocRef, record);
    console.log(
      `\x1b[32m[Interval Flushed]\x1b[0m ${record.durationDisplay} [${record.state.toUpperCase()}] ${record.executable} - ${record.windowTitle.substring(0, 45)}`
    );
  } catch (err) {
    console.error(`\x1b[31m[Flush Log Error]\x1b[0m ${err.message}`);
  }

  // Update Daily Summary
  await updateDailySummary(dateStr);
}

// Update Daily Summary
async function updateDailySummary(dateStr) {
  const summaryId = `${currentEmployee.id}_${dateStr}`;
  const summaryRef = doc(db, "timetrack_daily_summaries", summaryId);

  // Determine top application
  let topApp = "Workstation";
  let maxSec = -1;
  for (const [app, sec] of Object.entries(appUsageSeconds)) {
    if (sec > maxSec) {
      maxSec = sec;
      topApp = app;
    }
  }

  const total = todayTotals.activeSeconds + todayTotals.idleSeconds + todayTotals.lockedSeconds;
  const ratio = total > 0 ? Math.round((todayTotals.activeSeconds / total) * 100) : 100;

  const summaryRecord = {
    id: summaryId,
    summaryId,
    employeeId: currentEmployee.id,
    employeeEmail: currentEmployee.email,
    employeeName: currentEmployee.name,
    department: currentEmployee.department,
    deviceId: config.deviceId,
    date: dateStr,
    observedSeconds: total,
    activeSeconds: todayTotals.activeSeconds,
    idleSeconds: todayTotals.idleSeconds,
    lockedSeconds: todayTotals.lockedSeconds,
    focusRatio: `${ratio}%`,
    focusRatioNum: ratio,
    topApp,
    status: total >= 28800 ? "Full Shift" : "In Progress",
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(summaryRef, summaryRecord, { merge: true });
  } catch (err) {
    console.error(`\x1b[31m[Summary Error]\x1b[0m ${err.message}`);
  }
}

// Set device offline on shutdown
async function markDeviceOffline() {
  console.log("\n\x1b[33m[Agent Exiting]\x1b[0m Setting device status to offline in Firestore...");
  if (activeInterval) {
    activeInterval.endTime = new Date();
    activeInterval.durationSeconds = Math.round(
      (activeInterval.endTime.getTime() - activeInterval.startTime.getTime()) / 1000
    );
    await flushInterval(activeInterval);
  }

  try {
    const deviceDocRef = doc(db, "timetrack_devices", config.deviceId);
    await setDoc(
      deviceDocRef,
      {
        status: "offline",
        online: false,
        lastHeartbeat: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {}

  console.log("\x1b[32m[Done]\x1b[0m WorkPulse Desktop Agent stopped safely.");
  process.exit(0);
}

process.on("SIGINT", markDeviceOffline);
process.on("SIGTERM", markDeviceOffline);

// Main Telemetry Loop
async function startAgent() {
  console.clear();
  console.log(`
\x1b[35m╔══════════════════════════════════════════════════════════════════════╗
║        ⚡ GA-WORK-TIME (WORKPULSE) DESKTOP TELEMETRY AGENT v1.2.0    ║
║             Native Autonomous Windows Endpoint Activity Probe        ║
╚══════════════════════════════════════════════════════════════════════╝\x1b[0m
`);

  console.log(` \x1b[1mTarget Environment\x1b[0m : \x1b[33m${config.env.toUpperCase()} (${fbConfig.projectId})\x1b[0m`);
  console.log(` \x1b[1mDevice Identifier\x1b[0m  : \x1b[36m${config.deviceId} (${os.hostname()})\x1b[0m`);
  console.log(` \x1b[1mSample Cadence\x1b[0m     : Every ${config.sampleCadenceSeconds} seconds`);
  console.log(` \x1b[1mFlush Cadence\x1b[0m      : Every ${config.flushCadenceSeconds} seconds`);

  await resolveUserProfile();

  console.log(`\n\x1b[32m✔ Telemetry streaming is ACTIVE.\x1b[0m Press Ctrl+C to stop.`);
  console.log(`──────────────────────────────────────────────────────────────────────\n`);

  let lastFlushTime = Date.now();

  const tick = async () => {
    try {
      const probeData = await runProbe();
      const now = new Date();

      // State counters
      const sampleSec = config.sampleCadenceSeconds;
      if (probeData.state === "ACTIVE") todayTotals.activeSeconds += sampleSec;
      else if (probeData.state === "IDLE") todayTotals.idleSeconds += sampleSec;
      else if (probeData.state === "LOCKED") todayTotals.lockedSeconds += sampleSec;
      todayTotals.totalSeconds += sampleSec;

      // Track app usage
      const appKey = probeData.processName || "System";
      appUsageSeconds[appKey] = (appUsageSeconds[appKey] || 0) + sampleSec;

      // Pretty console tick output
      const timeStr = now.toLocaleTimeString();
      const stateColor =
        probeData.state === "ACTIVE"
          ? "\x1b[32mACTIVE\x1b[0m"
          : probeData.state === "IDLE"
          ? "\x1b[33mIDLE  \x1b[0m"
          : "\x1b[31mLOCKED\x1b[0m";

      const titleSnippet = (probeData.windowTitle || "No title")
        .substring(0, 40)
        .padEnd(40);

      process.stdout.write(
        `\r[${timeStr}] [${stateColor}] \x1b[1m${appKey.padEnd(16)}\x1b[0m : ${titleSnippet} | Idle: ${probeData.idleSeconds}s`
      );

      // Check if interval should switch (window or state change)
      if (
        !activeInterval ||
        activeInterval.processName !== probeData.processName ||
        activeInterval.state !== probeData.state ||
        (Date.now() - lastFlushTime) >= config.flushCadenceSeconds * 1000
      ) {
        if (activeInterval) {
          activeInterval.endTime = now;
          activeInterval.durationSeconds = Math.round(
            (activeInterval.endTime.getTime() - activeInterval.startTime.getTime()) / 1000
          );
          process.stdout.write("\n");
          await flushInterval(activeInterval);
        }

        activeInterval = {
          startTime: now,
          endTime: now,
          durationSeconds: 0,
          processName: probeData.processName,
          windowTitle: probeData.windowTitle,
          state: probeData.state,
          category: probeData.category,
        };
        lastFlushTime = Date.now();
      }

      // Sync device heartbeat
      await syncDeviceHeartbeat(probeData);
    } catch (err) {
      console.error(`\n\x1b[31m[Tick Error]\x1b[0m ${err.message}`);
    }
  };

  // Initial immediate tick
  await tick();

  // Regular cadence
  setInterval(tick, config.sampleCadenceSeconds * 1000);
}

startAgent();
