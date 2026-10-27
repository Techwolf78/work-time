import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export type FirebaseEnv = "dev" | "prod";

// Localhost Developer Testing Database
export const devFirebaseConfig = {
  apiKey: "AIzaSyD9SBw0ZckY3ht0CwH39C5pPRWwkR2zR4M",
  authDomain: "authencation-39485.firebaseapp.com",
  databaseURL:
    "https://authencation-39485-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "authencation-39485",
  storageBucket: "authencation-39485.firebasestorage.app",
  messagingSenderId: "366538675183",
  appId: "1:366538675183:web:8504a18fce2d563c491c1a",
  measurementId: "G-0V7B973Q8T",
};

// Production Database (Gryphon CRM Paid Blaze Tier)
export const prodFirebaseConfig = {
  apiKey: "AIzaSyCxxJYJwEUDm4O5ZWRC2rLG3F0Q7f-icWA",
  authDomain: "gryphon-sync.firebaseapp.com",
  projectId: "gryphon-sync",
  storageBucket: "gryphon-sync.firebasestorage.app",
  messagingSenderId: "711708349362",
  appId: "1:711708349362:web:e69239dbaafc2971490aab",
  measurementId: "G-M8D2ECH5ZX",
};

const STORAGE_KEY_ENV = "worktime_firebase_env";

/**
 * Determine active environment:
 * 1. Check user preference in localStorage
 * 2. Default to 'dev' on localhost, 'prod' on production hosts
 */
export const getActiveFirebaseEnv = (): FirebaseEnv => {
  if (typeof window === "undefined") return "dev";
  const stored = localStorage.getItem(STORAGE_KEY_ENV) as FirebaseEnv | null;
  if (stored === "dev" || stored === "prod") return stored;
  return window.location.hostname === "localhost" ? "dev" : "prod";
};

export const setFirebaseEnv = (env: FirebaseEnv) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_ENV, env);
    window.location.reload();
  }
};

export const activeEnv = getActiveFirebaseEnv();
export const firebaseConfig =
  activeEnv === "dev" ? devFirebaseConfig : prodFirebaseConfig;

// Initialize or reuse Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// Helper to configure auth session persistence
export const configureAuthPersistence = async (rememberMe: boolean = true) => {
  try {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
  } catch (err) {
    console.warn("Failed to set auth persistence:", err);
  }
};

// Default to local persistence for comfortable workday experience
configureAuthPersistence(true).catch(console.error);

export default app;
