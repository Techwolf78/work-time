import React, { useState } from "react";
import {
  Clock,
  Lock,
  Unlock,
  Server,
  RotateCcw,
  Save,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useHrms } from "../../../lib/hrmsContext";
import { useToast } from "../../../lib/toastContext";

export function AttendancePolicySettingsView() {
  const { settings, updateSettings } = useHrms();
  const toast = useToast();

  const [periodLocked, setPeriodLocked] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  // Form states for attendance policy
  const [standardHours, setStandardHours] = useState(8.5);
  const [halfDayHours, setHalfDayHours] = useState(4.5);
  const [gracePeriodMins, setGracePeriodMins] = useState(15);
  const [lateMarksPenalty, setLateMarksPenalty] = useState(3);
  const [allowWebPunch, setAllowWebPunch] = useState(true);
  const [requireLocation, setRequireLocation] = useState(false);
  const [autoApproveCutoffDays, setAutoApproveCutoffDays] = useState(5);
  const [overtimeRateMultiplier, setOvertimeRateMultiplier] = useState(1.5);

  const handleSavePolicy = () => {
    toast.success("Attendance policy rules updated successfully.");
  };

  const handleTogglePeriodLock = () => {
    setPeriodLocked(!periodLocked);
    setShowLockConfirm(false);
    toast.info(
      !periodLocked
        ? "Attendance period for October 2026 locked for payroll finalization."
        : "Attendance period reopened for authorized corrections."
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-card border border-surface-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary">
              Attendance Rules & Compliance Policies
            </h2>
            <Badge variant="neutral" size="sm">Tenant-Wide</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure working hours, late arrival grace buffers, regularization limits, and period cut-offs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStandardHours(8.5);
              setHalfDayHours(4.5);
              setGracePeriodMins(15);
              toast.info("Policy restored to default presets.");
            }}
            className="h-8 text-xs font-medium"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSavePolicy}
            className="h-8 text-xs font-medium"
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Rules
          </Button>
        </div>
      </div>

      {/* Period Lock & Payroll Readiness Card */}
      <div className="bg-white p-4 rounded-card border border-surface-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-primary">
              Attendance Period Status: October 2026
            </span>
            <Badge variant={periodLocked ? "warning" : "success"} size="sm" dot>
              {periodLocked ? "Locked for Payroll" : "Open for Operations"}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            {periodLocked
              ? "All daily attendance and regularizations are frozen. Edits require administrative reopening."
              : "Cut-off date: October 25, 2026. Settle all exception items before payroll lock."}
          </p>
        </div>

        <Button
          variant={periodLocked ? "outline" : "primary"}
          size="sm"
          onClick={() => setShowLockConfirm(true)}
          className="h-8 text-xs font-medium shrink-0"
          leftIcon={periodLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        >
          {periodLocked ? "Reopen Period" : "Lock Period for Payroll"}
        </Button>
      </div>

      {/* Policy Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Working Hours & Shift Rules */}
        <div className="bg-white p-4 rounded-card border border-surface-border shadow-card space-y-3">
          <div className="border-b border-surface-border pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Working Hours & Attendance Thresholds
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-medium text-text-primary block mb-1">
                Full-Day Standard Hours
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={standardHours}
                  onChange={(e) => setStandardHours(parseFloat(e.target.value) || 8)}
                  className="w-20 px-2 py-1 rounded-input border border-surface-border focus:outline-none focus:border-brand-primary font-mono tabular-nums text-xs"
                />
                <span className="text-text-secondary">hours required for standard paid day</span>
              </div>
            </div>

            <div>
              <label className="font-medium text-text-primary block mb-1">
                Half-Day Threshold Hours
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={halfDayHours}
                  onChange={(e) => setHalfDayHours(parseFloat(e.target.value) || 4)}
                  className="w-20 px-2 py-1 rounded-input border border-surface-border focus:outline-none focus:border-brand-primary font-mono tabular-nums text-xs"
                />
                <span className="text-text-secondary">hours below which attendance is marked as Half Day</span>
              </div>
            </div>

            <div>
              <label className="font-medium text-text-primary block mb-1">
                Late Arrival Grace Buffer
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="5"
                  value={gracePeriodMins}
                  onChange={(e) => setGracePeriodMins(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 rounded-input border border-surface-border focus:outline-none focus:border-brand-primary font-mono tabular-nums text-xs"
                />
                <span className="text-text-secondary">minutes buffer after shift start without late penalty</span>
              </div>
            </div>

            <div>
              <label className="font-medium text-text-primary block mb-1">
                Late Marks Penalty Rule
              </label>
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Every</span>
                <input
                  type="number"
                  value={lateMarksPenalty}
                  onChange={(e) => setLateMarksPenalty(parseInt(e.target.value) || 3)}
                  className="w-16 px-2 py-1 rounded-input border border-surface-border focus:outline-none focus:border-brand-primary font-mono tabular-nums text-xs"
                />
                <span className="text-text-secondary">late arrivals deduct 0.5 day Casual Leave</span>
              </div>
            </div>
          </div>
        </div>

        {/* Regularization & Self-Service Rules */}
        <div className="bg-white p-4 rounded-card border border-surface-border shadow-card space-y-3">
          <div className="border-b border-surface-border pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Employee Clock-In & Regularization Rules
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={allowWebPunch}
                onChange={(e) => setAllowWebPunch(e.target.checked)}
                className="mt-0.5 rounded border-surface-border text-brand-primary focus:ring-0"
              />
              <div>
                <span className="font-medium text-text-primary block">
                  Enable Employee Web Clock-In / Clock-Out
                </span>
                <span className="text-text-secondary text-[11px]">
                  Permits staff to punch attendance directly from the web portal.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requireLocation}
                onChange={(e) => setRequireLocation(e.target.checked)}
                className="mt-0.5 rounded border-surface-border text-brand-primary focus:ring-0"
              />
              <div>
                <span className="font-medium text-text-primary block">
                  Require Browser Geolocation Tagging
                </span>
                <span className="text-text-secondary text-[11px]">
                  Captures latitude and longitude coordinates with web clock-in events.
                </span>
              </div>
            </label>

            <div>
              <label className="font-medium text-text-primary block mb-1">
                Regularization Submission Window
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={autoApproveCutoffDays}
                  onChange={(e) => setAutoApproveCutoffDays(parseInt(e.target.value) || 5)}
                  className="w-16 px-2 py-1 rounded-input border border-surface-border focus:outline-none focus:border-brand-primary font-mono tabular-nums text-xs"
                />
                <span className="text-text-secondary">days within which missed punch requests must be filed</span>
              </div>
            </div>

            <div>
              <label className="font-medium text-text-primary block mb-1">
                Approved Overtime Multiplier
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.25"
                  value={overtimeRateMultiplier}
                  onChange={(e) => setOvertimeRateMultiplier(parseFloat(e.target.value) || 1.5)}
                  className="w-16 px-2 py-1 rounded-input border border-surface-border focus:outline-none focus:border-brand-primary font-mono tabular-nums text-xs"
                />
                <span className="text-text-secondary">× hourly rate for approved overtime hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Integration Sync Status Strip */}
      <div className="bg-white p-4 rounded-card border border-surface-border shadow-card space-y-2.5">
        <div className="flex items-center justify-between border-b border-surface-border pb-2">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-text-secondary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Biometric & Punch Device Integrations
            </h3>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> All 4 Terminals Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-surface-subtle/50 rounded-lg border border-surface-border/60">
            <span className="text-text-secondary text-[11px] block">Pune HQ (Tower 4)</span>
            <span className="font-medium text-text-primary block mt-0.5">ZKTeco Bio-01</span>
            <span className="text-[10px] text-text-muted mt-0.5 block">Synced 3m ago</span>
          </div>

          <div className="p-2.5 bg-surface-subtle/50 rounded-lg border border-surface-border/60">
            <span className="text-text-secondary text-[11px] block">Bengaluru Hub</span>
            <span className="font-medium text-text-primary block mt-0.5">Anviz FacePass 7</span>
            <span className="text-[10px] text-text-muted mt-0.5 block">Synced 5m ago</span>
          </div>

          <div className="p-2.5 bg-surface-subtle/50 rounded-lg border border-surface-border/60">
            <span className="text-text-secondary text-[11px] block">Mumbai Center</span>
            <span className="font-medium text-text-primary block mt-0.5">Suprema BioStation</span>
            <span className="text-[10px] text-text-muted mt-0.5 block">Synced 8m ago</span>
          </div>

          <div className="p-2.5 bg-surface-subtle/50 rounded-lg border border-surface-border/60">
            <span className="text-text-secondary text-[11px] block">Web & Mobile Gateway</span>
            <span className="font-medium text-text-primary block mt-0.5">Web Punch Service</span>
            <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">Real-time</span>
          </div>
        </div>
      </div>

      {/* Period Lock Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLockConfirm}
        onClose={() => setShowLockConfirm(false)}
        onConfirm={handleTogglePeriodLock}
        title={periodLocked ? "Reopen Attendance Period?" : "Lock Period for Payroll?"}
        description={
          periodLocked
            ? "Reopening permits HR Admins and Managers to accept new regularizations. Ensure to re-lock before payroll export."
            : "Locking the period freezes all attendance calculations for October 2026. Staff will not be able to file further regularizations for this cycle."
        }
        confirmText={periodLocked ? "Reopen Period" : "Lock Period"}
        variant={periodLocked ? "primary" : "danger"}
      />
    </div>
  );
}
