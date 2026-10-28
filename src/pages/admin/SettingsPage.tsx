import React, { useState, useEffect } from "react";
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
  Coffee,
  Calendar,
  Cloud,
  Check,
} from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { TIMETRACK_COLLECTIONS } from "../../lib/collections";
import { useHrms } from "../../lib/hrmsContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";

const ALL_WEEKDAYS = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" },
  { key: "Sat", label: "Saturday" },
  { key: "Sun", label: "Sunday" },
];

export function SettingsPage() {
  const { settings, updateSettings } = useHrms();

  // Company Profile
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

  // Shift & Flexible Schedule Configuration (Saved to Firebase)
  const [workDays, setWorkDays] = useState<string[]>([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ]);
  const [standardHours, setStandardHours] = useState(settings.dailyStandardHours || 9);
  const [shiftStartTime, setShiftStartTime] = useState("10:00");
  const [shiftEndTime, setShiftEndTime] = useState("19:00");

  // Flexible In / Out Windows (Arrival & Departure Window)
  const [flexiArrivalStart, setFlexiArrivalStart] = useState("09:00");
  const [flexiArrivalEnd, setFlexiArrivalEnd] = useState("10:00");
  const [flexiDepartureStart, setFlexiDepartureStart] = useState("18:30");
  const [flexiDepartureEnd, setFlexiDepartureEnd] = useState("20:00");

  // Breaks & Idle Tolerances
  const [lunchStartTime, setLunchStartTime] = useState("13:30");
  const [lunchEndTime, setLunchEndTime] = useState("14:30");
  const [teaStartTime, setTeaStartTime] = useState("17:00");
  const [teaEndTime, setTeaEndTime] = useState("17:30");
  const [idleThresholdMinutes, setIdleThresholdMinutes] = useState(5);
  const [heartbeatIntervalSeconds, setHeartbeatIntervalSeconds] = useState(15);

  // UI preferences
  const [compactMode, setCompactMode] = useState(settings.compactMode ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load cloud policies from Firebase on mount
  useEffect(() => {
    async function loadFirebasePolicies() {
      try {
        const policyRef = doc(db, TIMETRACK_COLLECTIONS.POLICIES, "default");
        const snap = await getDoc(policyRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.companyName) setCompanyName(data.companyName);
          if (data.legalEntityName) setLegalEntityName(data.legalEntityName);
          if (data.workDays && Array.isArray(data.workDays)) setWorkDays(data.workDays);
          if (data.dailyStandardHours) setStandardHours(data.dailyStandardHours);
          if (data.shiftStartTime) setShiftStartTime(data.shiftStartTime);
          if (data.shiftEndTime) setShiftEndTime(data.shiftEndTime);
          if (data.flexiArrivalStart) setFlexiArrivalStart(data.flexiArrivalStart);
          if (data.flexiArrivalEnd) setFlexiArrivalEnd(data.flexiArrivalEnd);
          if (data.flexiDepartureStart) setFlexiDepartureStart(data.flexiDepartureStart);
          if (data.flexiDepartureEnd) setFlexiDepartureEnd(data.flexiDepartureEnd);
          if (data.lunchStartTime) setLunchStartTime(data.lunchStartTime);
          if (data.lunchEndTime) setLunchEndTime(data.lunchEndTime);
          if (data.teaStartTime) setTeaStartTime(data.teaStartTime);
          if (data.teaEndTime) setTeaEndTime(data.teaEndTime);
          if (data.idleThresholdMinutes) setIdleThresholdMinutes(data.idleThresholdMinutes);
          if (data.heartbeatIntervalSeconds) setHeartbeatIntervalSeconds(data.heartbeatIntervalSeconds);
        }
      } catch (err) {
        console.warn("Could not load Firebase policy settings:", err);
      }
    }
    loadFirebasePolicies();
  }, []);

  const toggleDay = (dayKey: string) => {
    setWorkDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save to Firebase Firestore
      const policyRef = doc(db, TIMETRACK_COLLECTIONS.POLICIES, "default");
      await setDoc(
        policyRef,
        {
          companyName,
          legalEntityName,
          address,
          contactEmail,
          contactPhone,
          website,
          workingDaysPerWeek: workDays.length,
          workDays,
          dailyStandardHours: Number(standardHours),
          shiftStartTime,
          shiftEndTime,
          flexiArrivalStart,
          flexiArrivalEnd,
          flexiDepartureStart,
          flexiDepartureEnd,
          lunchStartTime,
          lunchEndTime,
          teaStartTime,
          teaEndTime,
          idleThresholdMinutes: Number(idleThresholdMinutes),
          heartbeatIntervalSeconds: Number(heartbeatIntervalSeconds),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Update local app settings
      updateSettings({
        companyName,
        legalEntityName,
        address,
        contactEmail,
        contactPhone,
        website,
        workingDaysPerWeek: workDays.length,
        dailyStandardHours: Number(standardHours),
        compactMode,
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Error saving settings to Firebase:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Company & Workstation Settings"
        subtitle="Configure enterprise parameters, shift hours, flexible in/out windows, and break schedules synced directly with Firebase."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {isSaved && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in shadow-xs">
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved & Synced to Firebase</span>
              </span>
            )}
            <Button
              onClick={handleSave}
              variant="primary"
              size="md"
              disabled={isSaving}
              className="gap-1.5"
            >
              <Cloud className="w-4 h-4" />
              <span>{isSaving ? "Saving to Cloud..." : "Save All Changes"}</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Organization & Desktop Distribution */}
        <div className="space-y-6">
          {/* Organization Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Organization Profile & Legal Entity</CardTitle>
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

          {/* Desktop Agent Client Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Laptop className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>Desktop Agent Deployment</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Deploy GA WORK-TIME client v1.2.0 across company computers
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-gray-900">GA-Work-Time Client (v1.2.0)</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Win32 native background client • Automatic idle & break tracking
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/downloads/GA-Work-Time.zip"
                    download="GA-Work-Time.zip"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 text-xs font-medium transition-colors"
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

          {/* Display & Viewport */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Display Preferences</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Interface density for desktop screens
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-gray-200/80 hover:bg-gray-50 transition-colors">
                <div>
                  <span className="font-semibold text-gray-950 text-xs block">
                    Compact Monitor Mode
                  </span>
                  <span className="text-[11px] text-gray-500 mt-0.5 block">
                    Optimizes padding, card heights, and table scales for 1080p and widescreen monitors.
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Work Shifts, Flexible In/Out, Lunch & Tea Windows */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <CardTitle>Shift Schedule & Working Days (Mon to Sat)</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Official shift hours and weekly working days policy
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Working Days Selector */}
              <div>
                <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
                  Operating Days / Week ({workDays.length} Days Selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_WEEKDAYS.map(({ key, label }) => {
                    const isSelected = workDays.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleDay(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          isSelected
                            ? "bg-gray-900 border-gray-900 text-white shadow-xs"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Default company work week: <strong>Monday to Saturday</strong> (Sunday Off).
                </p>
              </div>

              {/* Standard Hours & Shift Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <Input
                  label="Daily Required Hours"
                  type="number"
                  value={standardHours}
                  onChange={(e) => setStandardHours(Number(e.target.value))}
                  helperText="Standard work duration (e.g. 9 hours)."
                />
                <Input
                  label="Standard Shift Start"
                  type="time"
                  value={shiftStartTime}
                  onChange={(e) => setShiftStartTime(e.target.value)}
                  helperText="Default start (e.g. 10:00 AM)."
                />
                <Input
                  label="Standard Shift End"
                  type="time"
                  value={shiftEndTime}
                  onChange={(e) => setShiftEndTime(e.target.value)}
                  helperText="Default end (e.g. 07:00 PM)."
                />
              </div>
            </CardContent>
          </Card>

          {/* Flexible In / Out Policy Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>Flexible In / Out Arrival & Departure Windows</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Employees can arrive between 9:00 AM – 10:00 AM and leave between 6:30 PM – 8:00 PM
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900 leading-relaxed">
                <strong>Flexi-Time Rule:</strong> Employees arriving within the <strong>Arrival Window</strong> are marked on-time. They can leave within the <strong>Departure Window</strong> as long as their total daily work hours (e.g. 9 hours) are completed.
              </div>

              {/* Flexible Arrival Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Flexible Arrival Window Start"
                  type="time"
                  value={flexiArrivalStart}
                  onChange={(e) => setFlexiArrivalStart(e.target.value)}
                  helperText="Early arrival start (e.g. 09:00 AM)."
                />
                <Input
                  label="Flexible Arrival Window End"
                  type="time"
                  value={flexiArrivalEnd}
                  onChange={(e) => setFlexiArrivalEnd(e.target.value)}
                  helperText="Late arrival cutoff (e.g. 10:00 AM)."
                />
              </div>

              {/* Flexible Departure Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Input
                  label="Flexible Departure Window Start"
                  type="time"
                  value={flexiDepartureStart}
                  onChange={(e) => setFlexiDepartureStart(e.target.value)}
                  helperText="Early departure threshold (e.g. 06:30 PM)."
                />
                <Input
                  label="Flexible Departure Window End"
                  type="time"
                  value={flexiDepartureEnd}
                  onChange={(e) => setFlexiDepartureEnd(e.target.value)}
                  helperText="Late departure window (e.g. 08:00 PM)."
                />
              </div>
            </CardContent>
          </Card>

          {/* Lunch & Tea Break Windows Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Coffee className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <CardTitle>Lunch & Tea Break Windows</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Expected break intervals automatically categorized during workstation idle periods
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-lg text-xs text-amber-950 leading-relaxed">
                <strong>Automatic Inactivity Mapping:</strong> Employees do not need a manual pause button. When a workstation is inactive during these windows, the desktop agent automatically categorizes the duration as <strong>Lunch Break</strong> or <strong>Tea Break</strong>.
              </div>

              {/* Lunch Break Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Lunch Break Start"
                  type="time"
                  value={lunchStartTime}
                  onChange={(e) => setLunchStartTime(e.target.value)}
                  helperText="Expected lunch start (e.g. 01:30 PM)."
                />
                <Input
                  label="Lunch Break End"
                  type="time"
                  value={lunchEndTime}
                  onChange={(e) => setLunchEndTime(e.target.value)}
                  helperText="Expected lunch end (e.g. 02:30 PM)."
                />
              </div>

              {/* Tea Break Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Input
                  label="Tea / Evening Break Start"
                  type="time"
                  value={teaStartTime}
                  onChange={(e) => setTeaStartTime(e.target.value)}
                  helperText="Evening refreshment start (e.g. 05:00 PM)."
                />
                <Input
                  label="Tea / Evening Break End"
                  type="time"
                  value={teaEndTime}
                  onChange={(e) => setTeaEndTime(e.target.value)}
                  helperText="Evening refreshment end (e.g. 05:30 PM)."
                />
              </div>

              {/* Telemetry Inactivity Detection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                <Input
                  label="Idle Trigger Threshold (Minutes)"
                  type="number"
                  value={idleThresholdMinutes}
                  onChange={(e) => setIdleThresholdMinutes(Number(e.target.value))}
                  helperText="Triggers idle state after no keyboard/mouse input (default 5 min)."
                />
                <Input
                  label="Telemetry Heartbeat Cadence (Seconds)"
                  type="number"
                  value={heartbeatIntervalSeconds}
                  onChange={(e) => setHeartbeatIntervalSeconds(Number(e.target.value))}
                  helperText="Desktop agent background sync frequency."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
