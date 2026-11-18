"use client";

import {
  Clock,
  RefreshCw,
  CalendarDays,
  Ban,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatReadableDate } from "@/lib/format";
import { SubscriptionData } from "./types";

interface SubscriptionStatusCardProps {
  subscription: SubscriptionData;
  isUpdating: boolean;
  onRefresh: () => void;
  onToggleAutoRenew: () => void;
  onRequestCancel: () => void;
  onResume: () => void;
}

export function SubscriptionStatusCard({
  subscription,
  isUpdating,
  onRefresh,
  onToggleAutoRenew,
  onRequestCancel,
  onResume,
}: SubscriptionStatusCardProps) {
  const totalCycleDays = subscription.isTrial ? 14 : 30;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((subscription.daysRemaining / totalCycleDays) * 100))
  );

  return (
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

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="h-9 text-xs shrink-0 self-start lg:self-center"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
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

        <div className="lg:col-span-6 rounded-xl border bg-muted/20 p-4 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">
                Automatic Monthly Renewal (Auto-Renew)
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {subscription.autoRenew
                  ? "Enabled — 3-day advance email & Admin bell renewal alerts active."
                  : "Disabled — you will need to renew before expiry to prevent lockout."}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={subscription.autoRenew}
              aria-label="Toggle automatic monthly renewal"
              disabled={isUpdating || subscription.isLocked}
              onClick={onToggleAutoRenew}
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
                disabled={isUpdating}
                onClick={onResume}
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
                  disabled={isUpdating}
                  onClick={onRequestCancel}
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
  );
}
