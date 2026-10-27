import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "../../lib/utils";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  subtitle?: string;
  accentColor?: "purple" | "cyan" | "emerald" | "amber" | "rose" | "blue" | "neutral" | "indigo";
  onClick?: () => void;
  className?: string;
}

export function KpiCard({
  label,
  value,
  icon,
  trend,
  subtitle,
  accentColor = "purple",
  onClick,
  className,
}: KpiCardProps) {
  const iconBgStyles = {
    purple: "bg-gray-100 text-gray-900",
    neutral: "bg-gray-100 text-gray-900",
    indigo: "bg-indigo-50 text-indigo-700",
    cyan: "bg-cyan-50 text-cyan-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-gray-200/90 p-4 sm:p-4.5 shadow-xs transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-sm hover:border-gray-400/80 active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <div className="text-2xl sm:text-[26px] font-bold text-gray-950 tracking-tight">
            {value}
          </div>
        </div>
        <div className={cn("p-2.5 rounded-xl flex items-center justify-center shrink-0", iconBgStyles[accentColor])}>
          {icon}
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 pt-2.5 border-t border-surface-border-subtle flex items-center justify-between gap-2 text-xs text-text-secondary">
          {trend && (
            <div className="flex items-center gap-1 font-medium shrink-0">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold",
                  trend.isPositive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {trend.value}
              </span>
              {trend.label && <span className="text-text-muted text-[11px] hidden sm:inline">{trend.label}</span>}
            </div>
          )}
          {subtitle && (
            <span
              className="text-text-muted truncate text-[11px] sm:text-xs text-right"
              title={subtitle}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
