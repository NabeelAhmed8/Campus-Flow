"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, MailCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PORTAL_ROLES, type PortalRole, type SignupStep } from "@/components/auth/types";
import { RegisterDetailsForm } from "@/components/auth/register-details-form";
import { RegisterOtpForm } from "@/components/auth/register-otp-form";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>("details");
  const [selectedRole, setSelectedRole] = useState<PortalRole>("admin");
  const [institution, setInstitution] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [extraField, setExtraField] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 2: OTP Verification state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiryCountdown, setExpiryCountdown] = useState(600);
  const [resending, setResending] = useState(false);
  const [devPreview, setDevPreview] = useState<{ code?: string; url?: string } | null>(null);

  useEffect(() => {
    setLoading(false);
    const handlePageShow = () => setLoading(false);
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (step !== "verify" || expiryCountdown <= 0) return;
    const timer = setInterval(() => setExpiryCountdown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [step, expiryCountdown]);

  const currentRole = PORTAL_ROLES.find((r) => r.id === selectedRole) || PORTAL_ROLES[0];

  const handleSendVerification = async (e?: React.FormEvent, isResend = false) => {
    if (e) e.preventDefault();

    if (!email.trim() || !password.trim() || !fullName.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please verify your confirm password.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (selectedRole === "admin" && !institution.trim()) {
      toast.error("Please enter your Institution / School Name.");
      return;
    }
    if (selectedRole !== "admin" && !schoolCode.trim()) {
      toast.error("Please enter the School Join Code provided by your school administrator.");
      return;
    }
    if ((selectedRole === "student" || selectedRole === "parent") && !rollNumber.trim()) {
      toast.error(
        selectedRole === "student"
          ? "Please enter your enrolled Student Roll Number."
          : "Please enter your child's enrolled Student Roll Number."
      );
      return;
    }

    if (isResend) setResending(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          password: password.trim(),
          confirmPassword: confirmPassword.trim(),
          role: selectedRole,
          institution: selectedRole === "admin" ? institution.trim() : undefined,
          schoolCode: selectedRole !== "admin" ? schoolCode.trim().toUpperCase() : undefined,
          rollNumber:
            selectedRole === "student" || selectedRole === "parent"
              ? rollNumber.trim().toUpperCase()
              : undefined,
          extraField: selectedRole === "teacher" ? extraField.trim() || undefined : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Unable to send verification code. Please try again.");
        return;
      }

      if (data.deliveryMode === "dev-preview" && (data.devCode || data.devPreviewUrl)) {
        setDevPreview({ code: data.devCode, url: data.devPreviewUrl });
      } else {
        setDevPreview(null);
      }

      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(30);
      setExpiryCountdown(data.expiresInSeconds || 600);
      setStep("verify");

      toast.success(
        isResend
          ? `A fresh verification code has been sent to ${email.trim()}.`
          : `Verification code sent to ${email.trim()}. Please check your inbox.`
      );
    } catch {
      toast.error(
        "Unable to reach the server. Please check your network connection and try again."
      );
    } finally {
      setLoading(false);
      setResending(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }
    if (expiryCountdown <= 0) {
      toast.error("Verification code expired. Please click Resend Code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Verification failed. Please check the code.");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("campusflow_institution", data.user.institution);
        localStorage.setItem("campusflow_user_role", data.user.role);
        localStorage.setItem("campusflow_user_name", data.user.name);
        localStorage.setItem("campusflow_user_email", data.user.email);
        if (data.user.schoolCode) {
          localStorage.setItem("campusflow_school_code", data.user.schoolCode);
        }
        if (data.user.role === "admin") {
          localStorage.setItem("campusflow_admin_name", data.user.name);
        }
        window.dispatchEvent(new Event("campusflow_institution_updated"));
      }

      const destination = data.redirectPath || currentRole.targetPath;
      toast.success(`Email verified! Opening your ${currentRole.title} dashboard...`);
      setTimeout(() => {
        setLoading(false);
        router.push(destination);
      }, 650);
    } catch {
      toast.error(
        "Unable to reach the server. Please check your network connection and try again."
      );
      setLoading(false);
    }
  };

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
            {step === "verify" ? <CheckCircle2 className="h-3 w-3" /> : <span className="font-bold">1</span>}
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
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-card text-foreground shadow-xs border font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                  }`}
                >
                  <Icon className={`h-4 w-4 mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="leading-tight">
                    {role.title.replace(" Portal", "").replace(" Suite", "").replace(" Hub", "")}
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
              institution={institution}
              schoolCode={schoolCode}
              rollNumber={rollNumber}
              fullName={fullName}
              extraField={extraField}
              email={email}
              password={password}
              confirmPassword={confirmPassword}
              loading={loading}
              onInstitutionChange={setInstitution}
              onSchoolCodeChange={setSchoolCode}
              onRollNumberChange={setRollNumber}
              onFullNameChange={setFullName}
              onExtraFieldChange={setExtraField}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onSubmit={(e) => handleSendVerification(e, false)}
            />
          ) : (
            <RegisterOtpForm
              email={email}
              currentRole={currentRole}
              otpDigits={otpDigits}
              expiryCountdown={expiryCountdown}
              resendCooldown={resendCooldown}
              loading={loading}
              resending={resending}
              devPreview={devPreview}
              onOtpChange={setOtpDigits}
              onChangeEmail={() => {
                setStep("details");
                setDevPreview(null);
              }}
              onResend={() => handleSendVerification(undefined, true)}
              onSubmit={handleVerifyAndRegister}
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
