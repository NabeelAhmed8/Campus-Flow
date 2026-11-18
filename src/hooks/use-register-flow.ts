"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { syncClientAuthStorage } from "@/lib/client-auth";
import { PORTAL_ROLES, type PortalRole, type SignupStep } from "@/components/auth/types";

export function useRegisterFlow() {
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
    const timer = setInterval(
      () => setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (step !== "verify" || expiryCountdown <= 0) return;
    const timer = setInterval(
      () => setExpiryCountdown((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
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

      syncClientAuthStorage(data.user);

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

  return {
    step,
    setStep,
    selectedRole,
    setSelectedRole,
    currentRole,
    institution,
    setInstitution,
    schoolCode,
    setSchoolCode,
    rollNumber,
    setRollNumber,
    fullName,
    setFullName,
    extraField,
    setExtraField,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    otpDigits,
    setOtpDigits,
    resendCooldown,
    expiryCountdown,
    resending,
    devPreview,
    setDevPreview,
    handleSendVerification,
    handleVerifyAndRegister,
  };
}
