import React from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Radio, Users, Filter, CheckCircle2, RefreshCw } from "lucide-react";

export function TeamLiveActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Team Activity & Pulse"
        subtitle="Real-time device utilization and current foreground tool overview across all team members."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Workforce" },
          { label: "Live Team Activity" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>18 / 24 Online Now</span>
            </Badge>
            <Button variant="secondary" size="sm" className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Pulse</span>
            </Button>
          </div>
        }
      />

      {/* High-level department summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-emerald-50/30 border-emerald-200/50">
          <p className="text-[11px] text-emerald-800 font-semibold">Active Right Now</p>
          <p className="text-xl font-bold text-emerald-950 mt-0.5">14</p>
        </Card>
        <Card className="p-3 bg-amber-50/30 border-amber-200/50">
          <p className="text-[11px] text-amber-800 font-semibold">Idle / Away</p>
          <p className="text-xl font-bold text-amber-950 mt-0.5">4</p>
        </Card>
        <Card className="p-3 bg-purple-50/30 border-purple-200/50">
          <p className="text-[11px] text-purple-800 font-semibold">Session Locked</p>
          <p className="text-xl font-bold text-purple-950 mt-0.5">2</p>
        </Card>
        <Card className="p-3 bg-gray-50 border-gray-200">
          <p className="text-[11px] text-gray-600 font-semibold">Offline / Shift Over</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">4</p>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Workforce Presence Grid</h3>
          <span className="text-xs text-text-muted">Auto-updates every 3 seconds</span>
        </div>
        <div className="p-4 text-center py-10 text-xs text-text-muted">
          Team members status grid with live app chips will be connected in Step 5.
        </div>
      </Card>
    </div>
  );
}
