"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Building,
  ShieldCheck,
  Calendar,
  Clock,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  ArrowLeft,
  BadgeCheck,
  KeyRound,
  LogOut,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type PortalRole = "admin" | "coordinator" | "teacher" | "student" | "parent";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: PortalRole;
  institution: string;
  extraField: string;
  schoolCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

const ROLE_META: Record<
  PortalRole,
  {
    label: string;
    workspaceTitle: string;
    workspaceHref: string;
    badgeClass: string;
    extraLabel: string;
    extraPlaceholder: string;
    permissions: string[];
  }
> = {
  admin: {
    label: "Institute Administrator",
    workspaceTitle: "Admin Hub",
    workspaceHref: "/admin",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    extraLabel: "Designation / Office Title",
    extraPlaceholder: "e.g. Principal, Academic Director, Registrar",
    permissions: [
      "Enroll & manage master student roster",
      "Collect & audit tuition fee ledgers",
      "Assign faculty roles & class sections",
      "Access institutional financial analytics",
    ],
  },
  coordinator: {
    label: "Academic Coordinator",
    workspaceTitle: "Coordinator Desk",
    workspaceHref: "/coordinator",
    badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    extraLabel: "Assigned Wing / Department",
    extraPlaceholder: "e.g. Senior Wing Coordinator (Grades 9–12)",
    permissions: [
      "Mark daily faculty attendance & arrange substitutions",
      "Schedule master class & section timetables",
      "Plan & track term syllabus completion",
      "Publish exam date sheets & campus circulars",
    ],
  },
  teacher: {
    label: "Faculty Educator",
    workspaceTitle: "Teacher Suite",
    workspaceHref: "/teacher",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    extraLabel: "Department / Primary Subject",
    extraPlaceholder: "e.g. Mathematics & Physics Department",
    permissions: [
      "Mark & update daily student attendance",
      "Record academic marks & formative feedback",
      "Generate AI lesson plans & assessments",
      "Monitor class rosters & student progress",
    ],
  },
  student: {
    label: "Enrolled Student",
    workspaceTitle: "Student Portal",
    workspaceHref: "/student",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    extraLabel: "Grade / Class & Roll Number",
    extraPlaceholder: "e.g. Grade 10 - Section A (CF-2026-088)",
    permissions: [
      "View class timetable & subject schedule",
      "Track homework & assignment deadlines",
      "Inspect official report card & teacher remarks",
      "Generate personalized AI study quizzes",
    ],
  },
  parent: {
    label: "Verified Guardian / Parent",
    workspaceTitle: "Parent Portal",
    workspaceHref: "/parent",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    extraLabel: "Enrolled Ward / Child's Name",
    extraPlaceholder: "e.g. Hamza Tariq (Grade 10)",
    permissions: [
      "Monitor child's real-time attendance records",
      "Pay monthly tuition fees via Pakistani bank channels",
      "Read official teacher evaluation remarks",
      "Submit formal student leave notices",
    ],
  },
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable Profile State
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [extraField, setExtraField] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security / Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadProfile = async () => {
      try {
        const res = await fetch("/api/auth/profile", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (isCancelled) return;

        if (res.ok && data?.success && data.profile) {
          setProfile(data.profile);
          setName(data.profile.name || "");
          setInstitution(data.profile.institution || "");
          setExtraField(data.profile.extraField || "");
        } else {
          toast.error(data?.error || "Unable to load profile details.");
        }
      } catch {
        if (!isCancelled) {
          toast.error("Unable to load profile details. Please refresh.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Please enter a valid full name (at least 2 characters).");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          institution: institution.trim(),
          extraField: extraField.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update profile details.");
        return;
      }

      setProfile(data.profile);
      setName(data.profile.name);
      setInstitution(data.profile.institution);
      setExtraField(data.profile.extraField || "");

      if (typeof window !== "undefined") {
        localStorage.setItem("campusflow_user_name", data.profile.name);
        localStorage.setItem("campusflow_institution", data.profile.institution);
        if (data.profile.role === "admin") {
          localStorage.setItem("campusflow_admin_name", data.profile.name);
        }
        window.dispatchEvent(new Event("campusflow_institution_updated"));
      }

      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Unable to reach the server. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

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
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
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

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Proceed with cleanup
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("campusflow_user_role");
      localStorage.removeItem("campusflow_user_name");
      localStorage.removeItem("campusflow_user_email");
      localStorage.removeItem("campusflow_institution");
      localStorage.removeItem("campusflow_admin_name");
      window.location.href = "/login";
    }
  };

  const roleMeta = profile ? ROLE_META[profile.role] || ROLE_META.admin : ROLE_META.admin;

  const initials =
    (profile?.name || name || "CF")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "CF";

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(iso));
    } catch {
      return "—";
    }
  };

  const hasProfileChanges =
    profile &&
    (name.trim() !== (profile.name || "") ||
      institution.trim() !== (profile.institution || "") ||
      extraField.trim() !== (profile.extraField || ""));

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 rounded-2xl border bg-card/70" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-80 rounded-2xl border bg-card/70" />
          <div className="lg:col-span-5 h-80 rounded-2xl border bg-card/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Account Profile &amp; Security
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            View your verified institutional identity, update personal details, and manage password security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-8.5 text-xs">
            <Link href={roleMeta.workspaceHref}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to {roleMeta.workspaceTitle}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Identity Overview Hero Card */}
      <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold shadow-sm shrink-0 ring-4 ring-primary/10">
              {initials}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                  {profile?.name || "Account User"}
                </h2>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleMeta.badgeClass}`}
                >
                  {roleMeta.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-primary/80 shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </span>
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{profile?.institution}</span>
                </span>
              </div>

              {profile?.extraField && (
                <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                  <Briefcase className="h-3 w-3 text-primary/70" />
                  <span className="font-medium text-foreground/80">
                    {roleMeta.extraLabel}:
                  </span>
                  <span>{profile.extraField}</span>
                </div>
              )}
            </div>
          </div>

          {/* Account Metadata Pills */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 shrink-0">
            {profile?.schoolCode && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(profile.schoolCode!);
                  toast.success(`Copied School Join Code: ${profile.schoolCode}`);
                }}
                title="Click to copy School Join Code"
                className="col-span-2 sm:col-span-1 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-left text-xs hover:bg-primary/10 transition-colors"
              >
                <div className="text-[10px] text-primary font-semibold flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  School Join Code
                  <Copy className="h-2.5 w-2.5 ml-auto opacity-70" />
                </div>
                <div className="font-mono text-xs font-bold text-foreground mt-0.5 tracking-wider">
                  {profile.schoolCode}
                </div>
              </button>
            )}

            <div className="rounded-xl border bg-muted/30 px-3 py-2 text-xs">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Member Since
              </div>
              <div className="font-semibold text-foreground mt-0.5">
                {formatDate(profile?.createdAt)}
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 px-3 py-2 text-xs">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last Updated
              </div>
              <div className="font-semibold text-foreground mt-0.5">
                {formatDate(profile?.updatedAt)}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl border bg-muted/30 px-3 py-2 text-xs">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Account ID
              </div>
              <div className="font-mono text-[11px] font-semibold text-foreground mt-0.5">
                {profile?.id ? `CF-${profile.id.slice(-8).toUpperCase()}` : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Edit Profile Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="h-8.5 w-8.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Personal &amp; Institutional Details
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Changes sync immediately across your workspace header and official records.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="profile-fullname"
                    className="block font-semibold mb-1 text-foreground"
                  >
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      id="profile-fullname"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full h-9 rounded-lg border bg-background pl-8.5 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="profile-email"
                    className="block font-semibold mb-1 text-foreground"
                  >
                    Verified Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      readOnly
                      value={profile?.email || ""}
                      className="w-full h-9 rounded-lg border bg-muted/60 pl-8.5 pr-3 text-xs text-muted-foreground outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="profile-institution"
                    className="block font-semibold mb-1 text-foreground"
                  >
                    Institution / School Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      id="profile-institution"
                      name="institution"
                      type="text"
                      autoComplete="organization"
                      readOnly={profile?.role !== "admin"}
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="St. Jude Collegiate Academy"
                      className={`w-full h-9 rounded-lg border pl-8.5 pr-3 text-xs outline-none ${
                        profile?.role !== "admin"
                          ? "bg-muted/60 text-muted-foreground cursor-not-allowed"
                          : "bg-background focus:ring-1 focus:ring-primary"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="profile-role-detail"
                    className="block font-semibold mb-1 text-foreground"
                  >
                    {roleMeta.extraLabel}
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      id="profile-role-detail"
                      name="extraField"
                      type="text"
                      autoComplete="off"
                      value={extraField}
                      onChange={(e) => setExtraField(e.target.value)}
                      placeholder={roleMeta.extraPlaceholder}
                      className="w-full h-9 rounded-lg border bg-background pl-8.5 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-[11px] text-muted-foreground">
                  Portal role:{" "}
                  <span className="font-semibold text-foreground uppercase">
                    {profile?.role}
                  </span>
                </p>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingProfile || !hasProfileChanges}
                  className="h-9 px-4"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Save Profile Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Workspace Access & Role Permissions Card */}
          <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Assigned Portal Capabilities ({roleMeta.workspaceTitle})
                </h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Active Access
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roleMeta.permissions.map((perm) => (
                <div
                  key={perm}
                  className="flex items-start gap-2 rounded-xl border bg-muted/20 p-3 text-xs"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-foreground/90 leading-snug">{perm}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Security & Password Update */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b">
              <div className="h-8.5 w-8.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Change Account Password
                </h3>
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
                    {showCurrentPw ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
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
                    {showNewPw ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
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
                      showConfirmPw
                        ? "Hide confirm new password"
                        : "Show confirm new password"
                    }
                  >
                    {showConfirmPw ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
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
                    <span className="text-destructive font-medium">
                      ✗ Passwords do not match
                    </span>
                  )}
                </div>
              )}

              <Button
                type="submit"
                size="sm"
                className="w-full h-9 mt-1"
                disabled={savingPassword}
              >
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
              <h3 className="text-xs font-bold text-foreground">
                Session &amp; Security Status
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your session is protected by a cryptographically signed{" "}
              <code className="font-mono text-[10px]">HttpOnly</code> cookie with live server-side verification.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full h-8.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Sign Out From This Device
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
