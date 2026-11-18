"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Menu,
  ChevronDown,
  Home,
  Globe,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import {
  CustomDropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "@/components/ui/custom-dropdown-menu";
import type { WorkspaceConfig, WorkspaceNavItem } from "@/lib/workspace-config";

interface DashboardHeaderProps {
  workspace: WorkspaceConfig;
  institutionName: string;
  userName: string;
  userEmail: string;
  initials: string;
  userRole: string;
  pathname: string;
  currentUrlSearch: string;
  isProfileRoute: boolean;
  onNavItemClick: (item: WorkspaceNavItem) => void;
  onResetWorkspaceTab: () => void;
  onSignOut: () => void;
}

export function DashboardHeader({
  workspace,
  institutionName,
  userName,
  userEmail,
  initials,
  userRole,
  pathname,
  currentUrlSearch,
  isProfileRoute,
  onNavItemClick,
  onResetWorkspaceTab,
  onSignOut,
}: DashboardHeaderProps) {
  const router = useRouter();
  const isAtDefaultWorkspaceView =
    pathname === workspace.rootHref &&
    (!currentUrlSearch || currentUrlSearch === `?tab=${workspace.defaultTab}`);

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-2.5">
        <Link
          href={workspace.rootHref}
          className="md:hidden flex items-center gap-1.5 font-bold text-sm"
          title="Go to Workspace Dashboard"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline">CampusFlow</span>
        </Link>

        {/* Mobile Workspace Navigation Dropdown */}
        <div className="md:hidden">
          <CustomDropdown>
            <DropdownTrigger className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-muted/60 text-xs font-semibold border border-border hover:bg-muted transition-colors">
              <Menu className="h-3.5 w-3.5 text-primary" />
              <span className="truncate max-w-[100px]">
                {workspace.title
                  .replace(" Workspace", "")
                  .replace(" Hub", "")
                  .replace(" AI Suite", "")}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </DropdownTrigger>
            <DropdownContent align="left" minWidth="min-w-[220px]">
              <DropdownLabel>{workspace.title} Tabs</DropdownLabel>
              {workspace.navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownItem
                    key={item.name}
                    icon={Icon}
                    onClick={() => {
                      onNavItemClick(item);
                      router.push(item.href);
                    }}
                  >
                    {item.name}
                  </DropdownItem>
                );
              })}
              <DropdownSeparator />
              <DropdownItem icon={Home} onClick={() => router.push("/")}>
                CampusFlow Home
              </DropdownItem>
            </DropdownContent>
          </CustomDropdown>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground truncate max-w-[200px]" title={institutionName}>
            {institutionName}
          </span>
          <span>•</span>
          <span className="font-medium text-primary">{workspace.badge}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <Button
          variant="outline"
          size="xs"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/" title="Visit public platform website">
            <Globe className="h-3.5 w-3.5" />
            <span>Public Site</span>
          </Link>
        </Button>

        <NotificationBell userRole={userRole} />

        {/* User Profile Dropdown */}
        <CustomDropdown>
          <DropdownTrigger className="flex items-center gap-2 pl-2 border-l cursor-pointer hover:opacity-85 transition-opacity text-left">
            <div className="relative">
              <div className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-2xs border border-primary/20">
                {initials}
              </div>
              <div className="sm:hidden absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground shadow-2xs">
                <ChevronDown className="h-2 w-2" />
              </div>
            </div>
            <div className="hidden sm:block text-left max-w-[140px] md:max-w-[170px]">
              <div className="text-xs font-semibold leading-tight truncate text-foreground" title={userName}>
                {userName}
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight truncate">
                {workspace.roleLabel}
              </div>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block opacity-60" />
          </DropdownTrigger>

          <DropdownContent align="right" minWidth="w-[280px] sm:w-[320px] max-w-[calc(100vw-1.5rem)]">
            <div className="px-3 py-2.5 border-b border-border/60 bg-muted/40 rounded-lg mb-1.5">
              <div className="flex items-center gap-2.5">
                <div className="h-8.5 w-8.5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs uppercase border border-primary/25 shrink-0 shadow-2xs">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-foreground leading-tight truncate" title={userName}>
                    {userName}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate" title={userEmail || institutionName}>
                    {userEmail || institutionName}
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between gap-1.5">
                <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {workspace.badge.replace(" Workspace", "")}
                </span>
                <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Active Session
                </span>
              </div>
            </div>

            <DropdownLabel className="px-2.5 pt-1 pb-1">Account &amp; Navigation</DropdownLabel>

            <DropdownItem
              icon={User}
              description="Manage personal details & password security"
              active={isProfileRoute}
              badge={
                isProfileRoute ? (
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Current
                  </span>
                ) : (
                  <span className="text-[9px] font-medium text-muted-foreground hover:text-foreground">
                    Profile ↵
                  </span>
                )
              }
              onClick={() => router.push("/profile")}
            >
              My Profile &amp; Account
            </DropdownItem>

            <DropdownItem
              icon={workspace.icon}
              description={workspace.description}
              active={isAtDefaultWorkspaceView}
              badge={
                isAtDefaultWorkspaceView ? (
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Current
                  </span>
                ) : (
                  <span className="text-[9px] font-medium text-muted-foreground hover:text-foreground">
                    Overview ↵
                  </span>
                )
              }
              onClick={onResetWorkspaceTab}
            >
              {workspace.title}
            </DropdownItem>

            <DropdownItem
              icon={Globe}
              description={workspace.landingDescription}
              badge={
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                  Public
                </span>
              }
              onClick={() => router.push("/")}
            >
              CampusFlow Landing
            </DropdownItem>

            <DropdownSeparator className="my-1.5" />

            <DropdownItem
              icon={LogOut}
              destructive
              onClick={onSignOut}
              description="Securely disconnect from this workspace"
            >
              Sign Out of Session
            </DropdownItem>
          </DropdownContent>
        </CustomDropdown>
      </div>
    </header>
  );
}
