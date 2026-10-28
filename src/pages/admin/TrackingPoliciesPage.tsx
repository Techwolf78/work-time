import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  ShieldCheck,
  Sliders,
  Clock,
  Save,
  Plus,
  X,
  Cloud,
  CheckCircle2,
  Cpu,
  Layers,
} from "lucide-react";
import { Input } from "../../components/ui/Input";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { TIMETRACK_COLLECTIONS } from "../../lib/collections";

export function TrackingPoliciesPage() {
  const [idleThreshold, setIdleThreshold] = useState("300");
  const [syncInterval, setSyncInterval] = useState("15");

  // Executable Classification Rules
  const [workApps, setWorkApps] = useState<string[]>([
    "code.exe",
    "devenv.exe",
    "figma.exe",
    "postman.exe",
    "slack.exe",
    "teams.exe",
    "powershell.exe",
    "ga-work-time.exe",
  ]);

  const [neutralApps, setNeutralApps] = useState<string[]>([
    "chrome.exe",
    "msedge.exe",
    "brave.exe",
    "firefox.exe",
    "explorer.exe",
  ]);

  const [restrictedApps, setRestrictedApps] = useState<string[]>([
    "steam.exe",
    "spotify.exe",
    "discord.exe",
    "netflix.exe",
    "epicgameslauncher.exe",
  ]);

  const [newWorkApp, setNewWorkApp] = useState("");
  const [newNeutralApp, setNewNeutralApp] = useState("");
  const [newRestrictedApp, setNewRestrictedApp] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load cloud policies from Firebase on mount
  useEffect(() => {
    async function loadPolicies() {
      try {
        const policyRef = doc(db, TIMETRACK_COLLECTIONS.POLICIES, "default");
        const snap = await getDoc(policyRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.idleThresholdSeconds) setIdleThreshold(String(data.idleThresholdSeconds));
          if (data.heartbeatIntervalSeconds) setSyncInterval(String(data.heartbeatIntervalSeconds));
          if (data.workApps && Array.isArray(data.workApps)) setWorkApps(data.workApps);
          if (data.neutralApps && Array.isArray(data.neutralApps)) setNeutralApps(data.neutralApps);
          if (data.restrictedApps && Array.isArray(data.restrictedApps)) setRestrictedApps(data.restrictedApps);
        }
      } catch (err) {
        console.warn("Could not load Firebase tracking policies:", err);
      }
    }
    loadPolicies();
  }, []);

  const handleAddApp = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    val: string,
    setVal: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const clean = val.trim().toLowerCase();
    if (clean && !list.includes(clean)) {
      setList([...list, clean.endsWith(".exe") ? clean : `${clean}.exe`]);
      setVal("");
    }
  };

  const handleRemoveApp = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    appToRemove: string
  ) => {
    setList(list.filter((a) => a !== appToRemove));
  };

  const handleSavePolicies = async () => {
    setIsSaving(true);
    try {
      const policyRef = doc(db, TIMETRACK_COLLECTIONS.POLICIES, "default");
      await setDoc(
        policyRef,
        {
          idleThresholdSeconds: Number(idleThreshold) || 300,
          heartbeatIntervalSeconds: Number(syncInterval) || 15,
          workApps,
          neutralApps,
          restrictedApps,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save policies to Firebase:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tracking Policies & Application Rules"
        subtitle="Configure organization-level inactivity thresholds, executable classification, and cloud sync cadence synced to Firebase."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administration" },
          { label: "Tracking Policies" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {isSaved && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Policies Synced to Firebase</span>
              </span>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={handleSavePolicies}
              disabled={isSaving}
              className="gap-1.5"
            >
              <Cloud className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Policies"}</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection & Sync Cadence */}
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-text-primary">
                Inactivity & Telemetry Cadence
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-1">
                  Idle Trigger Threshold (Seconds)
                </label>
                <Input
                  type="number"
                  value={idleThreshold}
                  onChange={(e) => setIdleThreshold(e.target.value)}
                  className="text-xs"
                />
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                  Default: <strong>300 seconds (5 minutes)</strong>. If no mouse or keyboard event occurs via Win32 <code>GetLastInputInfo</code>, the system automatically transitions to <strong>IDLE / Break</strong>.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-1">
                  Cloud Heartbeat Sync Cadence (Seconds)
                </label>
                <Input
                  type="number"
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                  className="text-xs"
                />
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                  Default: <strong>15 seconds</strong>. Desktop agent flushes live foreground application focus and activity duration to Firestore.
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Architecture Note */}
          <Card className="p-5 bg-gray-50/70 border border-gray-200 text-xs text-text-secondary space-y-2">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>Real-time Telemetry Enforcement</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Desktop agents automatically query these cloud policies. Categorizations set here will reflect live on the <strong>Application Usage</strong> and <strong>Live Team Pulse</strong> dashboards across all workstations.
            </p>
          </Card>
        </div>

        {/* Classification Rules */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-text-primary">
              Application Classification Engine
            </h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Specify executable tags for automatic classification into <strong>Work Tools</strong>, <strong>Neutral Browsers</strong>, or <strong>Restricted Non-Work</strong> apps.
          </p>

          {/* Work Apps */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Work Tools (Productive)
              </span>
              <span className="text-[11px] text-text-muted">{workApps.length} tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-emerald-50/40 border border-emerald-200/80 rounded-xl min-h-[46px]">
              {workApps.map((app) => (
                <span
                  key={app}
                  className="inline-flex items-center gap-1 text-[11px] bg-white text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md font-mono"
                >
                  <span>{app}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveApp(workApps, setWorkApps, app)}
                    className="text-emerald-700 hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. jira.exe or docker.exe"
                value={newWorkApp}
                onChange={(e) => setNewWorkApp(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleAddApp(workApps, setWorkApps, newWorkApp, setNewWorkApp)
                }
                className="shrink-0 text-xs h-8 px-2.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          {/* Neutral Apps */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Neutral Tools & Browsers
              </span>
              <span className="text-[11px] text-text-muted">{neutralApps.length} tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-blue-50/40 border border-blue-200/80 rounded-xl min-h-[46px]">
              {neutralApps.map((app) => (
                <span
                  key={app}
                  className="inline-flex items-center gap-1 text-[11px] bg-white text-blue-900 border border-blue-300 px-2 py-0.5 rounded-md font-mono"
                >
                  <span>{app}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveApp(neutralApps, setNeutralApps, app)}
                    className="text-blue-700 hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. safari.exe"
                value={newNeutralApp}
                onChange={(e) => setNewNeutralApp(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleAddApp(neutralApps, setNeutralApps, newNeutralApp, setNewNeutralApp)
                }
                className="shrink-0 text-xs h-8 px-2.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          {/* Restricted Apps */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Restricted / Non-Work Apps
              </span>
              <span className="text-[11px] text-text-muted">{restrictedApps.length} tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-amber-50/40 border border-amber-200/80 rounded-xl min-h-[46px]">
              {restrictedApps.map((app) => (
                <span
                  key={app}
                  className="inline-flex items-center gap-1 text-[11px] bg-white text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-mono"
                >
                  <span>{app}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveApp(restrictedApps, setRestrictedApps, app)}
                    className="text-amber-700 hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. vlc.exe"
                value={newRestrictedApp}
                onChange={(e) => setNewRestrictedApp(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleAddApp(
                    restrictedApps,
                    setRestrictedApps,
                    newRestrictedApp,
                    setNewRestrictedApp
                  )
                }
                className="shrink-0 text-xs h-8 px-2.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
