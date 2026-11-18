"use client";

import { useState } from "react";
import {
  CreditCard,
  Building2,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  KeyRound,
  Lock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GatewayStatusInfo, PlanOption } from "./types";

interface SafepayCheckoutModalProps {
  plan: PlanOption | null;
  gateway: GatewayStatusInfo;
  onClose: () => void;
}

export function SafepayCheckoutModal({
  plan,
  gateway,
  onClose,
}: SafepayCheckoutModalProps) {
  const [autoRenew, setAutoRenew] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!plan) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch("/api/payments/safepay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, autoRenew }),
      });
      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        toast.error(data.error || "Unable to open Safepay checkout session.");
        return;
      }

      toast.info("Redirecting to Safepay secure checkout...");
      window.location.href = data.checkoutUrl;
    } catch {
      toast.error("Network error while connecting to Safepay.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Subscribe to ${plan.name} via Safepay`}
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
              Activate {plan.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              PKR {plan.pricePkr.toLocaleString()}/month (${plan.priceUsd} USD) •
              Instant Webhook Activation
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close checkout"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border bg-muted/20 p-2.5 space-y-1">
            <CreditCard className="h-4 w-4 mx-auto text-primary" />
            <p className="text-[11px] font-semibold text-foreground">
              Visa / Mastercard
            </p>
            <p className="text-[10px] text-muted-foreground">Pakistani Cards</p>
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
            <p className="text-[10px] text-muted-foreground">Instant Verify</p>
          </div>
        </div>

        {!gateway.configured && (
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 space-y-2.5 text-xs">
            <div className="flex items-start gap-2">
              <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-foreground">
                  Connect Your Safepay Production Account
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Link your Pakistani Bank Account at{" "}
                  <a
                    href="https://getsafepay.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary underline"
                  >
                    getsafepay.com
                  </a>{" "}
                  and paste your 3 live keys in{" "}
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
        )}

        <form onSubmit={handleCheckout} className="space-y-3 text-xs">
          <label
            htmlFor="sub-auto-renew-check"
            className="flex items-start gap-2.5 rounded-xl border bg-muted/20 p-3 cursor-pointer"
          >
            <input
              id="sub-auto-renew-check"
              name="autoRenew"
              type="checkbox"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              className="mt-0.5 rounded border-border accent-primary"
            />
            <span className="text-[11px] leading-snug text-muted-foreground">
              <strong className="text-foreground block">
                Enable Renewal Preference (Cancel Anytime)
              </strong>
              Receive an automatic email &amp; Admin Hub alert 3 days before every monthly billing cycle ends.
            </span>
          </label>

          <div className="rounded-xl border border-dashed bg-muted/15 p-3 text-[11px] text-muted-foreground leading-relaxed">
            You will be redirected to{" "}
            <strong className="text-foreground">Safepay Hosted Checkout</strong>.
            Once Safepay verifies your payment via signed webhook, your 30-day plan activates automatically.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isProcessing || !gateway.configured}
              className="h-9 text-xs px-5"
            >
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              {isProcessing
                ? "Opening Safepay..."
                : `Pay PKR ${plan.pricePkr.toLocaleString()} via Safepay`}
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
