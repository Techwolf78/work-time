import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  Building,
  User,
  AlertCircle,
  Database,
} from "lucide-react";
import { useAuth, DEMO_USERS } from "../../lib/authContext";
import { activeEnv, setFirebaseEnv, firebaseConfig } from "../../lib/firebase";
import { UserRole } from "../../types/hrms";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { GaHrmsLogo } from "../../components/ui/GaHrmsLogo";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { loginWithFirebase, login, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

  // Primary Login using live Gryphon CRM Firebase Auth
  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setLocalError("Please enter your corporate email address and password.");
      return;
    }

    setLocalError(null);
    clearAuthError();
    setIsSubmitting(true);

    try {
      await loginWithFirebase(email, password, rememberMe);
      setIsSubmitting(false);
      navigate("/dashboard");
    } catch (err: any) {
      setIsSubmitting(false);
      setLocalError(err.message || "Authentication failed. Please verify your credentials.");
    }
  };

  // Offline Demo Persona Shortcut (for developer testing)
  const handleQuickDemo = (roleKey: UserRole) => {
    const demo = DEMO_USERS[roleKey];
    if (demo) {
      login(demo.email, roleKey, demo);
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAFAFA] text-gray-900 selection:bg-gray-950 selection:text-white">
      {/* Left Column: Dark Editorial Brand Sidebar */}
      <div className="lg:w-1/2 bg-gray-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-r border-gray-900">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1F2937_1px,transparent_1px),linear-gradient(to_bottom,#1F2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 -z-10 pointer-events-none" />

        {/* Top: Logo & System Classification */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <GaHrmsLogo size="md" variant="dark" productName="WORK-TIME" />
          </Link>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{activeEnv === "dev" ? "Dev DB: authencation-39485" : "Prod DB: gryphon-sync"}</span>
          </div>
        </div>

        {/* Center: Hero Heading & Pillars */}
        <div className="relative z-10 my-12 space-y-8 max-w-lg">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white">
              Autonomous workforce telemetry. Zero timesheets.
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed font-normal">
              Sign in with your corporate credentials to access live desktop presence, continuous activity timelines, and automated focus reports.
            </p>
          </div>

          {/* Value points */}
          <div className="space-y-3 pt-2">
            {[
              `Connected to ${firebaseConfig.projectId} (${activeEnv === "dev" ? "Developer Testing DB" : "Production Paid DB"})`,
              "Isolated timetrack_* database collections (zero collision with CRM data)",
              "Strict Privacy by Design (zero keylogging, zero media grabs, zero content inspection)",
              "Automatic role routing: Admin → Super Admin • Head/Director/Manager → Manager • Staff → Employee",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Organization context */}
        <div className="relative z-10 text-xs text-gray-500 flex items-center justify-between border-t border-gray-900 pt-6">
          <span>Gryphon Technologies • Pune HQ</span>
          <span className="font-mono text-[11px] text-gray-400">
            Active Project: {firebaseConfig.projectId}
          </span>
        </div>
      </div>

      {/* Right Column: Sign In Card */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#FAFAFA]">
        <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-gray-200/90 shadow-sm">
          {/* Header */}
          <div className="space-y-1.5 text-left">
            <div className="lg:hidden pb-3">
              <GaHrmsLogo size="md" variant="light" productName="WORK-TIME" />
            </div>
            <h3 className="text-2xl font-black text-gray-950 tracking-tight">
              Sign in to Work-Time
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Enter your corporate email and password from Gryphon CRM.
            </p>
          </div>

          {/* Database Switcher: Developer Testing DB vs Production DB */}
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-700 font-medium">
              <Database className="w-3.5 h-3.5 text-gray-500" />
              <span>Target Database:</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFirebaseEnv("dev")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeEnv === "dev"
                    ? "bg-gray-950 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/70"
                }`}
                title="Testing DB: authencation-39485"
              >
                Dev (39485)
              </button>
              <button
                type="button"
                onClick={() => setFirebaseEnv("prod")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeEnv === "prod"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/70"
                }`}
                title="Production Paid DB: gryphon-sync"
              >
                Prod (Gryphon)
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {(localError || authError) && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{localError || authError}</div>
            </div>
          )}

          {/* Standard Form */}
          <form onSubmit={handleFirebaseLogin} className="space-y-4 pt-1">
            <Input
              label="Corporate Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLocalError(null);
                clearAuthError();
              }}
              placeholder="e.g. name@gryphon.io or your CRM email"
              leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
              autoComplete="username"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError(null);
                clearAuthError();
              }}
              placeholder="Enter your CRM password"
              leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
              autoComplete="current-password"
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-gray-950 focus:ring-gray-950/20 w-4 h-4 accent-gray-950"
                />
                <span>Remember me on this PC</span>
              </label>

              <span className="text-[11px] text-text-muted">
                {activeEnv === "dev" ? "authencation-39485" : "gryphon-sync"}
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center gap-2 text-sm font-semibold shadow-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating against {firebaseConfig.projectId}...</span>
                </>
              ) : (
                <>
                  <span>
                    Sign In ({activeEnv === "dev" ? "Dev DB" : "Prod DB"})
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Offline Switcher */}
          <div className="pt-4 border-t border-gray-100 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span className="font-semibold uppercase tracking-wider">
                Or Quick Offline Preview
              </span>
              <span className="text-gray-400">Dev Shortcut</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("SUPER_ADMIN")}
                className="p-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
                title="Log in as Super Admin"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                  <Shield className="w-3.5 h-3.5 text-gray-700" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Admin Dept</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("MANAGER")}
                className="p-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
                title="Log in as Manager"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                  <Building className="w-3.5 h-3.5 text-gray-700" />
                  <span>Manager</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Head/Director</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("EMPLOYEE")}
                className="p-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
                title="Log in as Employee"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                  <User className="w-3.5 h-3.5 text-gray-700" />
                  <span>Employee</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Staff User</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
