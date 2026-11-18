"use client";

import Link from "next/link";
import { GraduationCap, ArrowLeft, MailCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PORTAL_ROLES } from "@/components/auth/types";
import { RegisterDetailsForm } from "@/components/auth/register-details-form";
import { RegisterOtpForm } from "@/components/auth/register-otp-form";
import { useRegisterFlow } from "@/hooks/use-register-flow";

export default function RegisterPage() {
  const flow = useRegisterFlow();
  const { step, selectedRole, currentRole } = flow;

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center px-4 py-6 bg-muted/20 relative">
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link href="/">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-lg space-y-3.5">
        {/* Brand */}
        <div className="text-center space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-bold text-xl tracking-tight"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <span>
              Campus<span className="text-primary/70 font-semibold">Flow</span>
            </span>
          </Link>
          <p className="text-[11px] text-muted-foreground">
            {step === "details"
              ? "Select your portal role and enter your details to receive a verification code"
              : "Enter the 6-digit verification code sent to your email address"}
          </p>
        </div>

        {/* 2-Step Progress Pill */}
        <div className="flex items-center justify-center gap-2 text-[11px]">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium transition-colors ${
              step === "details"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
            }`}
          >
            {step === "verify" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <span className="font-bold">1</span>
            )}
            <span>Account Details</span>
          </div>
          <div className="h-px w-6 bg-border" />
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium transition-colors ${
              step === "verify"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/60 text-muted-foreground border-border"
            }`}
          >
            <span className="font-bold">2</span>
            <span>Verify Email</span>
          </div>
        </div>

        {/* Role Switcher */}
        {step === "details" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-muted/70 border">
            {PORTAL_ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => flow.setSelectedRole(role.id)}
                  className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-card text-foreground shadow-xs border font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 mb-1 ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span className="leading-tight">
                    {role.title
                      .replace(" Portal", "")
                      .replace(" Suite", "")
                      .replace(" Hub", "")}
                  </span>
                  <span className="text-[9px] opacity-75 font-normal">{role.badge}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              {step === "details" ? (
                <currentRole.icon className="h-4 w-4 text-primary" />
              ) : (
                <MailCheck className="h-4.5 w-4.5 text-primary" />
              )}
              <div>
                <h2 className="text-sm font-semibold">
                  {step === "details"
                    ? `${currentRole.title} Registration`
                    : "Email Verification Required"}
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  {step === "details"
                    ? currentRole.description
                    : `Verifying account for ${currentRole.title} workspace`}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
              {currentRole.badge}
            </span>
          </div>

          {step === "details" ? (
            <RegisterDetailsForm
              selectedRole={selectedRole}
              institution={flow.institution}
              schoolCode={flow.schoolCode}
              rollNumber={flow.rollNumber}
              fullName={flow.fullName}
              extraField={flow.extraField}
              email={flow.email}
              password={flow.password}
              confirmPassword={flow.confirmPassword}
              loading={flow.loading}
              onInstitutionChange={flow.setInstitution}
              onSchoolCodeChange={flow.setSchoolCode}
              onRollNumberChange={flow.setRollNumber}
              onFullNameChange={flow.setFullName}
              onExtraFieldChange={flow.setExtraField}
              onEmailChange={flow.setEmail}
              onPasswordChange={flow.setPassword}
              onConfirmPasswordChange={flow.setConfirmPassword}
              onSubmit={(e) => flow.handleSendVerification(e, false)}
            />
          ) : (
            <RegisterOtpForm
              email={flow.email}
              currentRole={currentRole}
              otpDigits={flow.otpDigits}
              expiryCountdown={flow.expiryCountdown}
              resendCooldown={flow.resendCooldown}
              loading={flow.loading}
              resending={flow.resending}
              devPreview={flow.devPreview}
              onOtpChange={flow.setOtpDigits}
              onChangeEmail={() => {
                flow.setStep("details");
                flow.setDevPreview(null);
              }}
              onResend={() => flow.handleSendVerification(undefined, true)}
              onSubmit={flow.handleVerifyAndRegister}
            />
          )}
        </div>

        <div className="text-center text-[11px] text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-foreground hover:underline">
            Sign in to your portal here
          </Link>
        </div>
      </div>
    </div>
  );
}
