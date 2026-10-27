import React from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Laptop, Cpu, CheckCircle2, ShieldAlert, ArrowUpRight } from "lucide-react";

export function DeviceHealthPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Workstation Inventory & Endpoint Health"
        subtitle="Hardware telemetry, OS distribution, agent versions, and atomic local queue sync status."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Hardware & Reports" },
          { label: "Workstations & Devices" },
        ]}
        actions={
          <Button variant="primary" size="sm" className="gap-1.5">
            <Laptop className="w-3.5 h-3.5" />
            <span>Enroll New Workstation</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-text-muted font-medium">Registered Laptops</p>
          <p className="text-2xl font-bold text-text-primary mt-1">24 Active</p>
          <p className="text-xs text-emerald-600 mt-1">100% Windows 10/11 Workstations</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted font-medium">Agent Version Compliance</p>
          <p className="text-2xl font-bold text-text-primary mt-1">v1.0.0</p>
          <p className="text-xs text-text-muted mt-1">24 / 24 on latest release</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted font-medium">Pending Sync Queues</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">0 Pending</p>
          <p className="text-xs text-text-muted mt-1">Atomic durable queue operational</p>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Enrolled Workstations</h3>
          <span className="text-xs text-text-muted">Showing 24 endpoints</span>
        </div>
        <div className="p-4 text-center py-10 text-xs text-text-muted">
          Endpoint registry table with CPU usage, heartbeat, and queue status will be populated in Step 5.
        </div>
      </Card>
    </div>
  );
}
