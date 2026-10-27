import React from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ClockAlert, CheckCircle, MessageSquarePlus, AlertCircle } from "lucide-react";

export function InactivityReviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inactivity Review & Offline Annotations"
        subtitle="Review unmonitored or extended idle periods and annotate offline work (calls, client meetings, architecture reviews)."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Telemetry & Time" },
          { label: "Inactivity Review" },
        ]}
        actions={
          <Badge variant="warning" className="gap-1.5 py-1 px-3 text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>3 Pending Items Requiring Review</span>
          </Badge>
        }
      />

      <Card className="p-6 border-l-4 border-l-amber-500 bg-amber-50/20">
        <div className="flex items-start gap-3">
          <ClockAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              Empowering Employee Transparency & Offline Accountability
            </h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              When you step away from your workstation for phone calls, physical meetings, or offline reviews, the system records an idle interval.
              You can annotate reasons here to convert approved idle periods into active billable hours.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Inactivity Queue for Oct 26, 2026</h3>
          <span className="text-xs text-text-muted">Total unannotated: 52 minutes</span>
        </div>
        <div className="p-4 text-center py-10 text-xs text-text-muted">
          Interactive offline annotation cards and manager approval workflow will be connected in Step 6.
        </div>
      </Card>
    </div>
  );
}
