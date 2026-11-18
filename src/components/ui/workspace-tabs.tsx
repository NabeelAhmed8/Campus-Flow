"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface WorkspaceTabItem<T extends string = string> {
  id: T;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  badgeTone?: "default" | "success" | "warning" | "danger";
}

interface WorkspaceTabsProps<T extends string = string> {
  tabs: WorkspaceTabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
}

export function WorkspaceTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className,
}: WorkspaceTabsProps<T>) {
  // Responsive grid columns tuned automatically to tab count with ZERO horizontal scrollbar
  const gridColsClass =
    tabs.length <= 3
      ? "grid-cols-1 sm:grid-cols-3"
      : tabs.length === 4
      ? "grid-cols-2 lg:grid-cols-4"
      : tabs.length === 5
      ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"
      : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6";

  return (
    <div
      role="tablist"
      aria-label="Workspace navigation tabs"
      className={cn(
        "rounded-2xl border border-border/80 bg-card/90 p-1.5 shadow-2xs",
        className
      )}
    >
      <div className={cn("grid gap-1.5", gridColsClass)}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasBadge =
            tab.badge !== undefined &&
            tab.badge !== null &&
            String(tab.badge).trim() !== "";

          const badgeClass = isActive
            ? "bg-primary-foreground/20 text-primary-foreground"
            : tab.badgeTone === "success"
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : tab.badgeTone === "warning"
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : tab.badgeTone === "danger"
            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
            : "bg-primary/10 text-primary";

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              title={tab.label}
              onClick={() => onChange(tab.id)}
              className={cn(
                "group relative flex items-center justify-center sm:justify-start gap-2 rounded-xl px-3 py-2.5 min-h-[42px] text-xs font-semibold transition-all duration-150 border min-w-0",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-muted/25 text-muted-foreground border-transparent hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-primary"
                )}
              />
              <span className="truncate leading-tight">
                {tab.shortLabel ? (
                  <>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </>
                ) : (
                  tab.label
                )}
              </span>

              {hasBadge && (
                <span
                  className={cn(
                    "ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none uppercase tracking-tight",
                    badgeClass
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
