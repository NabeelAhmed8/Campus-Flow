"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, LayoutDashboard, ChevronRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionGuard } from "@/components/subscription-guard";
import {
  clearClientAuthStorage,
  readClientAuthStorage,
  syncClientAuthStorage,
} from "@/lib/client-auth";
import { getInitials } from "@/lib/format";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  WORKSPACES,
  STATIC_BREADCRUMBS,
  type WorkspaceNavItem as NavItem,
} from "@/lib/workspace-config";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [institutionName, setInstitutionName] = useState("CampusFlow");
  const [userName, setUserName] = useState("Administrator");
  const [userEmail, setUserEmail] = useState("");
  const [currentUrlSearch, setCurrentUrlSearch] = useState("");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [verifiedUserRole, setVerifiedUserRole] = useState<string | null>(null);

  const isProfileRoute = pathname === "/profile" || pathname.startsWith("/profile/");

  // Determine current active workspace based on route (or verified user role on /profile)
  const currentKey = pathname.startsWith("/coordinator")
    ? "coordinator"
    : pathname.startsWith("/teacher")
      ? "teacher"
      : pathname.startsWith("/parent")
        ? "parent"
        : pathname.startsWith("/student")
          ? "student"
          : pathname.startsWith("/admin")
            ? "admin"
            : verifiedUserRole && WORKSPACES[verifiedUserRole]
              ? verifiedUserRole
              : "admin";

  const workspace = WORKSPACES[currentKey];

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isCancelled = false;

    const verifySession = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => null);

        if (isCancelled) return;

        if (!res.ok || !data?.authenticated || !data?.user?.role) {
          clearClientAuthStorage();
          setIsAuthorized(false);
          if (data?.error) {
            toast.error(data.error);
          }
          window.location.replace("/login");
          return;
        }

        const verifiedRole: string = data.user.role;
        setVerifiedUserRole(verifiedRole);

        if (!isProfileRoute) {
          const expectedRole = pathname.startsWith("/coordinator")
            ? "coordinator"
            : pathname.startsWith("/teacher")
              ? "teacher"
              : pathname.startsWith("/parent")
                ? "parent"
                : pathname.startsWith("/student")
                  ? "student"
                  : "admin";

          if (verifiedRole !== expectedRole) {
            setIsAuthorized(false);
            toast.error(
              `Unauthorized access. You do not have permission to view ${workspace.title}. Redirecting...`
            );
            const target =
              verifiedRole === "coordinator"
                ? "/coordinator"
                : verifiedRole === "teacher"
                  ? "/teacher"
                  : verifiedRole === "student"
                    ? "/student"
                    : verifiedRole === "parent"
                      ? "/parent"
                      : "/admin";
            router.replace(target);
            return;
          }
        }

        // Sync verified server session metadata
        syncClientAuthStorage({
          role: verifiedRole,
          name: data.user.name,
          email: data.user.email,
          institution: data.user.institution,
          schoolCode: data.user.schoolCode,
        });
        if (data.user.name) setUserName(data.user.name);
        if (data.user.email) setUserEmail(data.user.email);
        if (data.user.institution) setInstitutionName(data.user.institution);

        setIsAuthorized(true);
        setCurrentUrlSearch(window.location.search);
      } catch {
        if (!isCancelled) {
          setIsAuthorized(false);
          router.replace("/login");
        }
      }
    };

    verifySession();

    const handleUpdate = () => {
      const auth = readClientAuthStorage();
      if (auth.institution) setInstitutionName(auth.institution);
      if (auth.name) setUserName(auth.name);
      if (auth.email) setUserEmail(auth.email);
    };

    const handlePop = (e?: Event) => {
      const custom = e as CustomEvent<{ tab?: string }> | undefined;
      if (custom?.detail?.tab) {
        setCurrentUrlSearch(`?tab=${custom.detail.tab}`);
      } else if (typeof window !== "undefined") {
        setCurrentUrlSearch(window.location.search);
      }
    };

    window.addEventListener("campusflow_institution_updated", handleUpdate);
    window.addEventListener("popstate", handlePop);
    window.addEventListener("campusflow_tab_change", handlePop);

    return () => {
      isCancelled = true;
      window.removeEventListener("campusflow_institution_updated", handleUpdate);
      window.removeEventListener("popstate", handlePop);
      window.removeEventListener("campusflow_tab_change", handlePop);
    };
  }, [pathname, router, workspace.title]);

  const initials = getInitials(userName, "") || getInitials(institutionName, "CF");

  const currentBreadcrumbs = isProfileRoute
    ? [
      { label: "Home", href: "/" },
      { label: workspace.title, href: workspace.rootHref },
      { label: "My Profile & Account" },
    ]
    : STATIC_BREADCRUMBS[pathname] || [
      { label: "Home", href: "/" },
      { label: workspace.title },
    ];

  const handleNavItemClick = (item: NavItem) => {
    if (item.tabKey && pathname === workspace.rootHref) {
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `?tab=${item.tabKey}`);
        setCurrentUrlSearch(`?tab=${item.tabKey}`);
        window.dispatchEvent(new CustomEvent("campusflow_tab_change", { detail: { tab: item.tabKey } }));
      }
    }
  };

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // Proceed with client cleanup regardless
      }
      clearClientAuthStorage();
      window.location.href = "/login";
    }
  };

  return (
    <div className="flex min-h-screen bg-muted/20 relative">
      {/* Non-blocking Security Verification Overlay (keeps {children} mounted for Next.js 16 instant navigation) */}
      {isAuthorized !== true && (
        <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-background/95 backdrop-blur-xs">
          {isAuthorized === null ? (
            <div className="flex flex-col items-center gap-2 text-center p-6">
              <GraduationCap className="h-8 w-8 text-primary animate-pulse" />
              <p className="text-xs font-semibold text-foreground">
                Verifying workspace permissions...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5 text-center p-6">
              <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-foreground">Access Restricted</p>
              <p className="text-xs text-muted-foreground">
                Redirecting to your authorized workspace...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Workspace-Isolated Sidebar */}
      <DashboardSidebar
        workspace={workspace}
        institutionName={institutionName}
        pathname={pathname}
        currentUrlSearch={currentUrlSearch}
        onNavItemClick={handleNavItemClick}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          workspace={workspace}
          institutionName={institutionName}
          userName={userName}
          userEmail={userEmail}
          initials={initials}
          userRole={verifiedUserRole || currentKey}
          pathname={pathname}
          currentUrlSearch={currentUrlSearch}
          isProfileRoute={isProfileRoute}
          onNavItemClick={handleNavItemClick}
          onResetWorkspaceTab={() => {
            if (pathname === workspace.rootHref) {
              if (currentUrlSearch && currentUrlSearch !== `?tab=${workspace.defaultTab}`) {
                window.history.replaceState(null, "", workspace.rootHref);
                setCurrentUrlSearch("");
                window.dispatchEvent(
                  new CustomEvent("campusflow_tab_change", {
                    detail: { tab: workspace.defaultTab },
                  })
                );
                window.dispatchEvent(new Event("popstate"));
              }
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              router.push(workspace.rootHref);
            }
          }}
          onSignOut={handleSignOut}
        />

        {/* Page View Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* Static Breadcrumb Navigation Bar */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
            {currentBreadcrumbs.map((crumb, idx) => {
              const isLast = idx === currentBreadcrumbs.length - 1;
              return (
                <div key={crumb.label} className="flex items-center gap-2">
                  {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      {idx === 0 && <LayoutDashboard className="h-3.5 w-3.5" />}
                      <span>{crumb.label}</span>
                    </Link>
                  ) : (
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      {idx === 0 && <LayoutDashboard className="h-3.5 w-3.5" />}
                      <span>{crumb.label}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </nav>

          {/* SaaS 14-Day Trial / Renewal Banner & 24h Grace Lockout Guard */}
          <SubscriptionGuard
            userRole={verifiedUserRole || currentKey}
            onSignOut={handleSignOut}
          />

          {children}
        </main>
      </div>
    </div>
  );
}
