import React from "react";
import { Modal } from "../ui/Modal";
import { Download, Laptop, Check, ShieldCheck, Clock, AlertCircle, FileArchive } from "lucide-react";
import { Button } from "../ui/Button";

export interface DownloadAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadAgentModal({ isOpen, onClose }: DownloadAgentModalProps) {
  const downloadUrl = "/downloads/GA-Work-Time.exe";
  const zipDownloadUrl = "/downloads/GA-Work-Time.zip";

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "GA-Work-Time.exe");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZipDownload = () => {
    const link = document.createElement("a");
    link.href = zipDownloadUrl;
    link.setAttribute("download", "GA-Work-Time.zip");
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
              GA WORK-TIME Desktop Agent
            </h3>
            <p className="text-xs text-text-muted">
              Official desktop client for automated workstation presence tracking
            </p>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <span className="text-xs text-text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Runs in user space • No admin privileges required
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZipDownload}
              className="gap-1.5 text-xs text-gray-700"
            >
              <FileArchive className="w-3.5 h-3.5 text-gray-500" />
              Download .ZIP (15 KB)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download .EXE (36 KB)
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        {/* Intro */}
        <div className="p-3.5 bg-gray-50 border border-surface-border rounded-lg text-text-secondary text-xs leading-relaxed">
          The GA WORK-TIME desktop agent runs in your Windows system tray. It eliminates manual timesheets by tracking active window presence and idle periods automatically.
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
                Save <strong>GA-Work-Time.exe</strong> to your computer. No installation wizard required.
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
            <span className="text-[11px] text-text-muted">Config stored in %APPDATA%\GA-Work-Time</span>
          </div>

          <div className="p-2.5 bg-gray-50 border border-surface-border rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium text-text-primary">Privacy by Design</span>
            </div>
            <span className="text-[11px] text-text-muted">Only active application name and idle ticks</span>
          </div>
        </div>

        {/* First-time Download / SmartScreen Guidance */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-950 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-[11px] leading-relaxed">
            <p className="font-semibold text-amber-950">Chrome or Windows SmartScreen Note:</p>
            <p className="text-amber-900">
              Because this is a freshly compiled corporate desktop client, Chrome may warn that the file is <em>"uncommonly downloaded"</em> and Windows may show <em>"Windows protected your PC"</em>.
            </p>
            <p className="text-amber-800">
              • In Chrome: Click the download options menu → select <strong>"Keep"</strong> (or <strong>"Keep anyway"</strong>).<br />
              • In Windows: Click <strong>"More info"</strong> → select <strong>"Run anyway"</strong>.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
