import React, { useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ShieldCheck, Sliders, Clock, Save, Plus } from "lucide-react";
import { Input } from "../../components/ui/Input";

export function TrackingPoliciesPage() {
  const [idleThreshold, setIdleThreshold] = useState("300");
  const [syncInterval, setSyncInterval] = useState("300");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tracking Policies & Shift Rules"
        subtitle="Configure organization-level inactivity thresholds, shift schedules, and application categorization rules."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings & Compliance" },
          { label: "Tracking Policies" },
        ]}
        actions={
          <Button variant="primary" size="sm" className="gap-1.5">
            <Save className="w-3.5 h-3.5" />
            <span>Save Policies</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-text-primary">Inactivity & Detection Thresholds</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Idle Trigger Threshold (Seconds)
              </label>
              <Input
                type="number"
                value={idleThreshold}
                onChange={(e) => setIdleThreshold(e.target.value)}
                className="mt-1 text-xs"
              />
              <p className="text-[11px] text-text-muted mt-1">
                Default: 300s (5 minutes). If no mouse or keyboard event occurs via GetLastInputInfo, system enters Idle.
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Cloud Batch Sync Cadence (Seconds)
              </label>
              <Input
                type="number"
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
                className="mt-1 text-xs"
              />
              <p className="text-[11px] text-text-muted mt-1">
                Default: 300s (5 minutes). Intervals are buffered in local durable queue to respect Spark quotas.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-text-primary">Classification Rules</h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Specify executable tags for automatic classification into <strong>Work</strong>, <strong>Neutral</strong>, or <strong>Restricted</strong> categories.
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-gray-50 rounded-lg flex items-center justify-between">
              <span>Code.exe, devenv.exe, Figma.exe</span>
              <Badge variant="success">Work</Badge>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg flex items-center justify-between">
              <span>chrome.exe, msedge.exe, brave.exe</span>
              <Badge variant="neutral">Neutral</Badge>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg flex items-center justify-between">
              <span>Steam.exe, Spotify.exe, Discord.exe</span>
              <Badge variant="warning">Restricted</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
