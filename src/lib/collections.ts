/**
 * Firestore Collection Namespaces
 * 
 * To ensure zero collisions with Gryphon CRM collections, all time-tracking collections
 * are prefixed with `timetrack_`. The CRM `users` and `hrms_users` collections are
 * read-only reference collections used solely for profile and role lookups.
 */

// CRM Collections (Read-Only references for user profile mapping)
export const CRM_COLLECTIONS = {
  USERS: "users",
  HRMS_USERS: "hrms_users",
  USER_SESSIONS: "user_sessions",
} as const;

// GA-Work-Time Time Tracking Collections (Exclusive namespace)
export const TIMETRACK_COLLECTIONS = {
  // Raw micro-intervals & foreground window tick intervals
  LOGS: "timetrack_activity_logs",

  // Aggregated daily time summaries, active/idle totals, focus ratios
  DAILY_SUMMARIES: "timetrack_daily_summaries",

  // Workstation metadata (enrolled Windows endpoints, agent versions)
  EMPLOYEES: "timetrack_employees",

  // Workstation hardware devices & live heartbeat
  DEVICES: "timetrack_devices",

  // Employee-submitted offline inactivity explanation notes
  INACTIVITY_NOTES: "timetrack_inactivity_notes",

  // Tracking policies (idle threshold, working shifts)
  POLICIES: "timetrack_policies",
} as const;
