import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { useAuth } from "../../lib/authContext";
import { GaHrmsLogo } from "../../components/ui/GaHrmsLogo";
import { PrivacyNoticeModal } from "../../components/privacy/PrivacyNoticeModal";
import { DownloadAgentModal } from "../../components/layout/DownloadAgentModal";
import { Modal } from "../../components/ui/Modal";

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showUnblockGuide, setShowUnblockGuide] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      {/* Top Header */}
      <header className="h-16 border-b border-neutral-200 px-6 sm:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GaHrmsLogo size="md" variant="light" productName="WORK-TIME" />
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
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download for Windows</span>
                </a>
                <a
                  href="/downloads/GA-Work-Time.exe"
                  download="GA-Work-Time.exe"
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-medium transition-colors"
                  title="Direct standalone .exe"
                >
                  <span>.exe</span>
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200/80 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-xs text-neutral-600">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  No setup wizard needed
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Automatic idle & break tracking
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Zero keylogging or screen recording
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowUnblockGuide(true)}
                className="text-[11px] text-neutral-400 hover:text-neutral-700 hover:underline transition-colors ml-auto"
              >
                Chrome help?
              </button>
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
        <span>Gryphon Academy Pvt. Ltd.</span>
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

      {showUnblockGuide && (
        <Modal
          isOpen={showUnblockGuide}
          onClose={() => setShowUnblockGuide(false)}
          title="Windows & Chrome Download Help"
          size="md"
        >
          <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
            <p>
              Google Chrome may occasionally show a generic precautionary prompt (<em>"Suspicious download blocked"</em>) for newly published enterprise binaries. The file is 100% clean and safe.
            </p>

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3.5 space-y-2">
              <div className="font-semibold text-neutral-900">2-Click Quick Unblock:</div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <span>Click the small arrow <strong>(&gt;)</strong> next to <em>GA-Work-Time.exe</em> in Chrome's download bar.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <span>Click <strong>"Download suspicious file"</strong> (or <strong>"Keep anyway"</strong>).</span>
              </div>
            </div>

            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
              <div className="font-semibold text-neutral-900">Recommended Alternative:</div>
              <p className="text-neutral-600">
                Download the <strong>.zip</strong> archive instead — zip files download instantly with zero browser warnings.
              </p>
            </div>

            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
              <div className="font-semibold text-neutral-900">Or 1-Click Install via PowerShell:</div>
              <div className="flex items-center justify-between gap-2 bg-white border border-neutral-200 rounded px-2.5 py-1.5 font-mono text-[11px]">
                <code className="text-neutral-800 truncate">irm https://work-time-lyart.vercel.app/install.ps1 | iex</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("irm https://work-time-lyart.vercel.app/install.ps1 | iex");
                    setCopiedCli(true);
                    setTimeout(() => setCopiedCli(false), 2000);
                  }}
                  className="px-2.5 py-0.5 rounded bg-neutral-900 hover:bg-black text-white text-[10px] font-sans font-medium transition-colors shrink-0"
                >
                  {copiedCli ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
