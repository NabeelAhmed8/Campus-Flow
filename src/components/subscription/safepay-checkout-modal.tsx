"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  CreditCard,
  ShieldCheck,
  ExternalLink,
  Lock,
  X,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GatewayStatusInfo, PlanOption } from "./types";

interface SafepayCheckoutModalProps {
  plan: PlanOption | null;
  gateway: GatewayStatusInfo;
  onClose: () => void;
  allPlans?: PlanOption[];
  onSelectPlan?: (plan: PlanOption) => void;
}

type PaymentMethodType = "jazzcash" | "easypaisa" | "card";

export function SafepayCheckoutModal({
  plan,
  gateway,
  onClose,
  allPlans = [],
  onSelectPlan,
}: SafepayCheckoutModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plan?.id || "starter");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("jazzcash");
  const [autoRenew, setAutoRenew] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Synchronize active plan whenever plan prop updates
  useEffect(() => {
    if (plan?.id) {
      setSelectedPlanId(plan.id);
    }
  }, [plan?.id]);

  if (!plan) return null;

  // Derive active plan if user switches plan inside modal
  const activePlan =
    allPlans.find((p) => p.id === selectedPlanId) ||
    (plan.id === selectedPlanId ? plan : allPlans[0] || plan);

  const handlePlanChange = (targetPlan: PlanOption) => {
    setSelectedPlanId(targetPlan.id);
    if (onSelectPlan) onSelectPlan(targetPlan);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch("/api/payments/safepay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: activePlan.id,
          autoRenew,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        toast.error(data.error || "Unable to open Safepay checkout session.");
        return;
      }

      toast.info("Redirecting to Safepay Official Checkout...");
      window.location.href = data.checkoutUrl;
    } catch {
      toast.error("Network error while connecting to Safepay.");
    } finally {
      setIsProcessing(false);
    }
  };

  const methodInstructions: Record<PaymentMethodType, { title: string; desc: string }> = {
    jazzcash: {
      title: "JazzCash Mobile Account Flow",
      desc: "Enter your 11-digit JazzCash number & approve via instant MPIN prompt on your phone.",
    },
    easypaisa: {
      title: "Easypaisa Mobile Wallet Flow",
      desc: "Enter your 11-digit Easypaisa number & approve in your Easypaisa smartphone app.",
    },
    card: {
      title: "Debit / Credit Card & Raast Flow",
      desc: "Pay securely with Visa, Mastercard, or PayPak card with bank 3D Secure OTP verification.",
    },
  };

  const activeInstruction = methodInstructions[selectedMethod];

  return (
    <div
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Subscribe to ${activePlan.name} via Safepay`}
        className="w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-4 sm:p-5 space-y-3 animate-in fade-in-50 zoom-in-95 duration-150 overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-2.5 border-b">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                <Lock className="h-2.5 w-2.5" />
                Safepay Pakistan Checkout
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
              Subscribe to {activePlan.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              PKR {activePlan.pricePkr.toLocaleString()}/month (${activePlan.priceUsd} USD) • {activePlan.studentLimit}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 shrink-0"
            aria-label="Close checkout"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Dynamic Plan Switcher (Starter, Growth, Enterprise) */}
        {allPlans.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border">
            {allPlans.map((p) => {
              const isSelected = p.id === activePlan.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePlanChange(p)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {isSelected && <Sparkles className="h-3 w-3 shrink-0" />}
                  <span>{p.name}</span>
                  <span className="text-[10px] font-normal opacity-90 hidden sm:inline">
                    (Rs {p.pricePkr.toLocaleString()})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Dynamic Payment Method Selection Buttons */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-foreground">
            Select Payment Method:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* JazzCash */}
            <button
              type="button"
              onClick={() => setSelectedMethod("jazzcash")}
              className={`relative rounded-xl border p-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                selectedMethod === "jazzcash"
                  ? "border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/30 text-foreground"
                  : "bg-muted/20 hover:bg-muted/40 text-muted-foreground border-border"
              }`}
            >
              <div className="h-6 w-full relative flex items-center justify-center mb-1">
                <Image
                  src="/images/jazzcash.png"
                  alt="JazzCash"
                  width={80}
                  height={24}
                  className="max-h-5 w-auto object-contain"
                  priority
                />
              </div>
              <span className="text-[11px] font-bold text-foreground">JazzCash</span>
              <span className="text-[9px] text-muted-foreground">Mobile Wallet</span>
              {selectedMethod === "jazzcash" && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 absolute top-1.5 right-1.5" />
              )}
            </button>

            {/* Easypaisa */}
            <button
              type="button"
              onClick={() => setSelectedMethod("easypaisa")}
              className={`relative rounded-xl border p-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                selectedMethod === "easypaisa"
                  ? "border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/30 text-foreground"
                  : "bg-muted/20 hover:bg-muted/40 text-muted-foreground border-border"
              }`}
            >
              <div className="h-6 w-full relative flex items-center justify-center mb-1">
                <Image
                  src="/images/easypaisa.png"
                  alt="Easypaisa"
                  width={90}
                  height={24}
                  className="max-h-5 w-auto object-contain"
                  priority
                />
              </div>
              <span className="text-[11px] font-bold text-foreground">Easypaisa</span>
              <span className="text-[9px] text-muted-foreground">Mobile Wallet</span>
              {selectedMethod === "easypaisa" && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 absolute top-1.5 right-1.5" />
              )}
            </button>

            {/* Debit & Credit Card */}
            <button
              type="button"
              onClick={() => setSelectedMethod("card")}
              className={`relative rounded-xl border p-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                selectedMethod === "card"
                  ? "border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/30 text-foreground"
                  : "bg-muted/20 hover:bg-muted/40 text-muted-foreground border-border"
              }`}
            >
              <div className="h-6 flex items-center justify-center text-primary mb-1">
                <CreditCard className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold text-foreground">Card</span>
              <span className="text-[9px] text-muted-foreground">Visa / MC / PayPak</span>
              {selectedMethod === "card" && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 absolute top-1.5 right-1.5" />
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Instruction Banner based on Selected Method */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-2.5 space-y-0.5 text-xs">
          <p className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{activeInstruction.title}</span>
          </p>
          <p className="text-[11px] text-muted-foreground pl-5 leading-snug">
            {activeInstruction.desc}
          </p>
        </div>

        {/* Setup Required Banner */}
        {!gateway.configured && (
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>Add your Safepay keys from getsafepay.com in <code className="font-mono bg-background/50 px-1 py-0.5 rounded border">.env.local</code></span>
            <a
              href="https://sandbox.api.getsafepay.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-primary shrink-0 ml-2"
            >
              Get Keys &rarr;
            </a>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleCheckout} className="space-y-3 text-xs pt-0.5">
          <label
            htmlFor="sub-auto-renew-check"
            className="flex items-center gap-2 rounded-xl border bg-muted/20 p-2 cursor-pointer"
          >
            <input
              id="sub-auto-renew-check"
              name="autoRenew"
              type="checkbox"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              className="rounded border-border accent-primary shrink-0"
            />
            <span className="text-[11px] text-muted-foreground leading-tight">
              <strong className="text-foreground">Monthly Auto-Renewal</strong> (reminders 3 days before expiry)
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-1 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isProcessing || !gateway.configured}
              className="h-8 text-xs px-4 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              {isProcessing
                ? "Opening Safepay..."
                : !gateway.configured
                ? "Configure Keys in .env.local"
                : `Pay PKR ${activePlan.pricePkr.toLocaleString()} via ${
                    selectedMethod === "jazzcash"
                      ? "JazzCash"
                      : selectedMethod === "easypaisa"
                      ? "Easypaisa"
                      : "Card"
                  }`}
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
