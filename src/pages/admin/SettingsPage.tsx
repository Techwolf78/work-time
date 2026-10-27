import React, { useState } from "react";
import {
  Settings,
  Building,
  Clock,
  Coins,
  Palette,
  CheckCircle2,
  RotateCcw,
  Monitor,
  ShieldCheck,
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";

export function SettingsPage() {
  const { settings, updateSettings, resetAllData } = useHrms();

  const [companyName, setCompanyName] = useState(settings.companyName || "");
  const [legalEntityName, setLegalEntityName] = useState(settings.legalEntityName || "");
  const [cin, setCin] = useState(settings.cin || "");
  const [gstin, setGstin] = useState(settings.gstin || "");
  const [pan, setPan] = useState(settings.pan || "");
  const [address, setAddress] = useState(settings.address || "");
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || "");
  const [website, setWebsite] = useState(settings.website || "");

  // Policies
  const [workingDays, setWorkingDays] = useState(settings.workingDaysPerWeek || 5);
  const [standardHours, setStandardHours] = useState(settings.dailyStandardHours || 9);
  const [gracePeriod, setGracePeriod] = useState(settings.gracePeriodMinutes || 15);
  const [payrollDay, setPayrollDay] = useState(settings.payrollCycleDay || 30);

  // Statutory flags
  const [epfEnabled, setEpfEnabled] = useState(settings.epfEnabled ?? true);
  const [esicEnabled, setEsicEnabled] = useState(settings.esicEnabled ?? true);
  const [ptEnabled, setPtEnabled] = useState(settings.ptEnabled ?? true);
  const [compactMode, setCompactMode] = useState(settings.compactMode ?? false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    updateSettings({
      companyName,
      legalEntityName,
      cin,
      gstin,
      pan,
      address,
      contactEmail,
      contactPhone,
      website,
      workingDaysPerWeek: Number(workingDays),
      dailyStandardHours: Number(standardHours),
      gracePeriodMinutes: Number(gracePeriod),
      payrollCycleDay: Number(payrollDay),
      epfEnabled,
      esicEnabled,
      ptEnabled,
      compactMode,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
            Company & System Settings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure enterprise parameters, statutory compliance rules, and operational policies.
          </p>
        </div>

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Company Profile & Legal Entity</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Primary enterprise identification details</p>
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
            <div className="grid grid-cols-2 gap-3">
              <Input label="Corporate Identity No. (CIN)" value={cin} onChange={(e) => setCin(e.target.value)} />
              <Input label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} />
            </div>
            <Input label="Income Tax PAN" value={pan} onChange={(e) => setPan(e.target.value)} />
            <Input
              label="Headquarters Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Contact Email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <Input
                label="Contact Phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Attendance & Payroll Policies */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Attendance & Shift Policies</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">Daily schedules and late arrival thresholds</p>
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
                  label="Daily Standard Hours"
                  type="number"
                  value={standardHours}
                  onChange={(e) => setStandardHours(Number(e.target.value))}
                />
              </div>

              <Input
                label="Late Arrival Grace Period (Minutes)"
                type="number"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
                helperText="Buffer after scheduled shift start before marking employee as late."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Payroll & Statutory Modules</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">Mandatory deduction engines and cycle locks</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Monthly Payroll Cut-off Day"
                type="number"
                value={payrollDay}
                onChange={(e) => setPayrollDay(Number(e.target.value))}
                helperText="Calendar day of month when monthly attendance snapshot is locked."
              />

              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-900">
                    Enable Employees' Provident Fund (EPF 12%)
                  </span>
                  <input
                    type="checkbox"
                    checked={epfEnabled}
                    onChange={(e) => setEpfEnabled(e.target.checked)}
                    className="rounded text-gray-950 w-4 h-4 accent-gray-950"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-900">
                    Enable Employee State Insurance (ESIC 0.75%)
                  </span>
                  <input
                    type="checkbox"
                    checked={esicEnabled}
                    onChange={(e) => setEsicEnabled(e.target.checked)}
                    className="rounded text-gray-950 w-4 h-4 accent-gray-950"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-900">
                    Enable State Professional Tax (PT Slabs)
                  </span>
                  <input
                    type="checkbox"
                    checked={ptEnabled}
                    onChange={(e) => setPtEnabled(e.target.checked)}
                    className="rounded text-gray-950 w-4 h-4 accent-gray-950"
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Appearance & Display Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Display & Environment Settings</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">Desktop viewport and layout preferences</p>
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

          {/* Reset Demo Data Card */}
          <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-3">
            <h3 className="font-bold text-xs text-amber-950">Local Database Reset</h3>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Clear all customized records and restore the pristine 32-employee enterprise demo dataset.
            </p>
            <Button
              onClick={() => {
                if (window.confirm("Are you sure? This will reset all LocalStorage tables to initial state.")) {
                  resetAllData();
                }
              }}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-900 hover:bg-amber-100 text-xs"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Demo Database
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
