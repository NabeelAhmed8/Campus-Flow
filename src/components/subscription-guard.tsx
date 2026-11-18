"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Lock,
  Sparkles,
  LogOut,
  RefreshCw,
  Clock,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SubscriptionData,
  SubscriptionManager,
} from "@/components/subscription-manager";

interface SubscriptionGuardProps {
  userRole: string | null;
  onSignOut: () => void;
}

export function SubscriptionGuard({
  userRole,
  onSignOut,
}: SubscriptionGuardProps) {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [checking, setChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/subscription", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setSubscription(data.subscription || null);
    } catch {
      // Ignore transient network hiccup
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const handleSync = () => checkStatus();
    window.addEventListener("campusflow_subscription_updated", handleSync);
    return () =>
      window.removeEventListener("campusflow_subscription_updated", handleSync);
  }, [checkStatus]);

  if (!subscription) return null;

  const goToSubscriptionTab = () => {
    window.history.replaceState(null, "", "/admin?tab=subscription");
    window.dispatchEvent(
      new CustomEvent("campusflow_tab_change", {
        detail: { tab: "subscription", tabKey: "subscription" },
      })
    );
    router.push("/admin?tab=subscription");
  };

  return (
    <>
      {/* 1. Proactive Renewal / 24-Hour Grace Banner for School Admin */}
      {userRole === "admin" &&
        !subscription.isLocked &&
        subscription.showRenewalBanner && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs ${
              subscription.isGracePeriod
                ? "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200"
                : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              {subscription.isGracePeriod ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5 sm:mt-0" />
              ) : (
                <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0" />
              )}
              <div className="min-w-0">
                <p className="font-bold leading-snug">
                  {subscription.isGracePeriod
                    ? `24-Hour Grace Period Active — Only ${subscription.hoursRemainingInGrace}h Remaining`
                    : subscription.isTrial
                    ? `Your 14-Day Free Trial Ends in ${subscription.daysRemaining} ${
                        subscription.daysRemaining === 1 ? "Day" : "Days"
                      }`
                    : `Monthly Subscription Renewal Due in ${subscription.daysRemaining} ${
                        subscription.daysRemaining === 1 ? "Day" : "Days"
                      }`}
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {subscription.isGracePeriod
                    ? "Complete your subscription payment before the grace window closes to avoid workspace suspension."
                    : "A renewal reminder has also been sent to your email and Admin notification panel. Subscribe or verify Auto-Renew anytime."}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={goToSubscriptionTab}
              className="h-8 text-xs shrink-0 self-start sm:self-center"
            >
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              {subscription.isTrial ? "Subscribe Now" : "Renew Plan"}
            </Button>
          </div>
        )}

      {/* 2. Non-Dismissible English Workspace Lockout Popup (After Trial/Plan + 24h Grace Expires) */}
      {subscription.isLocked && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Subscription Required to Continue"
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-5 sm:p-7 space-y-6 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b">
              <div className="flex items-start gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center justify-center shrink-0">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25">
                    Workspace Paused • Action Required
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    {subscription.isTrial
                      ? "Your 14-Day Free Trial Has Ended"
                      : "Your CampusFlow Subscription Has Expired"}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                    {userRole === "admin"
                      ? "Your 24-hour grace period has elapsed without an active payment. Please subscribe or renew your monthly plan below to continue managing your institution with zero data loss."
                      : `Workspace access for ${subscription.schoolName} is temporarily paused because the institutional subscription has expired. Please contact your School Administrator to renew the plan and restore access.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={checkStatus}
                  disabled={checking}
                  className="h-8.5 text-xs"
                >
                  <RefreshCw
                    className={`mr-1.5 h-3.5 w-3.5 ${
                      checking ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onSignOut}
                  className="h-8.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </div>
            </div>

            {userRole === "admin" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span>
                    Select a monthly plan below to instantly unlock all 5 portals for your school (Cancel Anytime):
                  </span>
                </div>
                <SubscriptionManager
                  compact
                  onSubscriptionUpdated={(updated) => setSubscription(updated)}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  All student records, exam results, timetables, and attendance data are safely preserved.
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Once your School Administrator renews the CampusFlow subscription, click <strong>Refresh</strong> above to immediately resume your workspace.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
