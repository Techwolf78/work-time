/**
 * GA-Work-Time Native Desktop Telemetry Agent
 * 
 * Features One-Time Workstation Onboarding:
 * On Day 1, prompts for corporate email once, verifies against CRM users,
 * and permanently saves identity to %APPDATA%/GA-Work-Time/agent_config.json.
 * On every subsequent day/boot, starts instantly with ZERO manual login.
 */

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import os from "node:os";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
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

// Global AppData Directory for Windows Persistence
const APPDATA_DIR = process.env.APPDATA
  ? resolve(process.env.APPDATA, "GA-Work-Time")
  : resolve(__dirname, ".ga-work-time");
const APPDATA_CONFIG_PATH = resolve(APPDATA_DIR, "agent_config.json");
const LOCAL_CONFIG_PATH = resolve(__dirname, "config.json");

// Check fallback legacy config if new one doesn't exist yet
if (process.env.APPDATA && !existsSync(APPDATA_CONFIG_PATH)) {
  const legacyConfig = resolve(process.env.APPDATA, "WorkPulse", "agent_config.json");
  if (existsSync(legacyConfig)) {
    try {
      if (!existsSync(APPDATA_DIR)) mkdirSync(APPDATA_DIR, { recursive: true });
      writeFileSync(APPDATA_CONFIG_PATH, readFileSync(legacyConfig, "utf-8"));
    } catch {}
  }
}

function ensureDirectory(dir) {
  if (!existsSync(dir)) {
    try {
      mkdirSync(dir, { recursive: true });
    } catch (e) {}
  }
}

// Load existing config from AppData or Local
function loadSavedConfig() {
  if (existsSync(APPDATA_CONFIG_PATH)) {
    try {
      return JSON.parse(readFileSync(APPDATA_CONFIG_PATH, "utf-8"));
    } catch (e) {}
  }
  if (existsSync(LOCAL_CONFIG_PATH)) {
    try {
      return JSON.parse(readFileSync(LOCAL_CONFIG_PATH, "utf-8"));
    } catch (e) {}
  }
  return null;
}

function saveConfig(cfg) {
  ensureDirectory(APPDATA_DIR);
  try {
    writeFileSync(APPDATA_CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
  } catch (e) {}
  try {
    writeFileSync(LOCAL_CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
  } catch (e) {}
}

// Parse Command Line Flags
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    reset: false,
  };

  for (const arg of args) {
    if (arg === "--reset" || arg === "-r") flags.reset = true;
    if (arg.startsWith("--env=")) flags.env = arg.split("=")[1].trim();
    if (arg.startsWith("--email=")) flags.email = arg.split("=")[1].trim();
    if (arg.startsWith("--password=")) flags.password = arg.split("=")[1].trim();
    if (arg.startsWith("--cadence=")) flags.sampleCadenceSeconds = parseInt(arg.split("=")[1].trim(), 10) || 5;
    if (arg.startsWith("--flush=")) flags.flushCadenceSeconds = parseInt(arg.split("=")[1].trim(), 10) || 30;
  }
  return flags;
}

const flags = parseArgs();
let saved = loadSavedConfig();

// If --reset is passed, disregard saved configuration
if (flags.reset) {
  saved = null;
}

let config = {
  env: flags.env || saved?.env || "dev",
  email: flags.email || saved?.email || "",
  password: flags.password || saved?.password || "",
  sampleCadenceSeconds: flags.sampleCadenceSeconds || saved?.sampleCadenceSeconds || 5,
  flushCadenceSeconds: flags.flushCadenceSeconds || saved?.flushCadenceSeconds || 30,
  deviceId: os.hostname(),
};

const fbConfig = FIREBASE_CONFIGS[config.env] || FIREBASE_CONFIGS.dev;
const app = initializeApp(fbConfig, "desktop-telemetry-agent");
const db = getFirestore(app);
const auth = getAuth(app);

