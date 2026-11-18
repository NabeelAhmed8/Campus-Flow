"use client";

import Link from "next/link";
import { GraduationCap, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkspaceConfig, WorkspaceNavItem } from "@/lib/workspace-config";

interface DashboardSidebarProps {
  workspace: WorkspaceConfig;
  institutionName: string;
  pathname: string;
  currentUrlSearch: string;
  onNavItemClick: (item: WorkspaceNavItem) => void;
  onSignOut: () => void;
}

export function DashboardSidebar({
  workspace,
  institutionName,
  pathname,
  currentUrlSearch,
  onNavItemClick,
  onSignOut,
}: DashboardSidebarProps) {
  return (
    <aside className="w-64 border-r bg-background flex-col shrink-0 hidden md:flex">
      {/* Brand & Workspace Identity */}
      <div className="h-16 flex items-center justify-between px-5 border-b">
        <Link href={workspace.rootHref} className="flex items-center gap-2.5" title="Go to Workspace Dashboard">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight">
              Campus<span className="text-primary/70 font-semibold">Flow</span>
            </span>
            <span
              className="block text-[10px] text-muted-foreground -mt-1 font-medium truncate max-w-[120px]"
              title={institutionName}
            >
              {institutionName}
            </span>
          </div>
        </Link>
      </div>

      {/* Active Workspace Banner */}
      <div className="px-4 py-3 bg-muted/40 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <workspace.icon className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground tracking-tight">
              {workspace.title}
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {workspace.badge.replace(" Workspace", "")}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {workspace.title} Navigation
        </div>
        {workspace.navItems.map((item) => {
          const Icon = item.icon;
          let isActive = false;

          if (item.tabKey) {
            const urlParams = new URLSearchParams(currentUrlSearch);
            const activeUrlTab = urlParams.get("tab");
            isActive = activeUrlTab
              ? activeUrlTab === item.tabKey
              : workspace.navItems[0]?.tabKey === item.tabKey;
          } else if (item.href.includes("#")) {
            isActive = false;
          } else {
            isActive = pathname === item.href;
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onNavItemClick(item)}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate leading-snug" title={item.name}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Sign Out & Home */}
      <div className="p-3 border-t space-y-1.5 bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="w-full justify-start text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8.5 font-medium transition-colors"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign Out
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground h-8"
          asChild
        >
          <Link href="/">
            <Home className="mr-2 h-3.5 w-3.5" />
            Back to Home
          </Link>
        </Button>
      </div>
    </aside>
  );
}
