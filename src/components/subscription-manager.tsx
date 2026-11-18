"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  Building2,
  Smartphone,
  ReceiptText,
  X,
  Check,
  CalendarDays,
  Ban,
  RotateCcw,
  ExternalLink,
  KeyRound,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface PlanOption {
  id: "starter" | "growth" | "enterprise";
  name: string;
  tagline: string;
  pricePkr: number;
  priceUsd: number;
  studentLimit: string;
  popular?: boolean;
  features: string[];
}

export interface SubscriptionData {
  schoolName: string;
  planId: "trial" | "starter" | "growth" | "enterprise";
  planName: string;
  pricePkr: number;
  priceUsd: number;
  status: "trialing" | "active" | "grace_period" | "canceled" | "expired";
  isTrial: boolean;
  isLocked: boolean;
  isGracePeriod: boolean;
  showRenewalBanner: boolean;
  daysRemaining: number;
  hoursRemainingInGrace: number;
  trialStartsAt?: string;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd: string;
  graceEndsAt: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: {
    type: "card" | "bank" | "wallet";
    brand: string;
    last4: string;
    label: string;
  } | null;
  billingHistory: Array<{
    invoiceId: string;
    planId: string;
    planName: string;
    amountPkr: number;
    amountUsd: number;
    paymentMethod: string;
    status: "paid" | "auto_renewed";
    paidAt: string;
    periodStart: string;
    periodEnd: string;
  }>;
}

interface SubscriptionManagerProps {
  compact?: boolean;
  onSubscriptionUpdated?: (sub: SubscriptionData) => void;
}

function formatReadableDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SubscriptionManager({
  compact = false,
  onSubscriptionUpdated,
}: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [gateway, setGateway] = useState<{
    provider: string;
    configured: boolean;
    environment: "sandbox" | "production";
    webhookPath: string;
  }>({
    provider: "safepay",
    configured: false,
    environment: "sandbox",
    webhookPath: "/api/webhooks/payment",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Safepay Hosted Checkout Modal State
  const [checkoutPlan, setCheckoutPlan] = useState<PlanOption | null>(null);
  const [checkoutAutoRenew, setCheckoutAutoRenew] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Cancel Confirmation State
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const loadSubscription = useCallback(async (showToast = false) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscription", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setSubscription(data.subscription || null);
        if (Array.isArray(data.plans)) setPlans(data.plans);
        if (data.gateway) setGateway(data.gateway);
        if (showToast) toast.success("Subscription status refreshed.");
      }
    } catch {
      toast.error("Unable to load subscription details.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscription(false);

    // Handle return redirect from Safepay Hosted Checkout
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get("payment");
      const orderRef = params.get("order");
      if (paymentStatus) {
        if (paymentStatus === "success") {
          toast.success(
            `Safepay payment verified${orderRef ? ` (${orderRef})` : ""}! Your monthly subscription is now active.`
          );
          window.dispatchEvent(new Event("campusflow_subscription_updated"));
          window.dispatchEvent(new Event("campusflow_notifications_refresh"));
        } else if (paymentStatus === "pending") {
          toast.info(
            "Payment received — awaiting final Safepay webhook confirmation. Refresh shortly."
          );
        } else if (paymentStatus === "canceled") {
          toast.warning("Safepay checkout was canceled. No charges were made.");
        } else {
          toast.error("Could not verify Safepay payment. Please try again.");
        }
        params.delete("payment");
        params.delete("order");
        const cleanQuery = params.toString();
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}`
        );
      }
    }
  }, [loadSubscription]);

  const notifyGlobalSync = (updated: SubscriptionData | null) => {
    if (updated && onSubscriptionUpdated) {
      onSubscriptionUpdated(updated);
    }
    window.dispatchEvent(new Event("campusflow_subscription_updated"));
    window.dispatchEvent(new Event("campusflow_notifications_refresh"));
  };

  const handleToggleAutoRenew = async () => {
    if (!subscription) return;
    setIsUpdatingSettings(true);
    try {
      const nextValue = !subscription.autoRenew;
      const res = await fetch("/api/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_auto_renew",
          autoRenew: nextValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not update Auto-Renew.");
        return;
      }
      setSubscription(data.subscription);
      notifyGlobalSync(data.subscription);
      toast.success(data.message);
    } catch {
      toast.error("Network error while updating Auto-Renew.");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsUpdatingSettings(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not cancel subscription.");
        return;
      }
      setSubscription(data.subscription);
      setShowCancelConfirm(false);
      notifyGlobalSync(data.subscription);
      toast.success(data.message);
    } catch {
      toast.error("Network error while canceling subscription.");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsUpdatingSettings(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not resume subscription.");
        return;
      }
      setSubscription(data.subscription);
      notifyGlobalSync(data.subscription);
      toast.success(data.message);
    } catch {
      toast.error("Network error while resuming subscription.");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleSafepayCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan) return;

    setIsProcessingPayment(true);
    try {
      const res = await fetch("/api/payments/safepay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: checkoutPlan.id,
          autoRenew: checkoutAutoRenew,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        toast.error(
          data.error || "Unable to open Safepay checkout session."
        );
        return;
      }

      toast.info("Redirecting to Safepay secure checkout...");
      window.location.href = data.checkoutUrl;
    } catch {
      toast.error("Network error while connecting to Safepay.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card py-14 text-center text-xs text-muted-foreground">
        Loading institutional subscription &amp; billing status...
      </div>
    );
  }

  const totalCycleDays = subscription?.isTrial ? 14 : 30;
  const progressPercent = subscription
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round((subscription.daysRemaining / totalCycleDays) * 100)
        )
      )
    : 0;

  return (
    <div className="space-y-5">
      {/* Current Subscription Status Card (Hidden in compact lockout mode) */}
      {!compact && subscription && (
        <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    subscription.status === "active"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : subscription.status === "trialing"
                      ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30"
                      : subscription.status === "grace_period"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      : subscription.status === "canceled"
                      ? "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                  }`}
                >
                  {subscription.status === "trialing"
                    ? "14-Day Free Trial"
                    : subscription.status === "active"
                    ? "Active Monthly Plan"
                    : subscription.status === "grace_period"
                    ? "24-Hour Grace Period"
                    : subscription.status === "canceled"
                    ? "Cancels at Period End"
                    : "Subscription Expired"}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {subscription.schoolName}
                </span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {subscription.planName}
                {subscription.pricePkr > 0 && (
                  <span className="text-sm font-medium text-muted-foreground ml-2">
                    PKR {subscription.pricePkr.toLocaleString()}/mo ($
                    {subscription.priceUsd}/mo)
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                {subscription.isLocked
                  ? "Your grace period has ended. Subscribe below to immediately restore full campus access."
                  : subscription.isGracePeriod
                  ? `Grace period active: ${subscription.hoursRemainingInGrace} hours left before workspace access is paused.`
                  : subscription.isTrial
                  ? `Full access active through ${formatReadableDate(
                      subscription.currentPeriodEnd
                    )}. Automatic reminders are sent 3 days before expiry.`
                  : subscription.cancelAtPeriodEnd
                  ? `Your plan is scheduled to cancel on ${formatReadableDate(
                      subscription.currentPeriodEnd
                    )}. Resume anytime before that date.`
                  : `Next billing date: ${formatReadableDate(
                      subscription.currentPeriodEnd
                    )} • Automatic email & admin bell alerts 3 days before renewal.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadSubscription(true)}
                className="h-9 text-xs"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Remaining Days Progress + Auto-Renew & Cancel Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Cycle Progress Box */}
            <div className="lg:col-span-6 rounded-xl border bg-muted/20 p-4 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {subscription.isTrial
                    ? "14-Day Free Trial Countdown"
                    : "Current Monthly Billing Cycle"}
                </span>
                <span className="font-bold text-primary">
                  {subscription.isGracePeriod
                    ? `${subscription.hoursRemainingInGrace}h Grace Left`
                    : subscription.isLocked
                    ? "Expired"
                    : `${subscription.daysRemaining} ${
                        subscription.daysRemaining === 1 ? "Day" : "Days"
                      } Left`}
                </span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    subscription.isLocked || subscription.isGracePeriod
                      ? "bg-rose-500"
                      : subscription.daysRemaining <= 3
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Ends: {formatReadableDate(subscription.currentPeriodEnd)}
                </span>
                <span>
                  Payment:{" "}
                  <strong className="text-foreground">
                    {subscription.paymentMethod?.label || "Not Added Yet"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Auto-Renew & Cancel Anytime Controls */}
            <div className="lg:col-span-6 rounded-xl border bg-muted/20 p-4 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">
                    Automatic Monthly Renewal (Auto-Renew)
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {subscription.autoRenew
                      ? "Enabled — automatically renews every 30 days with 3-day advance email & bell alert."
                      : "Disabled — you will need to manually renew before expiry to prevent lockout."}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={subscription.autoRenew}
                  aria-label="Toggle automatic monthly renewal"
                  disabled={isUpdatingSettings || subscription.isLocked}
                  onClick={handleToggleAutoRenew}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 ${
                    subscription.autoRenew ? "bg-emerald-600" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-150 ${
                      subscription.autoRenew ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dashed">
                <span className="text-[11px] text-muted-foreground">
                  No lock-in contracts • Cancel anytime
                </span>

                {subscription.cancelAtPeriodEnd ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={isUpdatingSettings}
                    onClick={handleResumeSubscription}
                    className="h-7.5 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Resume Subscription
                  </Button>
                ) : (
                  !subscription.isLocked && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      disabled={isUpdatingSettings}
                      onClick={() => setShowCancelConfirm(true)}
                      className="h-7.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Ban className="mr-1 h-3 w-3" />
                      Cancel Anytime
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Plans Grid */}
      <div className="space-y-3">
        {!compact && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Choose a Monthly CampusFlow Plan
              </h3>
              <p className="text-xs text-muted-foreground">
                Instant activation • Cancel anytime • 3-day advance email &amp; dashboard renewal alerts
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent =
              subscription?.planId === plan.id &&
              subscription.status === "active";

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all ${
                  plan.popular
                    ? "border-primary bg-primary/[0.03] shadow-sm ring-1 ring-primary/20"
                    : "bg-card shadow-2xs"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-base text-foreground">
                      {plan.name}
                    </h4>
                    {plan.popular && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                        Most Popular
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">{plan.tagline}</p>

                  <div className="pt-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold tracking-tight text-foreground">
                        PKR {plan.pricePkr.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">/month</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      ${plan.priceUsd} USD/mo • {plan.studentLimit}
                    </p>
                  </div>

                  <ul className="space-y-2 pt-2 border-t text-xs text-foreground">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  type="button"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => {
                    setCheckoutPlan(plan);
                    setCheckoutAutoRenew(true);
                  }}
                  className="w-full h-9 text-xs font-semibold"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {isCurrent
                    ? "Renew / Extend Plan"
                    : subscription?.isTrial || subscription?.isLocked
                    ? `Subscribe to ${plan.name}`
                    : `Switch to ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing & Invoice History (Hidden in compact lockout mode) */}
      {!compact && subscription && (
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2 pb-2 border-b text-foreground">
            <ReceiptText className="h-4 w-4 text-primary" />
            Subscription Billing &amp; Invoice History (
            {subscription.billingHistory.length})
          </h3>

          {subscription.billingHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center rounded-xl border border-dashed">
              No paid invoices yet — your institution is currently on the 14-day free trial.
            </p>
          ) : (
            <div className="space-y-2">
              {subscription.billingHistory.map((inv) => (
                <div
                  key={inv.invoiceId}
                  className="rounded-xl border bg-muted/15 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-foreground">
                        {inv.invoiceId}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase">
                        {inv.status === "auto_renewed" ? "Auto-Renewed" : "Paid"}
                      </span>
                      <span className="font-semibold text-primary">
                        {inv.planName}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {inv.paymentMethod} • Cycle:{" "}
                      {formatReadableDate(inv.periodStart)} –{" "}
                      {formatReadableDate(inv.periodEnd)}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <p className="font-bold text-foreground">
                      PKR {inv.amountPkr.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Paid {formatReadableDate(inv.paidAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Safepay Hosted Checkout Modal */}
      {checkoutPlan && (
        <div
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setCheckoutPlan(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Subscribe to ${checkoutPlan.name} via Safepay`}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                    <Lock className="h-3 w-3" />
                    Safepay Pakistan Gateway
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                    {gateway.configured
                      ? gateway.environment === "production"
                        ? "Live"
                        : "Sandbox"
                      : "Setup Required"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Activate {checkoutPlan.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PKR {checkoutPlan.pricePkr.toLocaleString()}/month ($
                  {checkoutPlan.priceUsd} USD) • Instant Webhook Activation
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCheckoutPlan(null)}
                className="h-8 w-8 p-0"
                aria-label="Close checkout"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Supported Safepay Channels */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border bg-muted/20 p-2.5 space-y-1">
                <CreditCard className="h-4 w-4 mx-auto text-primary" />
                <p className="text-[11px] font-semibold text-foreground">
                  Visa / Mastercard
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Pakistani Cards
                </p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-2.5 space-y-1">
                <Building2 className="h-4 w-4 mx-auto text-primary" />
                <p className="text-[11px] font-semibold text-foreground">
                  Bank / Raast
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Direct Settlement
                </p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-2.5 space-y-1">
                <Smartphone className="h-4 w-4 mx-auto text-primary" />
                <p className="text-[11px] font-semibold text-foreground">
                  Mobile Wallets
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Instant Verify
                </p>
              </div>
            </div>

            {!gateway.configured ? (
              <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">
                      Connect Your Safepay Merchant Account to Accept Real Payments
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Create a merchant account at{" "}
                      <a
                        href="https://getsafepay.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary underline"
                      >
                        getsafepay.com
                      </a>
                      , link your Pakistani Bank Account for payouts, and add these keys to{" "}
                      <code className="font-mono px-1 py-0.5 rounded bg-background border">
                        campus-flow/.env.local
                      </code>
                      :
                    </p>
                  </div>
                </div>
                <pre className="rounded-lg border bg-background p-2.5 font-mono text-[10px] text-foreground overflow-x-auto leading-relaxed">
{`NEXT_PUBLIC_APP_URL=https://your-domain.com
SAFEPAY_ENV=production
SAFEPAY_API_KEY=sec_your_production_api_key
SAFEPAY_V1_SECRET=your_production_v1_secret
SAFEPAY_WEBHOOK_SECRET=your_production_webhook_secret`}
                </pre>
                <p className="text-[11px] text-muted-foreground">
                  Set Webhook URL in Safepay Dashboard to:{" "}
                  <code className="font-mono text-foreground font-semibold">
                    {gateway.webhookPath}
                  </code>
                </p>
              </div>
            ) : null}

            <form onSubmit={handleSafepayCheckout} className="space-y-3 text-xs">
              {/* Auto-Renew Checkbox */}
              <label
                htmlFor="sub-auto-renew-check"
                className="flex items-start gap-2.5 rounded-xl border bg-muted/20 p-3 cursor-pointer"
              >
                <input
                  id="sub-auto-renew-check"
                  name="autoRenew"
                  type="checkbox"
                  checked={checkoutAutoRenew}
                  onChange={(e) => setCheckoutAutoRenew(e.target.checked)}
                  className="mt-0.5 rounded border-border accent-primary"
                />
                <span className="text-[11px] leading-snug text-muted-foreground">
                  <strong className="text-foreground block">
                    Enable Auto-Renew Preference (Cancel Anytime)
                  </strong>
                  You will receive an email &amp; Admin Hub notification 3 days before every monthly billing cycle ends.
                </span>
              </label>

              <div className="rounded-xl border border-dashed bg-muted/15 p-3 text-[11px] text-muted-foreground leading-relaxed">
                You will be securely redirected to{" "}
                <strong className="text-foreground">Safepay Hosted Checkout</strong>{" "}
                to complete payment. As soon as Safepay confirms your payment via signed webhook, your 30-day plan activates automatically and funds settle directly into the merchant&apos;s linked Pakistani bank account.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCheckoutPlan(null)}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isProcessingPayment || !gateway.configured}
                  className="h-9 text-xs px-5"
                >
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  {isProcessingPayment
                    ? "Opening Safepay..."
                    : `Pay PKR ${checkoutPlan.pricePkr.toLocaleString()} via Safepay`}
                  <ExternalLink className="ml-1.5 h-3 w-3" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Anytime Confirmation Modal */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowCancelConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cancel Subscription"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Cancel Subscription?
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Auto-Renew will be turned off immediately. Your institution will keep full access until{" "}
                  <strong className="text-foreground">
                    {formatReadableDate(subscription?.currentPeriodEnd)}
                  </strong>
                  , and you can resume anytime before then.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCancelConfirm(false)}
                className="h-8.5 text-xs"
              >
                Keep My Plan
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isUpdatingSettings}
                onClick={handleCancelSubscription}
                className="h-8.5 text-xs"
              >
                {isUpdatingSettings ? "Canceling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
