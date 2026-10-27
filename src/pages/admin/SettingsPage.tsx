import React, { useState } from "react";
import {
  Settings,
  Building,
  Clock,
  Palette,
  CheckCircle2,
  Monitor,
  ShieldCheck,
  Laptop,
  Download,
  Activity,
  FileArchive,
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";

export function SettingsPage() {
  const { settings, updateSettings } = useHrms();

  const [companyName, setCompanyName] = useState(
    settings.companyName || "Gryphon Academy Pvt. Ltd."
  );
  const [legalEntityName, setLegalEntityName] = useState(
    settings.legalEntityName || "Gryphon Academy Pvt. Ltd."
  );
  const [address, setAddress] = useState(
    settings.address || "Pune Innovation Campus, Hinjawadi Phase 1, Pune, Maharashtra 411057"
  );
  const [contactEmail, setContactEmail] = useState(
    settings.contactEmail || "info@gryphonacademy.co.in"
  );
  const [contactPhone, setContactPhone] = useState(
    settings.contactPhone || "+91 (020) 6745-9000"
  );
  const [website, setWebsite] = useState(
    settings.website || "https://gryphonacademy.co.in"
  );

  // GA WORK-TIME Tracking Policies
  const [workingDays, setWorkingDays] = useState(settings.workingDaysPerWeek || 5);
  const [standardHours, setStandardHours] = useState(settings.dailyStandardHours || 9);
  const [idleThresholdMinutes, setIdleThresholdMinutes] = useState(5);
  const [heartbeatIntervalSeconds, setHeartbeatIntervalSeconds] = useState(15);
  const [compactMode, setCompactMode] = useState(settings.compactMode ?? false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    updateSettings({
      companyName,
      legalEntityName,
      address,
      contactEmail,
      contactPhone,
      website,
      workingDaysPerWeek: Number(workingDays),
      dailyStandardHours: Number(standardHours),
      compactMode,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="GA WORK-TIME Settings & Configuration"
        subtitle="Configure organization parameters, desktop telemetry rules, and workstation presence tracking policies"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {isSaved && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Settings Saved
              </span>
            )}
            <Button onClick={handleSave} variant="primary" size="md">
              Save All Changes
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organization Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Organization Profile & Identity</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Corporate identity shown across desktop agents and workforce reports
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Operating Brand Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Input
              label="Registered Legal Entity Name"
              value={legalEntityName}
              onChange={(e) => setLegalEntityName(e.target.value)}
            />
            <Input
              label="Corporate Headquarters Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Support / Ops Email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <Input
                label="Contact Phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
            <Input
              label="Official Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Tracking Policies & Desktop Telemetry */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <CardTitle>Workstation Activity & Telemetry Rules</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Presence detection thresholds and shift schedules
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Working Days / Week"
                  type="number"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(Number(e.target.value))}
                />
                <Input
                  label="Daily Target Work Hours"
                  type="number"
                  value={standardHours}
                  onChange={(e) => setStandardHours(Number(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Inactivity Idle Trigger (Minutes)"
                  type="number"
                  value={idleThresholdMinutes}
                  onChange={(e) => setIdleThresholdMinutes(Number(e.target.value))}
                  helperText="Idle state triggers after no keyboard/mouse input."
                />
                <Input
                  label="Heartbeat Cadence (Seconds)"
                  type="number"
                  value={heartbeatIntervalSeconds}
                  onChange={(e) => setHeartbeatIntervalSeconds(Number(e.target.value))}
                  helperText="Frequency of workstation telemetry sync."
                />
              </div>
            </CardContent>
          </Card>

          {/* Desktop Agent Distribution Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Laptop className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>Windows Desktop Agent Client</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Official workstation client for GA WORK-TIME telemetry
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-gray-900">GA-Work-Time.exe (v1.2.0)</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Win32 native background client • 36 KB standalone binary
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/downloads/GA-Work-Time.zip"
                    download="GA-Work-Time.zip"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 text-xs font-medium transition-colors"
                  >
                    <FileArchive className="w-3.5 h-3.5 text-gray-500" />
                    <span>.ZIP</span>
                  </a>
                  <a
                    href="/downloads/GA-Work-Time.exe"
                    download="GA-Work-Time.exe"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-950 text-white rounded-lg hover:bg-black text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.EXE</span>
                  </a>
                </div>
              </div>

              <div className="text-[11px] text-text-muted flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Runs securely in user space without administrator rights.</span>
              </div>
            </CardContent>
          </Card>

          {/* Appearance & Viewport Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Display & Viewport Layout</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    User interface density preferences
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-gray-200/80 hover:bg-gray-50 transition-colors">
                <div>
                  <span className="font-semibold text-gray-950 text-xs block">
                    Compact Monitor Mode
                  </span>
                  <span className="text-[11px] text-gray-500 mt-0.5 block">
                    Optimizes padding, card heights, and table scales for 1080p and widescreen desktop monitors.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={compactMode}
                  onChange={(e) => {
                    setCompactMode(e.target.checked);
                    updateSettings({ compactMode: e.target.checked });
                  }}
                  className="rounded text-gray-950 w-4 h-4 shrink-0 ml-3 accent-gray-950"
                />
              </label>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs text-gray-700">
                <span>Layout Scaling</span>
                <span className="font-semibold bg-white px-2 py-0.5 rounded shadow-xs text-emerald-700 border border-emerald-200 text-[11px]">
                  100% Fluid Full-Width (Seamless)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
