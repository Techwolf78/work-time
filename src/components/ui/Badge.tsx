import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "purple"
    | "cyan"
    | "neutral"
    | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1 font-medium",
  };

  const variantStyles = {
    default: "bg-gray-100 text-gray-700 border border-gray-200",
    success: "bg-gray-50 text-gray-900 border border-gray-300 font-medium",
    warning: "bg-gray-50 text-gray-800 border border-gray-300 font-medium",
    danger: "bg-gray-50 text-gray-800 border border-gray-300 font-medium",
    purple: "bg-gray-50 text-gray-800 border border-gray-300 font-medium",
    cyan: "bg-gray-50 text-gray-800 border border-gray-300 font-medium",
    neutral: "bg-gray-100 text-gray-600 border border-gray-200",
    outline: "bg-transparent text-gray-700 border border-gray-300",
  };

  const dotColors = {
    default: "bg-gray-400",
    success: "bg-gray-950",
    warning: "bg-gray-600",
    danger: "bg-gray-700",
    purple: "bg-gray-600",
    cyan: "bg-gray-600",
    neutral: "bg-gray-400",
    outline: "bg-gray-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full select-none",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
}
