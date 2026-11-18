"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  ReceiptText,
  BrainCircuit,
  Users,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Clock,
  Layers,
  ChevronRight,
  Menu,
  LayoutDashboard,
  LogOut,
  User,
  CreditCard,
  Check,
  Bell,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CustomDropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "@/components/ui/custom-dropdown-menu";

export default function Home() {
  const [pricingCurrency, setPricingCurrency] = useState<"PKR" | "USD">("PKR");
  const [authState, setAuthState] = useState<{
    isLoggedIn: boolean;
    role: "admin" | "coordinator" | "teacher" | "student" | "parent" | null;
    userName: string;
    dashboardHref: string;
    roleLabel: string;
  }>({
    isLoggedIn: false,
    role: null,
    userName: "",
    dashboardHref: "/login",
    roleLabel: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isCancelled = false;
    const syncAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (isCancelled) return;

        if (res.ok && data?.authenticated && data?.user?.role) {
          const role = data.user.role as "admin" | "coordinator" | "teacher" | "student" | "parent";
          const roleLabels: Record<string, string> = {
            admin: "Admin Hub",
            coordinator: "Coordinator Desk",
            teacher: "Teacher AI Suite",
            student: "Student Portal",
            parent: "Parent Portal",
          };
          setAuthState({
            isLoggedIn: true,
            role,
            userName: data.user.name || "User",
            dashboardHref: `/${role}`,
            roleLabel: roleLabels[role] || "Dashboard",
          });
        } else {
          localStorage.removeItem("campusflow_user_role");
          localStorage.removeItem("campusflow_user_name");
          localStorage.removeItem("campusflow_user_email");
          localStorage.removeItem("campusflow_institution");
          localStorage.removeItem("campusflow_admin_name");
        }
      } catch {
        // Leave logged-out state on network error
      }
    };

    syncAuth();
    return () => {
      isCancelled = true;
    };
  }, []);

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
      setAuthState({
        isLoggedIn: false,
        role: null,
        userName: "",
        dashboardHref: "/login",
        roleLabel: "",
      });
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span>Campus<span className="text-primary/70 font-semibold">Flow</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#modules" className="hover:text-foreground transition-colors">Core Modules</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>

          {/* Industry Standard Action Area (Top-Right) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {authState.isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                  Sign Out
                </Button>

                {/* Primary Industry-Standard Dashboard Button */}
                <Button size="sm" asChild className="shadow-xs font-semibold gap-1.5 px-3 sm:px-4">
                  <Link href={authState.dashboardHref}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-0.5 opacity-80" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="shadow-xs font-semibold">
                  <Link href="/register">
                    Get Started <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile Navigation Dropdown Menu */}
            <div className="md:hidden">
              <CustomDropdown>
                <DropdownTrigger className="p-2 rounded-lg border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors flex items-center justify-center" aria-label="Toggle Navigation Menu">
                  <Menu className="h-4 w-4" />
                </DropdownTrigger>
                <DropdownContent align="right" minWidth="min-w-[210px]">
                  {authState.isLoggedIn ? (
                    <>
                      <div className="px-2.5 py-2 border-b border-border/60 bg-muted/40 rounded-lg mb-1">
                        <div className="text-xs font-bold text-foreground truncate">{authState.userName}</div>
                        <div className="text-[10px] text-primary font-medium flex items-center gap-1 mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {authState.roleLabel} (Active)
                        </div>
                      </div>

                      {/* Primary Mobile Dashboard Action */}
                      <DropdownItem
                        icon={LayoutDashboard}
                        active
                        description={`Go directly to ${authState.roleLabel}`}
                        onClick={() => {
                          window.location.href = authState.dashboardHref;
                        }}
                      >
                        Go to Dashboard
                      </DropdownItem>

                      <DropdownItem
                        icon={Users}
                        description="View account details & password security"
                        onClick={() => {
                          window.location.href = "/profile";
                        }}
                      >
                        My Profile &amp; Account
                      </DropdownItem>

                      <DropdownSeparator />

                      <DropdownItem
                        icon={Sparkles}
                        onClick={() => {
                          const el = document.getElementById("features");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Features
                      </DropdownItem>
                      <DropdownItem
                        icon={Layers}
                        onClick={() => {
                          const el = document.getElementById("modules");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Core Modules
                      </DropdownItem>
                      <DropdownItem
                        icon={CreditCard}
                        onClick={() => {
                          const el = document.getElementById("pricing");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Pricing
                      </DropdownItem>

                      <DropdownSeparator />

                      <DropdownItem
                        icon={LogOut}
                        destructive
                        onClick={handleSignOut}
                        description="Disconnect session from this browser"
                      >
                        Sign Out
                      </DropdownItem>
                    </>
                  ) : (
                    <>
                      <DropdownLabel>Explore CampusFlow</DropdownLabel>
                      <DropdownItem
                        icon={Sparkles}
                        onClick={() => {
                          const el = document.getElementById("features");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Features
                      </DropdownItem>
                      <DropdownItem
                        icon={Layers}
                        onClick={() => {
                          const el = document.getElementById("modules");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Core Modules
                      </DropdownItem>
                      <DropdownItem
                        icon={CreditCard}
                        onClick={() => {
                          const el = document.getElementById("pricing");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Pricing
                      </DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem
                        icon={ArrowRight}
                        onClick={() => {
                          window.location.href = "/register";
                        }}
                      >
                        Get Started Free
                      </DropdownItem>
                      <DropdownItem
                        icon={User}
                        onClick={() => {
                          window.location.href = "/login";
                        }}
                      >
                        Sign In
                      </DropdownItem>
                    </>
                  )}
                </DropdownContent>
              </CustomDropdown>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 border-b">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Next-Gen Campus SaaS • Gemini AI & Automated Financials</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              The Modern OS for <span className="underline decoration-primary/40 underline-offset-8">Educational Excellence</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Automate micro-billing, empower teachers with instant Gemini AI lesson generation, and keep parents effortlessly synchronized in one lightning-fast platform.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {authState.isLoggedIn ? (
                <>
                  <Button size="lg" className="h-11 px-7 shadow-sm gap-2 font-semibold" asChild>
                    <Link href={authState.dashboardHref}>
                      <LayoutDashboard className="h-4 w-4" />
                      Go to {authState.roleLabel} <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-11 px-7" asChild>
                    <a href="#features">Explore Platform Features</a>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" className="h-11 px-7 shadow-sm" asChild>
                    <Link href="/register">
                      Get Started Free <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-11 px-7" asChild>
                    <Link href="/login">Sign In to Dashboard</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full pt-10 border-t mt-8">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold tracking-tight">99.4%</span>
                <span className="text-xs text-muted-foreground mt-0.5">Billing Recovery</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold tracking-tight">10x</span>
                <span className="text-xs text-muted-foreground mt-0.5">Faster Lesson Prep</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold tracking-tight">&lt; 50ms</span>
                <span className="text-xs text-muted-foreground mt-0.5">Realtime Sync</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold tracking-tight">100%</span>
                <span className="text-xs text-muted-foreground mt-0.5">Institutional Privacy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-b">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capabilities</h2>
            <h3 className="text-3xl font-bold tracking-tight">Built for Maximum Operational Velocity</h3>
            <p className="text-sm text-muted-foreground">
              Powerful tools purpose-built to eliminate paperwork, streamline revenue, and elevate academic rigor.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <ReceiptText className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Automated Micro-Billing</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate monthly tuition invoices automatically with status tracking for paid, pending, and overdue accounts.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Instant PDF Vouchers</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                One-click professional student fee vouchers generated in real-time with Pakistani local bank payment details.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Excel Ledger Exports</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Export complete student fee ledgers and institutional billing data into Microsoft Excel spreadsheets in seconds.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Gemini AI Lesson Generator</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Produce structured pedagogical frameworks, time breakdowns, and formative quizzes in seconds with Google Gemini.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Visual Revenue Analytics</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Interactive Recharts financial dashboards tracking collection velocity, targets, and monthly institutional influx.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Institutional Portals & Sync</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dedicated high-performance environments tailored for Administrators, Teachers, and Guardians.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core 3 Pillars */}
      <section id="modules" className="py-20 bg-muted/20 border-b">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Architectural Pillars</h2>
            <h3 className="text-3xl font-bold tracking-tight">Engineered for Complete Institutional Control</h3>
            <p className="text-sm text-muted-foreground">Everything your administration, educators, and guardians need in one place.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="rounded-2xl border bg-card p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <h4 className="text-xl font-semibold tracking-tight">Admin & Micro-Billing Hub</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Automate admission records, generate fee structures, track dues, and export PDF vouchers (`jspdf`) or Excel sheets (`xlsx`) with live financial charts.
                </p>
                <ul className="text-xs space-y-2 text-muted-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>One-click PDF fee voucher generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Realtime Excel revenue reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Recharts fee analytics & dues radar</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                  <Link href="/register">
                    <span>Get Started</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border bg-card p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <h4 className="text-xl font-semibold tracking-tight">AI Pedagogy Suite</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Direct integration with Google Gemini API (`@google/genai`) to produce curriculum-aligned lesson plans, quiz prompts, and instant formative grading rubrics.
                </p>
                <ul className="text-xs space-y-2 text-muted-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span>Instant structured lesson planning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span>Automated homework & quiz creation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary shrink-0" />
                    <span>Objective-based formative feedback</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                  <Link href="/register">
                    <span>Explore Suite</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border bg-card p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="text-xl font-semibold tracking-tight">Parent & Student Synchronicity</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Role-based access control protecting Admin, Teacher, and Parent accounts, with direct Pakistani local bank fee payments and academic progress telemetry.
                </p>
                <ul className="text-xs space-y-2 text-muted-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Strict role-gated dashboard security</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Dedicated parent transparency portal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Instant local bank payment verification</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                  <Link href="/register">
                    <span>Register Institution</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SaaS Pricing Section */}
      <section id="pricing" className="py-20 border-b bg-background scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              14-Day Free Trial Included • Cancel Anytime
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Simple, Transparent Monthly Pricing
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Start free for 14 days with full access to all 5 portals. Upgrade seamlessly with Pakistani Bank / Raast, JazzCash, EasyPaisa, or Debit/Credit Card.
            </p>

            {/* Currency Switcher */}
            <div className="inline-flex items-center rounded-xl border bg-muted/40 p-1 mt-2">
              <button
                type="button"
                onClick={() => setPricingCurrency("PKR")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pricingCurrency === "PKR"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                PKR (Pakistan)
              </button>
              <button
                type="button"
                onClick={() => setPricingCurrency("USD")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pricingCurrency === "USD"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                USD (Global)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                id: "starter",
                name: "Starter Campus",
                tagline: "Ideal for growing primary & middle schools",
                pricePkr: 4900,
                priceUsd: 19,
                limit: "Up to 250 Students",
                popular: false,
                features: [
                  "All 5 Portals (Admin, Coordinator, Teacher, Student, Parent)",
                  "3-Term Exam Report Cards & Section RBAC",
                  "PDF & Image Timetable, Syllabus & Date Sheet Uploads",
                  "Pakistani Bank, Raast & Mobile Wallet Fee Vouchers",
                  "Real-Time Campus Notification Bell",
                ],
              },
              {
                id: "growth",
                name: "Growth Academy",
                tagline: "Complete AI-powered suite for high schools & colleges",
                pricePkr: 9900,
                priceUsd: 39,
                limit: "Up to 1,000 Students",
                popular: true,
                features: [
                  "Everything in Starter Campus",
                  "Gemini AI Lesson Planner, Quiz Maker & Study Coach",
                  "Academic Coordinator Attendance & Substitution Desk",
                  "Automated 3-Day Advance Email & Admin Bell Renewal Alerts",
                  "Flexible Auto-Renew Toggle & Cancel Anytime",
                ],
              },
              {
                id: "enterprise",
                name: "Enterprise Network",
                tagline: "Unlimited capacity for multi-section school networks",
                pricePkr: 19900,
                priceUsd: 79,
                limit: "Unlimited Students & Sections",
                popular: false,
                features: [
                  "Everything in Growth Academy",
                  "Unlimited Faculty, Coordinators & Enrolled Students",
                  "Complete Financial Analytics & Admin Oversight Audit",
                  "Dedicated Onboarding & Priority Institution Support",
                  "Custom School Join Code & Multi-Child Parent Linking",
                ],
              },
            ].map((plan) => {
              const ctaHref =
                authState.isLoggedIn && authState.role === "admin"
                  ? "/admin?tab=subscription"
                  : "/register";
              const ctaLabel =
                authState.isLoggedIn && authState.role === "admin"
                  ? `Manage / Subscribe`
                  : "Start 14-Day Free Trial";

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all ${
                    plan.popular
                      ? "border-primary bg-primary/[0.03] shadow-md ring-1 ring-primary/20"
                      : "bg-card shadow-xs hover:shadow-md"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-foreground">
                        {plan.name}
                      </h3>
                      {plan.popular && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                          Most Popular
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {plan.tagline}
                    </p>

                    <div className="pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                          {pricingCurrency === "PKR"
                            ? `PKR ${plan.pricePkr.toLocaleString()}`
                            : `$${plan.priceUsd}`}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          /month
                        </span>
                      </div>
                      <p className="text-xs text-primary font-semibold mt-1">
                        {plan.limit}
                      </p>
                    </div>

                    <ul className="space-y-2.5 pt-4 border-t text-xs text-foreground">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug text-muted-foreground">
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    size="default"
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full font-semibold"
                    asChild
                  >
                    <Link href={ctaHref}>
                      <span>{ctaLabel}</span>
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* SaaS Subscription Guarantees Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto mt-10 text-xs">
            <div className="rounded-xl border bg-muted/20 px-4 py-3 flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">
                <strong className="text-foreground">14-Day Free Trial</strong> + 24h grace period
              </span>
            </div>
            <div className="rounded-xl border bg-muted/20 px-4 py-3 flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">
                <strong className="text-foreground">3-Day Advance Alerts</strong> via Email &amp; Admin Bell
              </span>
            </div>
            <div className="rounded-xl border bg-muted/20 px-4 py-3 flex items-center gap-2.5">
              <RefreshCw className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">
                <strong className="text-foreground">Auto-Renew</strong> &amp; Cancel Anytime control
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Production Final CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border bg-gradient-to-b from-muted/50 to-muted/20 p-8 sm:p-14 text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-primary/10 text-primary px-3.5 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Modernize Your Campus Today
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Experience Next-Generation School Management
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Streamline fee collection with Pakistani local banks, empower teachers with Gemini AI, and give parents complete transparency on one platform.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button size="lg" className="h-11 px-7 shadow-xs" asChild>
                <Link href="/register">Register Your Institution</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-11 px-7" asChild>
                <Link href="/login">Sign In to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background mt-auto">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>CampusFlow</span>
            <span className="font-normal text-muted-foreground">• Next.js 16 Educational SaaS</span>
          </div>
          <div>
            Built for modern schools, academies, and educational institutions.
          </div>
        </div>
      </footer>
    </div>
  );
}
