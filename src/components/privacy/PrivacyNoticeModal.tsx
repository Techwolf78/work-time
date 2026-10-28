import React from "react";
import { Modal } from "../ui/Modal";
import { Shield, Check, X } from "lucide-react";
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
          <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center border border-gray-200">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Privacy & Data Collection Policy
            </h3>
            <p className="text-xs text-text-muted">
              Overview of automated telemetry captured by the desktop agent
            </p>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-xs text-text-muted">
            All telemetry is visible to you under My Activity and My Timeline.
          </p>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Intro */}
        <p className="text-text-secondary leading-relaxed">
          GA-Work-Time automatically records workstation active time and idle intervals to streamline
          attendance and timesheet reporting.
        </p>

        {/* 2-Column Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Data Collected */}
          <div className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-lg space-y-2.5">
            <div className="flex items-center gap-1.5 pb-1 border-b border-gray-200 text-gray-900 font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data Collected</span>
            </div>
            <ul className="space-y-2 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>
                  <strong className="text-gray-900 font-medium">Active Applications:</strong> Name of the active foreground process (e.g. Chrome, VS Code) to categorize focus time.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>
                  <strong className="text-gray-900 font-medium">Activity Durations:</strong> System input idle timer to calculate active versus away periods.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>
                  <strong className="text-gray-900 font-medium">Workstation Details:</strong> Machine hostname and operating system to link logs to your profile.
                </span>
              </li>
            </ul>
          </div>

          {/* Data NOT Collected */}
          <div className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-lg space-y-2.5">
            <div className="flex items-center gap-1.5 pb-1 border-b border-gray-200 text-gray-900 font-semibold">
              <X className="w-3.5 h-3.5 text-rose-600" />
              <span>Data Not Collected</span>
            </div>
            <ul className="space-y-2 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                <span>
                  <strong className="text-gray-900 font-medium">No Keystroke Logging:</strong> Typed text, keystrokes, and passwords are never recorded.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                <span>
                  <strong className="text-gray-900 font-medium">No Content Surveillance:</strong> Document bodies, emails, chat messages, and clipboard items are never accessed.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                <span>
                  <strong className="text-gray-900 font-medium">No Screen or Camera Capture:</strong> Zero desktop screenshots, screen recording, or webcam access.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                <span>
                  <strong className="text-gray-900 font-medium">No Geolocation:</strong> No GPS or physical location tracking is performed.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Security / Retention footer note */}
        <div className="p-2.5 bg-white border border-gray-200 rounded-lg text-text-muted leading-relaxed">
          Logged data is restricted to authenticated company members and is accessible by your managers and administrators according to company policy.
        </div>
      </div>
    </Modal>
  );
}
