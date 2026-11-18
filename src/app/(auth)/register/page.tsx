"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Building,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  BrainCircuit,
  BookOpen,
  Users,
  ShieldCheck,
  Loader2,
  MailCheck,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type PortalRole = "admin" | "teacher" | "student" | "parent";
type SignupStep = "details" | "verify";

interface RoleOption {
  id: PortalRole;
  title: string;
  badge: string;
  targetPath: string;
  icon: any;
  description: string;
}

const PORTAL_ROLES: RoleOption[] = [
  {
    id: "admin",
    title: "Admin Hub",
    badge: "Institute Head",
    targetPath: "/admin",
    icon: Building,
    description: "Manage student roster, fee invoicing, and institution settings",
  },
  {
    id: "teacher",
    title: "Teacher Suite",
    badge: "Faculty",
    targetPath: "/teacher",
    icon: BrainCircuit,
    description: "AI lesson planning, question quizzes, and grading rubrics",
  },
  {
    id: "student",
    title: "Student Portal",
    badge: "Learner",
    targetPath: "/student",
    icon: BookOpen,
    description: "Class timetable, homework tracker, report card, and AI tutor",
  },
  {
    id: "parent",
    title: "Parent Portal",
    badge: "Guardian",
    targetPath: "/parent",
    icon: Users,
    description: "Attendance records, Pakistani bank fee payments, and leave notices",
  },
];

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 2: OTP Verification state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiryCountdown, setExpiryCountdown] = useState(600);
  const [resending, setResending] = useState(false);
  const [devPreview, setDevPreview] = useState<{
    code?: string;
    url?: string;
  } | null>(null);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Guarantee loading is reset on mount and browser bfcache restore
  useEffect(() => {
    setLoading(false);
    const handlePageShow = () => setLoading(false);
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // OTP expiry countdown timer
  useEffect(() => {
    if (step !== "verify" || expiryCountdown <= 0) return;
    const timer = setInterval(() => {
      setExpiryCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, expiryCountdown]);

  // Auto-focus first OTP box when entering verification step
  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const currentRole =
    PORTAL_ROLES.find((r) => r.id === selectedRole) || PORTAL_ROLES[0];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Step 1: Request 6-digit Email Verification Code
  const handleSendVerification = async (e?: React.FormEvent, isResend = false) => {
    if (e) e.preventDefault();

    if (
      !email.trim() ||
      !password.trim() ||
      !fullName.trim() ||
      !confirmPassword.trim()
    ) {
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

    if (isResend) {
      setResending(true);
    } else {
      setLoading(true);
    }

    const instName = institution.trim();
    const userName = fullName.trim();

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          email: email.trim(),
          password: password.trim(),
          confirmPassword: confirmPassword.trim(),
          role: selectedRole,
          institution: selectedRole === "admin" ? instName : undefined,
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
        toast.error(
          data.error || "Unable to send verification code. Please try again."
        );
        return;
      }

      if (data.deliveryMode === "dev-preview" && (data.devCode || data.devPreviewUrl)) {
        setDevPreview({
          code: data.devCode,
          url: data.devPreviewUrl,
        });
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

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      return;
    }

    // Handle multi-character input / autofill
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split("");
      const next = ["", "", "", "", "", ""];
      chars.forEach((ch, idx) => {
        next[idx] = ch;
      });
      setOtpDigits(next);
      const focusIdx = Math.min(chars.length, 5);
      otpRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);

    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (otpDigits[index]) {
        const next = [...otpDigits];
        next[index] = "";
        setOtpDigits(next);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
        const next = [...otpDigits];
        next[index - 1] = "";
        setOtpDigits(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((ch, idx) => {
      next[idx] = ch;
    });
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // Step 2: Verify OTP & Complete Signup -> Redirect to Role Dashboard
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
        body: JSON.stringify({
          email: email.trim(),
          code,
        }),
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

      toast.success(
        `Email verified! Opening your ${currentRole.title} dashboard...`
      );
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

  const otpComplete = otpDigits.every((d) => d.length === 1);

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center px-4 py-6 bg-muted/20 relative">
      {/* Top Navigation */}
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

        {/* Role / Portal Switcher (visible in Step 1) */}
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
                  <span className="text-[9px] opacity-75 font-normal">
                    {role.badge}
                  </span>
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
            <form
              onSubmit={(e) => handleSendVerification(e, false)}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedRole === "admin" ? (
                  <div>
                    <label
                      htmlFor="register-institution"
                      className="block font-semibold mb-1 text-foreground"
                    >
                      Institution / School Name *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <input
                        id="register-institution"
                        name="institution"
                        type="text"
                        autoComplete="organization"
                        required
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. Beaconhouse Academy"
                        className="w-full h-8.5 rounded-lg border bg-background pl-8.5 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="register-school-code"
                      className="block font-semibold mb-1 text-foreground"
                    >
                      School Join Code *
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <input
                        id="register-school-code"
                        name="schoolCode"
                        type="text"
                        autoComplete="off"
                        required
                        value={schoolCode}
                        onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                        placeholder="e.g. JUDE-4821"
                        className="w-full h-8.5 rounded-lg border bg-background pl-8.5 pr-3 text-xs font-mono uppercase tracking-wider outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="register-fullname"
                    className="block font-semibold mb-1 text-foreground"
                  >
                    {selectedRole === "admin"
                      ? "Director / Principal Name *"
                      : selectedRole === "teacher"
                      ? "Teacher Full Name *"
                      : selectedRole === "student"
                      ? "Student Full Name *"
                      : "Guardian / Parent Name *"}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      id="register-fullname"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={
                        selectedRole === "admin"
                          ? "Dr. S. Harrison"
                          : selectedRole === "teacher"
                          ? "Prof. Farooq Raza"
                          : selectedRole === "student"
                          ? "Hamza Tariq"
                          : "Tariq Mahmood"
                      }
                      className="w-full h-8.5 rounded-lg border bg-background pl-8.5 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Role-Specific Linking Field */}
              {selectedRole === "teacher" && (
                <div>
                  <label
                    htmlFor="register-role-detail"
                    className="block font-semibold mb-1 text-foreground"
                  >
                    Department / Primary Subject
                  </label>
                  <input
                    id="register-role-detail"
                    name="roleDetail"
                    type="text"
                    autoComplete="off"
                    value={extraField}
                    onChange={(e) => setExtraField(e.target.value)}
                    placeholder="Mathematics / Science"
                    className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {(selectedRole === "student" || selectedRole === "parent") && (
                <div>
                  <label
                    htmlFor="register-roll-number"
                    className="block font-semibold mb-1 text-foreground"
                  >
                    {selectedRole === "student"
                      ? "Your Enrolled Student Roll Number *"
                      : "Child's Enrolled Roll Number(s) *"}
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      id="register-roll-number"
                      name="rollNumber"
                      type="text"
                      autoComplete="off"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                      placeholder={
                        selectedRole === "student"
                          ? "e.g. CF-101-A4B2 (issued by your school admin)"
                          : "e.g. CF-101-A4B2 or multiple: CF-101-A4B2, CF-102-B8C1"
                      }
                      className="w-full h-8.5 rounded-lg border bg-background pl-8.5 pr-3 text-xs font-mono uppercase tracking-wider outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {selectedRole === "student"
                      ? "Links your portal strictly to your own attendance, timetable, and report card."
                      : "Multiple children in the same school? Enter comma-separated Roll Numbers now, or link more children anytime inside your Parent Portal."}
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="register-email"
                  className="block font-semibold mb-1 text-foreground"
                >
                  {selectedRole === "admin"
                    ? "Official School Email"
                    : selectedRole === "teacher"
                    ? "Faculty Email"
                    : selectedRole === "student"
                    ? "Student Email"
                    : "Parent Email"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`${selectedRole}@school.edu`}
                    className="w-full h-8.5 rounded-lg border bg-background pl-8.5 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="register-password"
                    className="block font-semibold mb-1 text-foreground"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      id="register-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full h-8.5 rounded-lg border bg-background pl-8.5 pr-9 text-xs outline-none focus:ring-1 focus:ring-primary tracking-wide"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1.5 text-muted-foreground hover:text-foreground transition-colors p-1 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-confirm-password"
                    className="block font-semibold mb-1 text-foreground"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      id="register-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className={`w-full h-8.5 rounded-lg border bg-background pl-8.5 pr-9 text-xs outline-none focus:ring-1 tracking-wide ${
                        confirmPassword && password !== confirmPassword
                          ? "border-destructive/60 focus:ring-destructive"
                          : "focus:ring-primary"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-2 top-1.5 text-muted-foreground hover:text-foreground transition-colors p-1 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      title={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] px-1">
                  {password === confirmPassword ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      ✓ Passwords match
                    </span>
                  ) : (
                    <span className="text-destructive flex items-center gap-1 font-medium">
                      ✗ Passwords do not match
                    </span>
                  )}
                </div>
              )}

              <Button
                type="submit"
                size="sm"
                className="w-full h-9 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Sending Verification Code...
                  </>
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4 text-xs">
              <div className="rounded-xl border bg-muted/40 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    Verification code sent to:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("details");
                      setDevPreview(null);
                    }}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Change Email
                  </button>
                </div>
                <p className="font-semibold text-foreground break-all">
                  {email.trim()}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Once verified, your account will be created and you will be redirected directly to your{" "}
                  <span className="font-semibold text-foreground">
                    {currentRole.title}
                  </span>{" "}
                  dashboard.
                </p>
              </div>

              {/* Local Dev Email Preview Banner (Only appears locally when SMTP/Resend isn't configured) */}
              {devPreview && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-amber-800 dark:text-amber-300">
                      Local Dev Email Preview
                    </span>
                    {devPreview.code && (
                      <button
                        type="button"
                        onClick={() => {
                          const chars = devPreview.code!.slice(0, 6).split("");
                          setOtpDigits(chars);
                        }}
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
                  <label
                    htmlFor="otp-digit-0"
                    className="font-semibold text-foreground"
                  >
                    Enter 6-Digit Verification Code
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      expiryCountdown <= 60
                        ? "text-destructive font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {expiryCountdown > 0
                      ? `Expires in ${formatTime(expiryCountdown)}`
                      : "Code expired"}
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
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
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
                  onClick={() => setStep("details")}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to details
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || resending}
                  onClick={() => handleSendVerification(undefined, true)}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${resending ? "animate-spin" : ""}`}
                  />
                  {resending
                    ? "Sending..."
                    : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend verification code"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center text-[11px] text-muted-foreground">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-foreground hover:underline"
          >
            Sign in to your portal here
          </Link>
        </div>
      </div>
    </div>
  );
}
