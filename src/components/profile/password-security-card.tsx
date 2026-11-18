"use client";

import { useState } from "react";
import { KeyRound, Lock, Eye, EyeOff, Loader2, ShieldCheck, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PasswordSecurityCardProps {
  onSignOut: () => void;
}

export function PasswordSecurityCard({ onSignOut }: PasswordSecurityCardProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Unable to update password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Password changed successfully.");
    } catch {
      toast.error("Unable to reach the server. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="lg:col-span-5 space-y-6">
      <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b">
          <div className="h-8.5 w-8.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Change Account Password</h3>
            <p className="text-[11px] text-muted-foreground">
              Protected with salted cryptographic hashing.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
          <div>
            <label
              htmlFor="profile-current-password"
              className="block font-semibold mb-1 text-foreground"
            >
              Current Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                id="profile-current-password"
                name="currentPassword"
                type={showCurrentPw ? "text" : "password"}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full h-9 rounded-lg border bg-background pl-8.5 pr-9 text-xs outline-none focus:ring-1 focus:ring-primary tracking-wide"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((p) => !p)}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground p-1 rounded"
                aria-label={showCurrentPw ? "Hide current password" : "Show current password"}
              >
                {showCurrentPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="profile-new-password"
              className="block font-semibold mb-1 text-foreground"
            >
              New Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                id="profile-new-password"
                name="newPassword"
                type={showNewPw ? "text" : "password"}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-9 rounded-lg border bg-background pl-8.5 pr-9 text-xs outline-none focus:ring-1 focus:ring-primary tracking-wide"
              />
              <button
                type="button"
                onClick={() => setShowNewPw((p) => !p)}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground p-1 rounded"
                aria-label={showNewPw ? "Hide new password" : "Show new password"}
              >
                {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="profile-confirm-new-password"
              className="block font-semibold mb-1 text-foreground"
            >
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                id="profile-confirm-new-password"
                name="confirmNewPassword"
                type={showConfirmPw ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Repeat new password"
                className={`w-full h-9 rounded-lg border bg-background pl-8.5 pr-9 text-xs outline-none focus:ring-1 tracking-wide ${
                  confirmNewPassword && newPassword !== confirmNewPassword
                    ? "border-destructive/60 focus:ring-destructive"
                    : "focus:ring-primary"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((p) => !p)}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground p-1 rounded"
                aria-label={
                  showConfirmPw ? "Hide confirm new password" : "Show confirm new password"
                }
              >
                {showConfirmPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {confirmNewPassword.length > 0 && (
            <div className="text-[11px] px-0.5">
              {newPassword === confirmNewPassword ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ New passwords match
                </span>
              ) : (
                <span className="text-destructive font-medium">✗ Passwords do not match</span>
              )}
            </div>
          )}

          <Button type="submit" size="sm" className="w-full h-9 mt-1" disabled={savingPassword}>
            {savingPassword ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Update Account Password
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Active Session Security Info Card */}
      <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-foreground">Session &amp; Security Status</h3>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Your session is protected by a cryptographically signed{" "}
          <code className="font-mono text-[10px]">HttpOnly</code> cookie with live server-side verification.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSignOut}
          className="w-full h-8.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          Sign Out From This Device
        </Button>
      </div>
    </div>
  );
}
