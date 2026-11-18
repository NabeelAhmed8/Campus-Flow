"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  ReceiptText,
  BrainCircuit,
  Users,
  Bell,
  Home,
  LogOut,
  ChevronRight,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Award,
  HelpCircle,
  CalendarCheck,
  Building,
  ShieldCheck,
  Menu,
  ChevronDown,
  User,
  Globe,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { SubscriptionGuard } from "@/components/subscription-guard";
import {
  CustomDropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "@/components/ui/custom-dropdown-menu";

interface NavItem {
  name: string;
  href: string;
  tabKey?: string;
  icon: any;
  badge?: string;
}

interface WorkspaceConfig {
  id: "admin" | "coordinator" | "teacher" | "student" | "parent";
  title: string;
  badge: string;
  roleLabel: string;
  description: string;
  landingDescription: string;
  defaultTab: string;
  icon: any;
  rootHref: string;
  navItems: NavItem[];
}

const WORKSPACES: Record<string, WorkspaceConfig> = {
  admin: {
    id: "admin",
    title: "Admin Hub",
    badge: "Admin Workspace",
    roleLabel: "Institutional Admin",
    description: "Campus operations, finances & student records",
    landingDescription: "CampusFlow platform features, modules & solutions",
    defaultTab: "students",
    icon: LayoutDashboard,
    rootHref: "/admin",
    navItems: [
      {
        name: "Enrolled Students Directory",
        href: "/admin?tab=students",
        tabKey: "students",
        icon: Users,
      },
      {
        name: "Fee Billing & Bank Vouchers",
        href: "/admin?tab=billing",
        tabKey: "billing",
        icon: ReceiptText,
      },
      {
        name: "Faculty & Section Assignments",
        href: "/admin?tab=faculty",
        tabKey: "faculty",
        icon: BrainCircuit,
      },
      {
        name: "Financial Analytics & Velocity",
        href: "/admin?tab=overview",
        tabKey: "overview",
        icon: LayoutDashboard,
      },
      {
        name: "Subscription & Plan",
        href: "/admin?tab=subscription",
        tabKey: "subscription",
        icon: CreditCard,
      },
    ],
  },
  coordinator: {
    id: "coordinator",
    title: "Coordinator Desk",
    badge: "Academic Coordinator",
    roleLabel: "Academic Coordinator",
    description: "Faculty attendance, substitutions, timetables & syllabus tracking",
    landingDescription: "Return to main platform & institutional showcase",
    defaultTab: "teacher-attendance",
    icon: ShieldCheck,
    rootHref: "/coordinator",
    navItems: [
      {
        name: "Faculty Attendance & Substitutions",
        href: "/coordinator?tab=teacher-attendance",
        tabKey: "teacher-attendance",
        icon: CalendarCheck,
      },
      {
        name: "Class Timetable Scheduler",
        href: "/coordinator?tab=timetable",
        tabKey: "timetable",
        icon: Clock,
      },
      {
        name: "Term Syllabus Planner",
        href: "/coordinator?tab=syllabus",
        tabKey: "syllabus",
        icon: BookOpen,
      },
      {
        name: "Exam Date Sheet & Circulars",
        href: "/coordinator?tab=notices",
        tabKey: "notices",
        icon: Bell,
      },
    ],
  },
  teacher: {
    id: "teacher",
    title: "Teacher AI Suite",
    badge: "Faculty Workspace",
    roleLabel: "Faculty Educator",
    description: "AI lesson planning, quizzes, grades & attendance",
    landingDescription: "Return to main platform & pedagogical showcase",
    defaultTab: "planner",
    icon: BrainCircuit,
    rootHref: "/teacher",
    navItems: [
      {
        name: "AI Lesson Planner",
        href: "/teacher?tab=planner",
        tabKey: "planner",
        icon: BrainCircuit,
      },
      {
        name: "Formative Quiz Maker",
        href: "/teacher?tab=quiz",
        tabKey: "quiz",
        icon: HelpCircle,
      },
      {
        name: "Student Marks & Feedback",
        href: "/teacher?tab=gradebook",
        tabKey: "gradebook",
        icon: Award,
      },
      {
        name: "Daily Attendance",
        href: "/teacher?tab=attendance",
        tabKey: "attendance",
        icon: CalendarCheck,
      },
      {
        name: "Timetable, Syllabus & Date Sheets",
        href: "/teacher?tab=schedules",
        tabKey: "schedules",
        icon: Calendar,
      },
    ],
  },
  student: {
    id: "student",
    title: "Student Portal",
    badge: "Learner Workspace",
    roleLabel: "Enrolled Student",
    description: "Daily schedules, homework tasks & AI study mentor",
    landingDescription: "Return to main platform & learning solutions",
    defaultTab: "timetable",
    icon: BookOpen,
    rootHref: "/student",
    navItems: [
      {
        name: "Today's Schedule",
        href: "/student?tab=timetable",
        tabKey: "timetable",
        icon: Clock,
      },
      {
        name: "Timetable, Syllabus & Date Sheets",
        href: "/student?tab=schedules",
        tabKey: "schedules",
        icon: Calendar,
      },
      {
        name: "Homework & Tasks",
        href: "/student?tab=assignments",
        tabKey: "assignments",
        icon: BookOpen,
      },
      {
        name: "Report Card & Grades",
        href: "/student?tab=grades",
        tabKey: "grades",
        icon: Award,
      },
      {
        name: "Gemini AI Study Coach",
        href: "/student?tab=study-ai",
        tabKey: "study-ai",
        icon: Sparkles,
      },
    ],
  },
  parent: {
    id: "parent",
    title: "Parent Portal",
    badge: "Guardian Workspace",
    roleLabel: "Registered Guardian",
    description: "Ward performance, attendance & fee billing",
    landingDescription: "Return to main platform & institution info",
    defaultTab: "overview",
    icon: Users,
    rootHref: "/parent",
    navItems: [
      {
        name: "Child Academic Standing",
        href: "/parent?tab=overview",
        tabKey: "overview",
        icon: Users,
      },
      {
        name: "Exam Results & Report Card",
        href: "/parent?tab=results",
        tabKey: "results",
        icon: Award,
      },
      {
        name: "Timetable, Syllabus & Date Sheets",
        href: "/parent?tab=schedules",
        tabKey: "schedules",
        icon: Calendar,
      },
      {
        name: "Pakistani Bank Fee Pay",
        href: "/parent?tab=fees",
        tabKey: "fees",
        icon: ReceiptText,
      },
      {
        name: "Teacher Remarks & Feedback",
        href: "/parent?tab=remarks",
        tabKey: "remarks",
        icon: Bell,
      },
      {
        name: "Absence & Leave Notice",
        href: "/parent?tab=leave",
        tabKey: "leave",
        icon: CalendarCheck,
      },
    ],
  },
};

const STATIC_BREADCRUMBS: Record<string, { label: string; href?: string }[]> = {
  "/admin": [
    { label: "Dashboard", href: "/admin" },
    { label: "Admin Hub" },
  ],
  "/coordinator": [
    { label: "Dashboard", href: "/coordinator" },
    { label: "Coordinator Desk" },
  ],
  "/teacher": [
    { label: "Dashboard", href: "/teacher" },
    { label: "Teacher AI Suite" },
  ],
  "/parent": [
    { label: "Dashboard", href: "/parent" },
    { label: "Parent Guardian Portal" },
  ],
  "/student": [
    { label: "Dashboard", href: "/student" },
    { label: "Student Learning Portal" },
  ],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [institutionName, setInstitutionName] = useState("St. Jude Collegiate Academy");
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
          localStorage.removeItem("campusflow_user_role");
          localStorage.removeItem("campusflow_user_name");
          localStorage.removeItem("campusflow_user_email");
          localStorage.removeItem("campusflow_institution");
          localStorage.removeItem("campusflow_admin_name");
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
        localStorage.setItem("campusflow_user_role", verifiedRole);
        if (data.user.name) {
          localStorage.setItem("campusflow_user_name", data.user.name);
          setUserName(data.user.name);
        }
        if (data.user.email) {
          localStorage.setItem("campusflow_user_email", data.user.email);
          setUserEmail(data.user.email);
        }
        if (data.user.institution) {
          localStorage.setItem("campusflow_institution", data.user.institution);
          setInstitutionName(data.user.institution);
        }
        if (data.user.schoolCode) {
          localStorage.setItem("campusflow_school_code", data.user.schoolCode);
        }
        window.dispatchEvent(new Event("campusflow_institution_updated"));

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
      const updated = localStorage.getItem("campusflow_institution");
      if (updated) setInstitutionName(updated);
      const name =
        localStorage.getItem("campusflow_user_name") ||
        localStorage.getItem("campusflow_admin_name");
      if (name) setUserName(name);
      const email = localStorage.getItem("campusflow_user_email");
      if (email) setUserEmail(email);
    };

    const handlePop = (e?: any) => {
      if (e && "detail" in e && e.detail?.tab) {
        setCurrentUrlSearch(`?tab=${e.detail.tab}`);
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

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    institutionName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    "CF";

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
      localStorage.removeItem("campusflow_user_role");
      localStorage.removeItem("campusflow_user_name");
      localStorage.removeItem("campusflow_user_email");
      localStorage.removeItem("campusflow_institution");
      localStorage.removeItem("campusflow_admin_name");
      localStorage.removeItem("campusflow_school_code");
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
      <aside className="w-64 border-r bg-background flex flex-col shrink-0 hidden md:flex">
        {/* Brand & Workspace Identity */}
        <div className="h-16 flex items-center justify-between px-5 border-b">
          <Link href={workspace.rootHref} className="flex items-center gap-2.5" title="Go to Workspace Dashboard">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">Campus<span className="text-primary/70 font-semibold">Flow</span></span>
              <span className="block text-[10px] text-muted-foreground -mt-1 font-medium truncate max-w-[120px]" title={institutionName}>
                {institutionName}
              </span>
            </div>
          </Link>
        </div>

        {/* Current Active Workspace Header Banner */}
        <div className="px-4 py-3 bg-muted/40 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <workspace.icon className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground tracking-tight">{workspace.title}</span>
            </div>
            <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {workspace.badge.replace(" Workspace", "")}
            </span>
          </div>
        </div>

        {/* Navigation Links — Strictly for this Workspace Only */}
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
              if (activeUrlTab) {
                isActive = activeUrlTab === item.tabKey;
              } else {
                // Default first tab active if no param
                isActive = workspace.navItems[0]?.tabKey === item.tabKey;
              }
            } else if (item.href.includes("#")) {
              isActive = false;
            } else {
              isActive = pathname === item.href;
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => handleNavItemClick(item)}
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

        {/* Dedicated Sign Out & Back Actions */}
        <div className="p-3 border-t space-y-1.5 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8.5 font-medium transition-colors"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign Out
          </Button>

          <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground h-8" asChild>
            <Link href="/">
              <Home className="mr-2 h-3.5 w-3.5" />
              Back to Home
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b bg-background flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <Link href={workspace.rootHref} className="md:hidden flex items-center gap-1.5 font-bold text-sm" title="Go to Workspace Dashboard">
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
                  <span className="truncate max-w-[100px]">{workspace.title.replace(" Workspace", "").replace(" Hub", "").replace(" AI Suite", "")}</span>
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
                          handleNavItemClick(item);
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
            <Button variant="outline" size="xs" className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground" asChild>
              <Link href="/" title="Visit public platform website">
                <Globe className="h-3.5 w-3.5" />
                <span>Public Site</span>
              </Link>
            </Button>

            {/* Live Dynamic Notification Bell */}
            <NotificationBell userRole={verifiedUserRole || currentKey} />

            {/* User Profile Dynamic Dropdown Menu */}
            <CustomDropdown>
              <DropdownTrigger className="flex items-center gap-2 pl-2 border-l cursor-pointer hover:opacity-85 transition-opacity text-left">
                <div className="relative">
                  <div className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-2xs border border-primary/20">
                    {initials}
                  </div>
                  {/* Subtle mobile dropdown indicator */}
                  <div className="sm:hidden absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground shadow-2xs">
                    <ChevronDown className="h-2 w-2" />
                  </div>
                </div>
                <div className="hidden sm:block text-left max-w-[140px] md:max-w-[170px]">
                  <div className="text-xs font-semibold leading-tight truncate text-foreground" title={userName}>
                    {userName}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight truncate">{workspace.roleLabel}</div>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block opacity-60" />
              </DropdownTrigger>

              <DropdownContent align="right" minWidth="w-[280px] sm:w-[320px] max-w-[calc(100vw-1.5rem)]">
                {/* User Identity Capsule Header */}
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

                {/* Dynamic Navigation Section */}
                <DropdownLabel className="px-2.5 pt-1 pb-1">Account &amp; Navigation</DropdownLabel>

                {/* 0. Dedicated User Profile & Security Link */}
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

                {/* 1. Dynamic Workspace Link (Active in all portals) */}
                <DropdownItem
                  icon={workspace.icon}
                  description={workspace.description}
                  active={pathname === workspace.rootHref && (!currentUrlSearch || currentUrlSearch === `?tab=${workspace.defaultTab}`)}
                  badge={
                    pathname === workspace.rootHref && (!currentUrlSearch || currentUrlSearch === `?tab=${workspace.defaultTab}`) ? (
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
                  onClick={() => {
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
                >
                  {workspace.title}
                </DropdownItem>

                {/* 2. Dynamic Landing / Public Portal Link (Tailored per portal) */}
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

                {/* Sign Out Action */}
                <DropdownItem
                  icon={LogOut}
                  destructive
                  onClick={handleSignOut}
                  description="Securely disconnect from this workspace"
                >
                  Sign Out of Session
                </DropdownItem>
              </DropdownContent>
            </CustomDropdown>
          </div>
        </header>

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
