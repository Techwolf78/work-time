import React from "react";
import { Modal } from "../ui/Modal";
import {
  Download,
  Laptop,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Monitor,
  Check,
} from "lucide-react";
import { Button } from "../ui/Button";

export interface DownloadAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadAgentModal({ isOpen, onClose }: DownloadAgentModalProps) {
  const downloadUrl = "/downloads/WorkPulse.exe";

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "WorkPulse.exe");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-sm">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
              WorkPulse for Windows
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                v1.2 Native Win32
              </span>
            </h3>
            <p className="text-xs text-text-muted">
              Professional autonomous background telemetry • 100% Zero Terminal / No Console
            </p>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <span className="text-xs text-text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Runs securely in user space • Zero admin permissions required
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-xs">
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleDownload}
              className="w-full sm:w-auto text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download WorkPulse.exe (22 KB)
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-sm">
        {/* Hero Download Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 p-6 text-white shadow-md border border-gray-800">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Single Standalone Executable
              </div>
              <h4 className="text-lg font-bold text-white tracking-tight">
                One-Click Windows Desktop App
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Normal employees never have to see an ugly black terminal or run command lines.
                Double-click to link your corporate workstation in 5 seconds.
              </p>
            </div>

            <button
              onClick={handleDownload}
              className="group shrink-0 px-5 py-3 rounded-xl bg-white text-gray-950 hover:bg-gray-100 font-semibold text-xs transition-all shadow-md active:scale-95 flex items-center gap-2.5"
            >
              <Download className="w-4 h-4 text-indigo-600 group-hover:translate-y-0.5 transition-transform" />
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Download WorkPulse.exe</div>
                <div className="text-[10px] text-gray-500 font-normal">Windows 10 / 11 • 22.5 KB</div>
              </div>
            </button>
          </div>
        </div>

        {/* 3 Step Visual Installation Guide */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            How It Works for Every Employee (Zero Technical Knowledge Needed)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 hover:border-indigo-300 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center mb-2.5">
                1
              </div>
              <h5 className="text-xs font-bold text-gray-950 mb-1">Download & Double-Click</h5>
              <p className="text-xs text-text-muted leading-relaxed">
                Click download to get <strong>WorkPulse.exe</strong>. Place it on your Desktop or Downloads. No installation setup wizard required.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 hover:border-indigo-300 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center mb-2.5">
                2
              </div>
              <h5 className="text-xs font-bold text-gray-950 mb-1">Enter Work Email Once</h5>
              <p className="text-xs text-text-muted leading-relaxed">
                A clean native Windows dialog will open on Day 1. Enter your registered CRM email address and click <strong>"Pair Workstation"</strong>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 hover:border-emerald-300 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center mb-2.5">
                3
              </div>
              <h5 className="text-xs font-bold text-gray-950 mb-1">Silent System Tray</h5>
              <p className="text-xs text-text-muted leading-relaxed">
                The window closes and docks into your <strong>System Tray</strong> (next to the Windows clock) with an emerald pulse dot. 100% background operation!
              </p>
            </div>
          </div>
        </div>

        {/* Feature Comparison / FAQ */}
        <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 space-y-2.5">
          <h5 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Enterprise Guardrails & Transparency
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span><strong>No console window:</strong> 0% command prompt visibility</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span><strong>Zero dependencies:</strong> Pre-installed .NET 4.8 runtime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span><strong>Auto-login:</strong> Remembers your workstation identity permanently</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span><strong>Privacy-first:</strong> Only detects active app name and idle ticks</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
