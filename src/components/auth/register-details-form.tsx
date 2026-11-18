"use client";

import { useState } from "react";
import {
  ArrowRight,
  Building,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  KeyRound,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortalRole } from "./types";

interface RegisterDetailsFormProps {
  selectedRole: PortalRole;
  institution: string;
  schoolCode: string;
  rollNumber: string;
  fullName: string;
  extraField: string;
  email: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  onInstitutionChange: (val: string) => void;
  onSchoolCodeChange: (val: string) => void;
  onRollNumberChange: (val: string) => void;
  onFullNameChange: (val: string) => void;
  onExtraFieldChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onConfirmPasswordChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RegisterDetailsForm({
  selectedRole,
  institution,
  schoolCode,
  rollNumber,
  fullName,
  extraField,
  email,
  password,
  confirmPassword,
  loading,
  onInstitutionChange,
  onSchoolCodeChange,
  onRollNumberChange,
  onFullNameChange,
  onExtraFieldChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: RegisterDetailsFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-xs">
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
                onChange={(e) => onInstitutionChange(e.target.value)}
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
                onChange={(e) => onSchoolCodeChange(e.target.value.toUpperCase())}
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
              onChange={(e) => onFullNameChange(e.target.value)}
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
            onChange={(e) => onExtraFieldChange(e.target.value)}
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
              onChange={(e) => onRollNumberChange(e.target.value.toUpperCase())}
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
            onChange={(e) => onEmailChange(e.target.value)}
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
              onChange={(e) => onPasswordChange(e.target.value)}
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
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
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
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
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

      <Button type="submit" size="sm" className="w-full h-9 mt-2" disabled={loading}>
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
  );
}
