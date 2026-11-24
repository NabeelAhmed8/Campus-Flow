"use client";

import Link from "next/link";
import { Sparkles, LayoutDashboard, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LandingAuthState } from "./landing-navbar";

interface LandingHeroProps {
  authState: LandingAuthState;
}

const HERO_METRICS = [
  { value: "5 Portals", label: "Role-Isolated Workspaces" },
  { value: "AI Lesson", label: "Live AI Pedagogy & Study" },
  { value: "PKR & USD", label: "Global & Pakistan Cards Ready" },
  { value: "14-Day Free", label: "Full-Access Trial" },
];

export function LandingHero({ authState }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 border-b">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Next-Gen Campus SaaS • Gemini AI & Automated Financials</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            The Modern OS for{" "}
            <span className="underline decoration-primary/40 underline-offset-8">
              Educational Excellence
            </span>
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full pt-10 border-t mt-8">
            {HERO_METRICS.map((metric) => (
              <div key={metric.label} className="flex flex-col items-center">
                <span className="text-2xl font-bold tracking-tight">{metric.value}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
