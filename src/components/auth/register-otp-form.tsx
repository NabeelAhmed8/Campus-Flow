"use client";

import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoleOption } from "./types";

interface RegisterOtpFormProps {
  email: string;
  currentRole: RoleOption;
  otpDigits: string[];
  expiryCountdown: number;
  resendCooldown: number;
  loading: boolean;
  resending: boolean;
  devPreview: { code?: string; url?: string } | null;
  onOtpChange: (next: string[]) => void;
  onChangeEmail: () => void;
  onResend: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function formatCountdown(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RegisterOtpForm({
  email,
  currentRole,
  otpDigits,
  expiryCountdown,
  resendCooldown,
  loading,
  resending,
  devPreview,
  onOtpChange,
  onChangeEmail,
  onResend,
  onSubmit,
}: RegisterOtpFormProps) {
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const timer = setTimeout(() => otpRefs.current[0]?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const next = [...otpDigits];
      next[index] = "";
      onOtpChange(next);
      return;
    }

    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split("");
      const next = ["", "", "", "", "", ""];
      chars.forEach((ch, idx) => {
        next[idx] = ch;
      });
      onOtpChange(next);
      otpRefs.current[Math.min(chars.length, 5)]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = clean;
    onOtpChange(next);
    if (index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otpDigits[index]) {
        const next = [...otpDigits];
        next[index] = "";
        onOtpChange(next);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
        const next = [...otpDigits];
        next[index - 1] = "";
        onOtpChange(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((ch, idx) => {
      next[idx] = ch;
    });
    onOtpChange(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const otpComplete = otpDigits.every((d) => d.length === 1);

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      <div className="rounded-xl border bg-muted/40 p-3.5 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Verification code sent to:</span>
          <button
            type="button"
            onClick={onChangeEmail}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            Change Email
          </button>
        </div>
        <p className="font-semibold text-foreground break-all">{email.trim()}</p>
        <p className="text-[10px] text-muted-foreground">
          Once verified, your account will be created and you will be redirected directly to your{" "}
          <span className="font-semibold text-foreground">{currentRole.title}</span> dashboard.
        </p>
      </div>

      {/* Local Dev Email Preview Banner */}
      {devPreview && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-amber-800 dark:text-amber-300">
              Local Dev Email Preview
            </span>
            {devPreview.code && (
              <button
                type="button"
                onClick={() => onOtpChange(devPreview.code!.slice(0, 6).split(""))}
                className="font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 hover:bg-amber-500/30 transition-colors"
                title="Click to autofill code"
              >
                Code: {devPreview.code} (Fill)
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Configure <code className="font-mono">SMTP_USER</code> &amp;{" "}
            <code className="font-mono">SMTP_PASS</code> (or{" "}
            <code className="font-mono">RESEND_API_KEY</code>) in{" "}
            <code className="font-mono">.env.local</code> for live inbox delivery.
          </p>
          {devPreview.url && (
            <a
              href={devPreview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
            >
              View rendered HTML email preview
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* 6-Digit OTP Boxes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="otp-digit-0" className="font-semibold text-foreground">
            Enter 6-Digit Verification Code
          </label>
          <span
            className={`text-[11px] font-mono ${
              expiryCountdown <= 60 ? "text-destructive font-semibold" : "text-muted-foreground"
            }`}
          >
            {expiryCountdown > 0 ? `Expires in ${formatCountdown(expiryCountdown)}` : "Code expired"}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                otpRefs.current[index] = el;
              }}
              id={`otp-digit-${index}`}
              name={`otpDigit${index}`}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={6}
              aria-label={`Verification digit ${index + 1}`}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="h-11 sm:h-12 w-full rounded-xl border bg-background text-center font-mono text-base sm:text-lg font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ))}
        </div>
      </div>

      <Button
        type="submit"
        size="sm"
        className="w-full h-9"
        disabled={loading || !otpComplete || expiryCountdown <= 0}
      >
        {loading ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Verifying &amp; Opening Dashboard...
          </>
        ) : (
          <>
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Verify &amp; Open {currentRole.title}
          </>
        )}
      </Button>

      <div className="flex items-center justify-between pt-1 text-[11px]">
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to details
        </button>

        <button
          type="button"
          disabled={resendCooldown > 0 || resending}
          onClick={onResend}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline"
        >
          <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
          {resending
            ? "Sending..."
            : resendCooldown > 0
            ? `Resend code in ${resendCooldown}s`
            : "Resend verification code"}
        </button>
      </div>
    </form>
  );
}
