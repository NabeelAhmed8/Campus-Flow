"use client";

import Link from "next/link";
import {
  ReceiptText,
  ShieldCheck,
  FileSpreadsheet,
  BrainCircuit,
  TrendingUp,
  Users,
  Sparkles,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CAPABILITIES = [
  {
    icon: ReceiptText,
    iconBoxClass: "bg-primary/10 text-primary",
    title: "Automated Micro-Billing",
    description:
      "Generate monthly tuition invoices automatically with status tracking for paid, pending, and overdue accounts.",
  },
  {
    icon: ShieldCheck,
    iconBoxClass: "bg-emerald-500/10 text-emerald-600",
    title: "Instant PDF Vouchers",
    description:
      "One-click professional student fee vouchers generated in real-time with Pakistani local bank payment details.",
  },
  {
    icon: FileSpreadsheet,
    iconBoxClass: "bg-sky-500/10 text-sky-600",
    title: "Excel Ledger Exports",
    description:
      "Export complete student fee ledgers and institutional billing data into Microsoft Excel spreadsheets in seconds.",
  },
  {
    icon: BrainCircuit,
    iconBoxClass: "bg-primary/10 text-primary",
    title: "Gemini AI Lesson Generator",
    description:
      "Produce structured pedagogical frameworks, time breakdowns, and formative quizzes in seconds with Google Gemini.",
  },
  {
    icon: TrendingUp,
    iconBoxClass: "bg-amber-500/10 text-amber-600",
    title: "Visual Revenue Analytics",
    description:
      "Interactive Recharts financial dashboards tracking collection velocity, targets, and monthly institutional influx.",
  },
  {
    icon: Users,
    iconBoxClass: "bg-rose-500/10 text-rose-600",
    title: "Institutional Portals & Sync",
    description:
      "Dedicated high-performance environments tailored for Administrators, Teachers, and Guardians.",
  },
];

const CORE_PILLARS = [
  {
    icon: ReceiptText,
    title: "Admin & Micro-Billing Hub",
    description:
      "Automate admission records, generate fee structures, track dues, and export PDF vouchers or Excel sheets with live financial charts.",
    bullets: [
      { icon: ShieldCheck, color: "text-emerald-600", text: "One-click PDF fee voucher generation" },
      { icon: FileSpreadsheet, color: "text-emerald-600", text: "Realtime Excel revenue reports" },
      { icon: TrendingUp, color: "text-emerald-600", text: "Recharts fee analytics & dues radar" },
    ],
    ctaLabel: "Get Started",
  },
  {
    icon: BrainCircuit,
    title: "AI Pedagogy Suite",
    description:
      "Direct integration with Google Gemini AI to produce curriculum-aligned lesson plans, quiz prompts, and instant formative grading rubrics.",
    bullets: [
      { icon: Sparkles, color: "text-primary", text: "Instant structured lesson planning" },
      { icon: Clock, color: "text-primary", text: "Automated homework & quiz creation" },
      { icon: Layers, color: "text-primary", text: "Objective-based formative feedback" },
    ],
    ctaLabel: "Explore Suite",
  },
  {
    icon: Users,
    title: "Parent & Student Synchronicity",
    description:
      "Role-based access control protecting Admin, Teacher, and Parent accounts, with direct Pakistani local bank fee payments and academic progress telemetry.",
    bullets: [
      { icon: ShieldCheck, color: "text-sky-600", text: "Strict role-gated dashboard security" },
      { icon: Users, color: "text-sky-600", text: "Dedicated parent transparency portal" },
      { icon: Sparkles, color: "text-sky-600", text: "Instant local bank payment verification" },
    ],
    ctaLabel: "Register Institution",
  },
];

export function LandingFeatures() {
  return (
    <>
      {/* Features Section */}
      <section id="features" className="py-20 border-b">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Capabilities
            </h2>
            <h3 className="text-3xl font-bold tracking-tight">
              Built for Maximum Operational Velocity
            </h3>
            <p className="text-sm text-muted-foreground">
              Powerful tools purpose-built to eliminate paperwork, streamline revenue, and elevate academic rigor.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="rounded-2xl border bg-card p-6 shadow-xs space-y-3 hover:shadow-md transition-shadow"
                >
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${cap.iconBoxClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-base">{cap.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cap.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core 3 Pillars */}
      <section id="modules" className="py-20 bg-muted/20 border-b">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Architectural Pillars
            </h2>
            <h3 className="text-3xl font-bold tracking-tight">
              Engineered for Complete Institutional Control
            </h3>
            <p className="text-sm text-muted-foreground">
              Everything your administration, educators, and guardians need in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {CORE_PILLARS.map((pillar) => {
              const PillarIcon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border bg-card p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-4">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <PillarIcon className="h-5 w-5" />
                    </div>
                    <h4 className="text-xl font-semibold tracking-tight">{pillar.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pillar.description}
                    </p>
                    <ul className="text-xs space-y-2 text-muted-foreground pt-2">
                      {pillar.bullets.map((b) => {
                        const BulletIcon = b.icon;
                        return (
                          <li key={b.text} className="flex items-center gap-2">
                            <BulletIcon className={`h-4 w-4 ${b.color} shrink-0`} />
                            <span>{b.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div className="pt-6">
                    <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                      <Link href="/register">
                        <span>{pillar.ctaLabel}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
