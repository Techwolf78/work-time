import React from "react";
import { cn } from "../../lib/utils";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [activeTab, setActiveTabState] = React.useState(defaultValue);

  const currentTab = value !== undefined ? value : activeTab;
  const setTab = onValueChange || setActiveTabState;

  return (
    <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: setTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b border-surface-border overflow-x-auto no-scrollbar",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabTrigger({
  value,
  children,
  badge,
  className,
}: {
  value: string;
  children: React.ReactNode;
  badge?: number | string;
  className?: string;
}) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabTrigger must be used within Tabs");

  const isActive = context.activeTab === value;

  return (
    <button
      type="button"
      onClick={() => context.setActiveTab(value)}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 whitespace-nowrap -mb-px select-none",
        isActive
          ? "border-gray-950 text-gray-950 font-semibold"
          : "border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300",
        className
      )}
    >
      {children}
      {badge !== undefined && (
        <span
          className={cn(
            "text-[11px] px-2 py-0.5 rounded-full font-semibold",
            isActive
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function TabContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabContent must be used within Tabs");

  if (context.activeTab !== value) return null;

  return <div className={cn("pt-4 animate-fade-in", className)}>{children}</div>;
}
