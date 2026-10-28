import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  ClockAlert,
  CheckCircle,
  MessageSquarePlus,
  AlertCircle,
  Clock,
  Laptop,
  Check,
  Calendar,
  Coffee,
  PhoneCall,
  Users,
  Layers,
  FileText,
} from "lucide-react";
import { doc, updateDoc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { TIMETRACK_COLLECTIONS } from "../../lib/collections";
import {
  subscribeToActivityLogs,
  formatSecondsToDuration,
  getTodayDateString,
  ActivityIntervalRecord,
  ConsolidatedIntervalRecord,
  consolidateActivityIntervals,
} from "../../lib/telemetryService";
import { useAuth } from "../../lib/authContext";

const ANNOTATION_CATEGORIES = [
  { label: "Client Call / Meeting", icon: PhoneCall, type: "work" },
  { label: "Internal Team Discussion", icon: Users, type: "work" },
  { label: "Architecture / Planning", icon: Layers, type: "work" },
  { label: "Lunch Break", icon: Coffee, type: "break" },
  { label: "Tea / Refreshment Break", icon: Coffee, type: "break" },
  { label: "Personal Downtime", icon: Clock, type: "neutral" },
];

export function InactivityReviewPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<(ActivityIntervalRecord | ConsolidatedIntervalRecord)[]>([]);
  const [dateFilter, setDateFilter] = useState<string>(getTodayDateString());
  const [selectedInterval, setSelectedInterval] = useState<(ActivityIntervalRecord | ConsolidatedIntervalRecord) | null>(null);
  const [reasonCategory, setReasonCategory] = useState("Client Call / Meeting");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to idle logs for selected date
  useEffect(() => {
    const unsubscribe = subscribeToActivityLogs(
      { date: dateFilter },
      (fetchedLogs) => {
        // Consolidate continuous intervals so repetitive 15s ticks club into single clean sessions
        const consolidated = consolidateActivityIntervals(fetchedLogs);
        const idleItems = consolidated.filter(
          (l) => l.state === "idle" || l.state === "locked" || (l.durationSeconds && l.durationSeconds >= 180)
        );
        setLogs(idleItems);
      }
    );
    return () => unsubscribe();
  }, [dateFilter]);

  // KPIs
  const totalIdleSeconds = useMemo(() => {
    return logs.reduce((acc, l) => acc + (l.durationSeconds || 0), 0);
  }, [logs]);

  const annotatedSeconds = useMemo(() => {
    return logs
      .filter((l) => Boolean(l.inactivityReason))
      .reduce((acc, l) => acc + (l.durationSeconds || 0), 0);
  }, [logs]);

  const pendingItems = useMemo(() => {
    return logs.filter((l) => !l.inactivityReason);
  }, [logs]);

  const handleOpenAnnotate = (interval: ActivityIntervalRecord) => {
    setSelectedInterval(interval);
    setReasonCategory("Client Call / Meeting");
    setNotes(interval.inactivityReason || "");
  };

  const handleSaveAnnotation = async () => {
    if (!selectedInterval) return;
    setIsSubmitting(true);
    try {
      const fullReason = `${reasonCategory}: ${notes || "Offline work duration approved"}`;

      // Update in Firestore timetrack_activity_logs (updating all raw intervals in the consolidated block)
      const rawList = (selectedInterval as ConsolidatedIntervalRecord).rawIntervals || [selectedInterval];
      await Promise.all(
        rawList.map((raw) => {
          const logRef = doc(db, TIMETRACK_COLLECTIONS.LOGS, raw.id);
          return updateDoc(logRef, {
            inactivityReason: fullReason,
            annotatedBy: user?.name || "Employee",
            annotatedAt: serverTimestamp(),
            category: reasonCategory.includes("Break") ? "neutral" : "work",
          }).catch((e) => console.warn("Failed to annotate sub-interval", e));
        })
      );

      // Also record in timetrack_inactivity_notes for central tracking
      const noteRef = doc(
        collection(db, TIMETRACK_COLLECTIONS.INACTIVITY_NOTES),
        `note_${selectedInterval.id}`
      );
      await setDoc(noteRef, {
        intervalId: selectedInterval.id,
        employeeName: selectedInterval.employeeName || user?.name || "Staff",
        employeeEmail: selectedInterval.employeeEmail || user?.email,
        date: dateFilter,
        durationMinutes: selectedInterval.durationMinutes,
        reason: fullReason,
        status: "APPROVED",
        createdAt: serverTimestamp(),
      });

      setSelectedInterval(null);
      setNotes("");
    } catch (err) {
      console.error("Failed to save annotation:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inactivity Review & Offline Annotations"
        subtitle="Review workstation idle periods and annotate legitimate offline work (client calls, team discussions, lunch/tea breaks)."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Telemetry & Time" },
          { label: "Inactivity Review" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs bg-white border border-surface-border rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none"
            />
            {pendingItems.length > 0 ? (
              <Badge variant="warning" className="gap-1.5 py-1 px-3 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pendingItems.length} Pending Review</span>
              </Badge>
            ) : (
              <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>All Idle Periods Reviewed</span>
              </Badge>
            )}
          </div>
        }
      />

      {/* Transparency Card */}
      <Card className="p-5 border-l-4 border-l-indigo-500 bg-indigo-50/20">
        <div className="flex items-start gap-3">
          <ClockAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              Offline Work Accountability & Billable Credit
            </h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              When employees step away from their desk for client calls, whiteboarding sessions, or meal breaks, the desktop agent automatically logs an idle duration. Review and annotate approved offline activities below to convert them into billable work.
            </p>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-text-muted font-medium">Total Inactivity Detected</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {formatSecondsToDuration(totalIdleSeconds)}
          </p>
          <p className="text-xs text-text-muted mt-1">{logs.length} detected intervals</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-muted font-medium">Annotated / Approved Offline Time</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatSecondsToDuration(annotatedSeconds)}
          </p>
          <p className="text-xs text-emerald-700 mt-1">Credited as verified active work</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-muted font-medium">Pending Annotation</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {formatSecondsToDuration(totalIdleSeconds - annotatedSeconds)}
          </p>
          <p className="text-xs text-amber-700 mt-1">{pendingItems.length} intervals requiring review</p>
        </Card>
      </div>

      {/* Inactivity Queue */}
      <Card>
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Inactivity Queue for {dateFilter}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Unattended intervals detected via Win32 GetLastInputInfo
            </p>
          </div>
          <span className="text-xs font-semibold text-text-primary bg-gray-100 px-2.5 py-1 rounded-md">
            {logs.length} Intervals Recorded
          </span>
        </div>

        <div className="p-5">
          {logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((interval) => {
                const isAnnotated = Boolean(interval.inactivityReason);
                return (
                  <div
                    key={interval.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isAnnotated
                        ? "bg-emerald-50/20 border-emerald-200"
                        : "bg-white border-surface-border hover:border-gray-300 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isAnnotated
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary text-xs">
                            {interval.startDisplay || "13:30"} – {interval.endDisplay || "14:15"}
                          </span>
                          <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            {formatSecondsToDuration(interval.durationSeconds)}
                          </span>
                          {isAnnotated ? (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Approved
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Pending Review
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1">
                            <Laptop className="w-3 h-3 text-gray-400" />
                            <span>{interval.deviceId || "Workstation"}</span>
                          </span>
                          <span>•</span>
                          <span>{interval.employeeName || interval.employeeEmail || "Staff Member"}</span>
                        </div>

                        {interval.inactivityReason && (
                          <div className="mt-2 text-xs bg-white border border-emerald-200/80 rounded-lg p-2 text-emerald-900 flex items-start gap-2">
                            <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{interval.inactivityReason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Button
                        variant={isAnnotated ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => handleOpenAnnotate(interval)}
                        className="gap-1.5 text-xs whitespace-nowrap"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                        <span>{isAnnotated ? "Edit Note" : "Annotate Reason"}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-text-muted space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-text-primary">No idle periods detected for {dateFilter}</p>
              <p className="text-text-muted text-[11px] max-w-sm mx-auto">
                Workstation active presence was maintained continuously. Any detected periods of away-time (&gt; 5 mins) will show up here automatically.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal / Dialog for Annotating Inactivity */}
      {selectedInterval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Annotate Inactivity Period
              </h3>
              <p className="text-xs text-text-muted mt-1">
                {selectedInterval.startDisplay} – {selectedInterval.endDisplay} (
                {formatSecondsToDuration(selectedInterval.durationSeconds)}) on {dateFilter}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
                Select Activity Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ANNOTATION_CATEGORIES.map(({ label, icon: Icon }) => {
                  const isSelected = reasonCategory === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setReasonCategory(label)}
                      className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all flex items-center gap-2 ${
                        isSelected
                          ? "bg-gray-950 border-gray-950 text-white shadow-xs"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1 mt-2">
                  Explanation & Context
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Attended client demo call or discussed sprint planning..."
                  className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedInterval(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAnnotation}
                disabled={isSubmitting}
                className="gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Saving..." : "Approve & Credit Time"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
