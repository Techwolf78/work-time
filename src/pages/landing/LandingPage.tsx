import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { useAuth } from "../../lib/authContext";
import { GaHrmsLogo } from "../../components/ui/GaHrmsLogo";
import { PrivacyNoticeModal } from "../../components/privacy/PrivacyNoticeModal";
import { DownloadAgentModal } from "../../components/layout/DownloadAgentModal";

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      {/* Top Header */}
      <header className="h-16 border-b border-neutral-200 px-6 sm:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GaHrmsLogo size="md" variant="light" productName="WORK-TIME" />
          <span className="hidden sm:inline-block text-[11px] font-medium text-neutral-500 border border-neutral-200 rounded-md px-2 py-0.5">
            Pune HQ
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Privacy Charter
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-medium transition-colors"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-medium transition-colors"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Download Section */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-16 sm:py-24 flex flex-col justify-center">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
              GA WORK-TIME for Windows
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              Download the background agent to sync your work hours and active focus with the team dashboard. Runs quietly in your system tray.
            </p>
          </div>

          {/* Download Action Box */}
          <div className="p-6 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-neutral-950 text-sm">
                  GA WORK-TIME Client v1.2.0
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Windows 10 / 11 • Standalone 36 KB • Auto-Updating
                </div>
              </div>

              {/* Clean unified download buttons */}
              <div className="flex items-center gap-2">
                <a
                  href="/downloads/GA-Work-Time.zip"
                  download="GA-Work-Time.zip"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-medium transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download (.zip)</span>
                </a>
                <a
                  href="/downloads/GA-Work-Time.exe"
                  download="GA-Work-Time.exe"
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-medium transition-colors"
                  title="Direct .exe download"
                >
                  <span>.exe</span>
                </a>
              </div>
            </div>

            {/* Subtle download helper tip */}
            <div className="text-[11px] text-neutral-500 bg-white border border-neutral-200/80 rounded-md px-3 py-2 leading-relaxed">
              <span>
                <strong>Download note:</strong> Use <strong>.zip</strong> for direct download without browser prompts, or <strong>.exe</strong> (if Chrome prompts, click <em>"Download suspicious file"</em>).
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-200/80 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-600">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-neutral-900" />
                No setup wizard needed
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-neutral-900" />
                Automatic idle & break tracking
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-neutral-900" />
                Zero keylogging or screen recording
              </span>
            </div>
          </div>

          {/* 3 Step Setup */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Setup in 3 Steps
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg border border-neutral-200 bg-white">
                <div className="text-xs font-bold text-neutral-400 mb-1">Step 1</div>
                <div className="text-xs font-semibold text-neutral-900 mb-1">Download</div>
                <div className="text-xs text-neutral-600">
                  Click download to get the single 36 KB file.
                </div>
              </div>

              <div className="p-4 rounded-lg border border-neutral-200 bg-white">
                <div className="text-xs font-bold text-neutral-400 mb-1">Step 2</div>
                <div className="text-xs font-semibold text-neutral-900 mb-1">Enter Email</div>
                <div className="text-xs text-neutral-600">
                  Open it once and type your work email to pair.
                </div>
              </div>

              <div className="p-4 rounded-lg border border-neutral-200 bg-white">
                <div className="text-xs font-bold text-neutral-400 mb-1">Step 3</div>
                <div className="text-xs font-semibold text-neutral-900 mb-1">Runs in Tray</div>
                <div className="text-xs text-neutral-600">
                  Docks by your clock. Double-click anytime to see your timer.
                </div>
              </div>
            </div>
          </div>

          {/* Web Dashboard Link */}
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 underline underline-offset-4"
            >
              <span>Already running the app? Open Web Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="h-14 border-t border-neutral-200 px-6 sm:px-10 flex items-center justify-between text-xs text-neutral-500">
        <span>Gryphon Academy Pvt. Ltd. • Pune HQ</span>
        <button
          onClick={() => setShowPrivacyModal(true)}
          className="hover:text-neutral-900 transition-colors flex items-center gap-1"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
          <span>Privacy Notice</span>
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
