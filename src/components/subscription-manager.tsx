"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatReadableDate } from "@/lib/format";
import {
  GatewayStatusInfo,
  PlanOption,
  SubscriptionData,
} from "./subscription/types";
import { SubscriptionStatusCard } from "./subscription/subscription-status-card";
import { SafepayCheckoutModal } from "./subscription/safepay-checkout-modal";
import { BillingHistoryCard } from "./subscription/billing-history-card";

export type { PlanOption, SubscriptionData };

interface SubscriptionManagerProps {
  compact?: boolean;
  onSubscriptionUpdated?: (sub: SubscriptionData) => void;
}

export function SubscriptionManager({
  compact = false,
  onSubscriptionUpdated,
}: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [gateway, setGateway] = useState<GatewayStatusInfo>({
    provider: "safepay",
    configured: false,
    environment: "production",
    webhookPath: "/api/webhooks/payment",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanOption | null>(null);
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

  const syncGlobalState = (updated: SubscriptionData | null) => {
    if (updated && onSubscriptionUpdated) onSubscriptionUpdated(updated);
    window.dispatchEvent(new Event("campusflow_subscription_updated"));
    window.dispatchEvent(new Event("campusflow_notifications_refresh"));
  };

  const patchSubscription = async (
    payload: Record<string, unknown>,
    closeCancelModal = false
  ) => {
    setIsUpdatingSettings(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not update subscription.");
        return;
      }
      setSubscription(data.subscription);
      if (closeCancelModal) setShowCancelConfirm(false);
      syncGlobalState(data.subscription);
      toast.success(data.message);
    } catch {
      toast.error("Network error while updating subscription.");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card py-14 text-center text-xs text-muted-foreground">
        Loading institutional subscription &amp; billing status...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!compact && subscription && (
        <SubscriptionStatusCard
          subscription={subscription}
          isUpdating={isUpdatingSettings}
          onRefresh={() => loadSubscription(true)}
          onToggleAutoRenew={() =>
            patchSubscription({
              action: "toggle_auto_renew",
              autoRenew: !subscription.autoRenew,
            })
          }
          onRequestCancel={() => setShowCancelConfirm(true)}
          onResume={() => patchSubscription({ action: "resume" })}
        />
      )}

      {/* Monthly Plans Grid */}
      <div className="space-y-3">
        {!compact && (
          <div>
            <h3 className="text-base font-bold text-foreground">
              Choose a Monthly CampusFlow Plan
            </h3>
            <p className="text-xs text-muted-foreground">
              Instant activation via Safepay (JazzCash, Easypaisa, Debit &amp; Credit Cards) • Cancel anytime • 3-day advance renewal alerts
            </p>
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
                className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all ${plan.popular
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
                        ${plan.priceUsd} USD
                      </span>
                      <span className="text-xs text-muted-foreground">/month</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      ≈ PKR {plan.pricePkr.toLocaleString()}/mo • {plan.studentLimit}
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
                  onClick={() => setCheckoutPlan(plan)}
                  className="w-full h-9 text-xs font-semibold"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {isCurrent
                    ? "Manage / Renew Plan"
                    : subscription?.isTrial || subscription?.isLocked
                      ? `Subscribe to ${plan.name}`
                      : `Switch to ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {!compact && subscription && (
        <BillingHistoryCard history={subscription.billingHistory} />
      )}

      <SafepayCheckoutModal
        key={checkoutPlan?.id || "safepay-modal"}
        plan={checkoutPlan}
        allPlans={plans}
        onSelectPlan={(p) => setCheckoutPlan(p)}
        gateway={gateway}
        onClose={() => setCheckoutPlan(null)}
      />

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
                  Auto-Renew will be turned off immediately. Your institution keeps full access until{" "}
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
                onClick={() => patchSubscription({ action: "cancel" }, true)}
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
