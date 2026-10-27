import React from "react";
import { cn } from "../../../lib/utils";

export interface AttendanceMetric {
  label: string;
  value: number | string;
  dotColor?: string;
  highlight?: boolean;
}

export function AttendanceSummaryStrip({
  metrics,
  className,
}: {
  metrics: AttendanceMetric[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-card border border-surface-border px-4 sm:px-5 py-2.5 flex items-center gap-4 sm:gap-6 divide-x divide-surface-border overflow-x-auto scrollbar-none text-xs shadow-card select-none",
        className
      )}
    >
      {metrics.map((m, idx) => (
        <div key={m.label} className={cn("shrink-0", idx > 0 && "pl-4 sm:pl-6")}>
          <div className="flex items-center gap-1.5 text-text-secondary text-[11px] font-medium whitespace-nowrap">
            {m.dotColor && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", m.dotColor)} />}
            <span>{m.label}</span>
          </div>
          <span
            className={cn(
              "text-base sm:text-lg font-bold tabular-nums mt-0.5 block leading-tight",
              m.highlight ? "text-amber-700" : "text-text-primary"
            )}
          >
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
}
