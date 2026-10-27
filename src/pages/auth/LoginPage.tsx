import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowRight, AlertCircle, Download } from "lucide-react";
import { useAuth } from "../../lib/authContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { GaHrmsLogo } from "../../components/ui/GaHrmsLogo";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { loginWithFirebase, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between selection:bg-neutral-900 selection:text-white px-4 py-8">
      {/* Top Simple Nav */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <GaHrmsLogo size="md" variant="light" productName="WORK-TIME" />
        </Link>
        <Link
          to="/"
          className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          ← Back to home
        </Link>
      </header>

      {/* Centered Sign In Card */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-1.5 text-left">
            <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">
              Sign in to Work-Time
            </h1>
            <p className="text-sm text-neutral-500">
              Enter your corporate email and password.
            </p>
          </div>

          {/* Error Banner */}
          {(localError || authError) && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{localError || authError}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleFirebaseLogin} className="space-y-4">
            <Input
              label="Corporate Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLocalError(null);
                clearAuthError();
              }}
              placeholder="name@gryphonacademy.co.in"
              leftIcon={<Mail className="w-4 h-4 text-neutral-400" />}
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
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4 text-neutral-400" />}
              autoComplete="current-password"
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950/20 w-4 h-4 accent-neutral-950"
                />
                <span>Remember me on this PC</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center gap-2 text-sm font-semibold bg-neutral-900 hover:bg-black text-white rounded-lg h-11"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Direct link to download desktop app */}
          <div className="pt-4 border-t border-neutral-100 text-center">
            <a
              href="/downloads/WorkPulse.exe"
              download="WorkPulse.exe"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-950 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>Need the desktop agent? Download WorkPulse (.exe)</span>
            </a>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-xs text-neutral-400">
        Gryphon Technologies • Pune HQ
      </footer>
    </div>
  );
}
