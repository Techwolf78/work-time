import React, { useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { AppWindow, Filter, Download, Search, CheckCircle, AlertTriangle } from "lucide-react";
import { Input } from "../../components/ui/Input";

export function ApplicationUsagePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Usage & Foreground Analytics"
        subtitle="Autonomous tracking of foreground window focus durations and application categorization."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Telemetry & Time" },
          { label: "Application Usage" },
        ]}
        actions={
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-text-muted font-medium">Work Tools (Productive)</p>
          <p className="text-2xl font-bold text-text-primary mt-1">5h 18m</p>
          <p className="text-xs text-emerald-600 mt-1">78.5% of active session</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted font-medium">Neutral Tools / Browsers</p>
          <p className="text-2xl font-bold text-text-primary mt-1">1h 14m</p>
          <p className="text-xs text-indigo-600 mt-1">18.2% of active session</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted font-medium">Restricted / Non-Work</p>
          <p className="text-2xl font-bold text-text-primary mt-1">10m</p>
          <p className="text-xs text-amber-600 mt-1">3.3% of active session</p>
        </Card>
      </div>

      {/* App Table Card */}
      <Card>
        <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-sm w-full">
            <Input
              placeholder="Filter by application or executable..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant={categoryFilter === "all" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
            >
              All Apps
            </Button>
            <Button
              variant={categoryFilter === "work" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setCategoryFilter("work")}
            >
              Work Only
            </Button>
            <Button
              variant={categoryFilter === "neutral" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setCategoryFilter("neutral")}
            >
              Neutral
            </Button>
          </div>
        </div>

        <div className="p-4 text-center py-10 text-xs text-text-muted">
          Application breakdown catalog will be populated dynamically from the telemetry store in Step 4.
        </div>
      </Card>
    </div>
  );
}
