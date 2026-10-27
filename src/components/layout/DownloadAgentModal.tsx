import React from "react";
import { Modal } from "../ui/Modal";
import { Download, Laptop, Check, ShieldCheck, Clock } from "lucide-react";
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
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-900 flex items-center justify-center border border-gray-200">
            <Laptop className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Windows Desktop Agent
            </h3>
            <p className="text-xs text-text-muted">
              WorkPulse client for automated workstation presence tracking
            </p>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Runs in user space • No administrative privileges required
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download .exe (22 KB)
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        {/* Intro */}
        <div className="p-3.5 bg-gray-50 border border-surface-border rounded-lg text-text-secondary text-xs leading-relaxed">
          The WorkPulse desktop agent runs in your Windows system tray. It eliminates manual timesheets by tracking active window presence and idle periods automatically.
        </div>

        {/* 3 Step Setup */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2.5">
            Quick Setup Guide
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-white border border-surface-border rounded-lg">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-900 text-[11px] font-semibold mb-2">
                1
              </span>
              <p className="font-medium text-xs text-text-primary">Download Executable</p>
              <p className="text-[11px] text-text-secondary mt-1">
                Save <strong>WorkPulse.exe</strong> to your computer. No installation wizard required.
              </p>
            </div>

            <div className="p-3 bg-white border border-surface-border rounded-lg">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-900 text-[11px] font-semibold mb-2">
                2
              </span>
              <p className="font-medium text-xs text-text-primary">Enter Work Email</p>
              <p className="text-[11px] text-text-secondary mt-1">
                Open the app and enter your corporate CRM email once to link your workstation.
              </p>
            </div>

            <div className="p-3 bg-white border border-surface-border rounded-lg">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold mb-2">
                3
              </span>
              <p className="font-medium text-xs text-text-primary">System Tray Sync</p>
              <p className="text-[11px] text-text-secondary mt-1">
                The agent docks quietly next to the Windows clock and starts telemetry in the background.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="space-y-2 pt-1">
          <div className="p-2.5 bg-gray-50 border border-surface-border rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium text-text-primary">No Command Line / Terminal</span>
            </div>
            <span className="text-[11px] text-text-muted">Compiled native Win32 executable</span>
          </div>

          <div className="p-2.5 bg-gray-50 border border-surface-border rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium text-text-primary">Single Sign-On Pairing</span>
            </div>
            <span className="text-[11px] text-text-muted">Config stored in %APPDATA%\WorkPulse</span>
          </div>

          <div className="p-2.5 bg-gray-50 border border-surface-border rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium text-text-primary">Privacy by Design</span>
            </div>
            <span className="text-[11px] text-text-muted">Only active application name and idle ticks</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
