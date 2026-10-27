import React from "react";
import { Modal } from "../ui/Modal";
import { Shield, CheckCircle2, XCircle, Eye, Lock, FileCode, Clock } from "lucide-react";
import { Button } from "../ui/Button";

export interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyNoticeModal({ isOpen, onClose }: PrivacyNoticeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Workforce Privacy & Telemetry Charter
            </h3>
            <p className="text-xs text-text-muted">
              Built on strict Privacy by Design — measurement without presumption
            </p>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-text-muted flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            Zero-cost, tenant-isolated telemetry architecture
          </span>
          <Button variant="primary" onClick={onClose}>
            I Understand
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-sm">
        {/* Intro Banner */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-card text-emerald-900 text-xs leading-relaxed">
          <strong>GA-Work-Time</strong> captures computer presence (active window titles and input idle ticks)
          solely to eliminate manual timesheets. It does not measure intellectual quality or surveil personal content.
        </div>

        {/* What We NEVER Collect */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2.5 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-500" />
            What is Strictly Never Monitored (100% Guaranteed)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-start gap-2.5">
              <span className="text-base">🚫</span>
              <div>
                <p className="font-semibold text-text-primary text-xs">Zero Keylogging</p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  No keystrokes, passwords, or typed text are ever intercepted or logged.
                </p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-start gap-2.5">
              <span className="text-base">🚫</span>
              <div>
                <p className="font-semibold text-text-primary text-xs">Zero Content Surveillance</p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  No emails, chats, clipboard items, or document bodies are ever inspected.
                </p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-start gap-2.5">
              <span className="text-base">🚫</span>
              <div>
                <p className="font-semibold text-text-primary text-xs">Zero Media Grabs</p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Zero desktop screenshots, zero webcam feeds, zero microphone access.
                </p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-start gap-2.5">
              <span className="text-base">🚫</span>
              <div>
                <p className="font-semibold text-text-primary text-xs">Zero Physical Location</p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  No GPS coordinates, Wi-Fi tri-angulation, or physical location tracking.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What Is Collected */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            What Is Collected for Automated Timesheets
          </h4>
          <div className="space-y-2">
            <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-text-primary">Foreground Executable Name</span>
              </div>
              <span className="text-[11px] text-text-muted">e.g., Code.exe, chrome.exe</span>
            </div>
            <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-text-primary">Active vs. Idle Duration Ticks</span>
              </div>
              <span className="text-[11px] text-text-muted">Calculated via GetLastInputInfo Win32</span>
            </div>
            <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-text-primary">Employee Self-Audit Access</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">You can review all your data</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
