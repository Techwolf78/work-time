import React from "react";
import { FolderSearch } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-12 bg-white rounded-card border border-dashed border-gray-300",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-800 mb-4 shadow-2xs">
        {icon || <FolderSearch className="w-7 h-7" />}
      </div>
      <h4 className="text-base font-semibold text-text-primary tracking-tight">{title}</h4>
      <p className="text-sm text-text-secondary max-w-sm mt-1.5 mb-6">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionText}
        </Button>
      )}
    </div>
  );
}
