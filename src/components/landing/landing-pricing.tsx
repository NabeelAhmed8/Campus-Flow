"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Check, ArrowRight, Clock, Bell, RefreshCw, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import type { LandingAuthState } from "./landing-navbar";

interface LandingPricingProps {
  authState: LandingAuthState;
}

export function LandingPricing({ authState }: LandingPricingProps) {
  const [pricingCurrency, setPricingCurrency] = useState<"PKR" | "USD">("PKR");

  return (
    <>
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
            {SUBSCRIPTION_PLANS.map((plan) => {
              const ctaHref =
                authState.isLoggedIn && authState.role === "admin"
                  ? "/admin?tab=subscription"
                  : "/register";
              const ctaLabel =
                authState.isLoggedIn && authState.role === "admin"
                  ? "Manage / Subscribe"
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

                    <p className="text-xs text-muted-foreground leading-relaxed">{plan.tagline}</p>

                    <div className="pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                          {pricingCurrency === "PKR"
                            ? `PKR ${plan.pricePkr.toLocaleString()}`
                            : `$${plan.priceUsd}`}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">/month</span>
                      </div>
                      <p className="text-xs text-primary font-semibold mt-1">{plan.studentLimit}</p>
                    </div>

                    <ul className="space-y-2.5 pt-4 border-t text-xs text-foreground">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug text-muted-foreground">{feat}</span>
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
          <div>Built for modern schools, academies, and educational institutions.</div>
        </div>
      </footer>
    </>
  );
}