// State tracking
let currentEmployee = {
  id: "EMP-1001",
  name: "Employee",
  email: config.email,
  department: "Operations",
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

// 1-Time First-Run Onboarding Setup Prompt
async function performFirstTimeSetup() {
  console.clear();
  console.log(`
\x1b[35m╔══════════════════════════════════════════════════════════════════════╗
║        ⚡ GA-WORK-TIME WORKSTATION SETUP                             ║
║                   One-Time Workstation Identity Pairing              ║
╚══════════════════════════════════════════════════════════════════════╝\x1b[0m

\x1b[1mWorkstation Detected\x1b[0m : \x1b[36m${os.hostname()}\x1b[0m (Windows User: \x1b[33m${os.userInfo().username}\x1b[0m)
\x1b[1mDatabase Target\x1b[0m      : \x1b[32m${config.env.toUpperCase()} (${fbConfig.projectId})\x1b[0m

This workstation has not been paired to an employee account yet.
Please enter your corporate CRM email address.
\x1b[90m(Note: You only need to do this ONCE. Subsequent runs start automatically.)\x1b[0m
`);

  const rl = readline.createInterface({ input, output });

  while (!config.email) {
    const answer = await rl.question("\x1b[1;36m➤ Enter Corporate CRM Email:\x1b[0m ");
    const trimmed = answer.trim().toLowerCase();
    if (trimmed && trimmed.includes("@")) {
      config.email = trimmed;
    } else {
      console.log("\x1b[31mPlease enter a valid email address.\x1b[0m");
    }
  }

  rl.close();

  // Save to disk permanently
  saveConfig(config);
  console.log(`\n\x1b[32m✔ Configuration saved to:\x1b[0m ${APPDATA_CONFIG_PATH}`);
}

// Resolve user profile from CRM
async function resolveUserProfile() {
  console.log(`\x1b[36m[Agent Init]\x1b[0m Verifying employee profile for \x1b[1m${config.email}\x1b[0m...`);

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
        `\x1b[32m[Profile Verified]\x1b[0m ${currentEmployee.name} (${currentEmployee.department}) | Role: ${currentEmployee.role}`
      );
      return;
    }
  } catch (err) {
    console.warn(`\x1b[33m[Profile]\x1b[0m Could not query users collection: ${err.message}`);
  }

  // Default fallback if doc is missing in CRM
  currentEmployee = {
    id: config.email,
    name: config.email.split("@")[0],
    email: config.email,
    department: "Operations",
    role: "Staff",
  };
  console.log(`\x1b[33m[Profile]\x1b[0m Using workstation profile for ${config.email}`);
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

  await updateDailySummary(dateStr);
}

// Update Daily Summary
async function updateDailySummary(dateStr) {
  const summaryId = `${currentEmployee.id}_${dateStr}`;
  const summaryRef = doc(db, "timetrack_daily_summaries", summaryId);

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

  console.log("\x1b[32m[Done]\x1b[0m GA-Work-Time Desktop Agent stopped safely.");
  process.exit(0);
}

process.on("SIGINT", markDeviceOffline);
process.on("SIGTERM", markDeviceOffline);

// Main Telemetry Loop
async function startAgent() {
  // If no email is configured, run 1-time setup prompt
  if (!config.email) {
    await performFirstTimeSetup();
  }

  console.clear();
  console.log(`
\x1b[35m╔══════════════════════════════════════════════════════════════════════╗
║        ⚡ GA-WORK-TIME DESKTOP TELEMETRY AGENT v1.2.0                ║
║             Native Autonomous Windows Endpoint Activity Probe        ║
╚══════════════════════════════════════════════════════════════════════╝\x1b[0m
`);

  console.log(` \x1b[1mDevice Identifier\x1b[0m  : \x1b[36m${config.deviceId} (${os.hostname()})\x1b[0m`);
  console.log(` \x1b[1mWindows User\x1b[0m       : \x1b[33m${os.userInfo().username}\x1b[0m`);
  console.log(` \x1b[1mSampling Cadence\x1b[0m   : Every ${config.sampleCadenceSeconds} seconds (Flush every ${config.flushCadenceSeconds}s)`);

  await resolveUserProfile();

  console.log(`\n\x1b[32m✔ Telemetry streaming is ACTIVE.\x1b[0m Press Ctrl+C to stop.`);
  console.log(`\x1b[90m(To switch users or re-configure this PC, run: npm run agent -- --reset)\x1b[0m`);
  console.log(`──────────────────────────────────────────────────────────────────────\n`);

  let lastFlushTime = Date.now();

  const tick = async () => {
    try {
      const probeData = await runProbe();
      const now = new Date();

      const sampleSec = config.sampleCadenceSeconds;
      if (probeData.state === "ACTIVE") todayTotals.activeSeconds += sampleSec;
      else if (probeData.state === "IDLE") todayTotals.idleSeconds += sampleSec;
      else if (probeData.state === "LOCKED") todayTotals.lockedSeconds += sampleSec;
      todayTotals.totalSeconds += sampleSec;

      const appKey = probeData.processName || "System";
      appUsageSeconds[appKey] = (appUsageSeconds[appKey] || 0) + sampleSec;

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

      await syncDeviceHeartbeat(probeData);
    } catch (err) {
      console.error(`\n\x1b[31m[Tick Error]\x1b[0m ${err.message}`);
    }
  };

  await tick();
  setInterval(tick, config.sampleCadenceSeconds * 1000);
}

startAgent();
