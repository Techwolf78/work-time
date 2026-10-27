import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Download,
  Laptop,
  ArrowRight,
  Shield,
  CheckCircle2,
  Clock,
  Check,
  ShieldCheck,
  Monitor,
} from "lucide-react";
import { useAuth } from "../../lib/authContext";
import { Button } from "../../components/ui/Button";
import { GaHrmsLogo } from "../../components/ui/GaHrmsLogo";
import { PrivacyNoticeModal } from "../../components/privacy/PrivacyNoticeModal";
import { DownloadAgentModal } from "../../components/layout/DownloadAgentModal";

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-text-primary flex flex-col justify-between selection:bg-gray-950 selection:text-white">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-surface-border px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <GaHrmsLogo size="md" variant="light" productName="WORK-TIME" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Pune HQ Live
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Privacy Charter</span>
          </button>

          {isAuthenticated ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-1.5 text-xs"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/login")}
              className="gap-1.5 text-xs"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Single-Section Landing View */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col justify-center">
        <div className="space-y-8">
          {/* Hero Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200 text-xs font-semibold">
              <Laptop className="w-3.5 h-3.5 text-gray-700" />
              <span>WorkPulse Desktop Agent • Windows 10/11</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-950 tracking-tight leading-tight">
              Autonomous Workforce Telemetry & Time Tracking
            </h1>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Real-time desktop presence, active application tracking, and automated timesheets.
              Download the lightweight background agent to link your workstation in seconds.
            </p>
          </div>

          {/* Central Download Card */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pb-6 border-b border-surface-border">
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-12 h-12 rounded-xl bg-gray-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-950">
                    WorkPulse for Windows
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Standalone Executable • 22.5 KB • Zero Console / No Terminal
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowDownloadModal(true)}
                  className="w-full sm:w-auto text-xs"
                >
                  Setup Guide
                </Button>

                <a
                  href="/downloads/WorkPulse.exe"
                  download="WorkPulse.exe"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-button bg-gray-950 hover:bg-black text-white font-medium text-xs shadow-xs transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download WorkPulse.exe</span>
                </a>
              </div>
            </div>

            {/* 3 Step Setup Guide */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                How It Works in 3 Steps
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-gray-50 border border-surface-border rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-900 text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <h4 className="text-xs font-semibold text-gray-950">Download App</h4>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Click download to get <strong>WorkPulse.exe</strong> (22 KB). No installation wizard or admin permissions needed.
                  </p>
                </div>

                <div className="p-3.5 bg-gray-50 border border-surface-border rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-900 text-[11px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <h4 className="text-xs font-semibold text-gray-950">Enter Work Email</h4>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Open the app once. A clean native dialog prompts for your CRM email to link your computer permanently.
                  </p>
                </div>

                <div className="p-3.5 bg-gray-50 border border-surface-border rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                      3
                    </span>
                    <h4 className="text-xs font-semibold text-gray-950">Silent Tray Sync</h4>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Docks quietly into your Windows taskbar tray by your clock. Automatically syncs active focus to your dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Enterprise Security Highlights */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary border-t border-surface-border">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Zero terminal / no command prompt
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Zero keylogging or screen recording
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Real-time Firebase telemetry stream
              </span>
            </div>
          </div>

          {/* Web Dashboard Quick Action */}
          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-950 underline underline-offset-4 transition-colors"
            >
              <span>Already running the agent? Open Web Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="h-14 border-t border-surface-border bg-white px-4 sm:px-8 flex items-center justify-between text-xs text-text-muted">
        <span>Gryphon Technologies • Pune HQ</span>
        <button
          onClick={() => setShowPrivacyModal(true)}
          className="hover:text-text-primary transition-colors flex items-center gap-1"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Privacy by Design</span>
        </button>
      </footer>

      {/* Modals */}
      <PrivacyNoticeModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
      <DownloadAgentModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
}
