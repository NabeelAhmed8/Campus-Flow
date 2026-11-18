"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PROFILE_ROLE_META, type ProfileData } from "@/components/profile/types";
import { ProfileHeroCard } from "@/components/profile/profile-hero-card";
import { ProfileDetailsCard } from "@/components/profile/profile-details-card";
import { PasswordSecurityCard } from "@/components/profile/password-security-card";

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [extraField, setExtraField] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

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

  const roleMeta = profile
    ? PROFILE_ROLE_META[profile.role] || PROFILE_ROLE_META.admin
    : PROFILE_ROLE_META.admin;

  const initials =
    (profile?.name || name || "CF")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "CF";

  const hasProfileChanges = Boolean(
    profile &&
      (name.trim() !== (profile.name || "") ||
        institution.trim() !== (profile.institution || "") ||
        extraField.trim() !== (profile.extraField || ""))
  );

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

      <ProfileHeroCard profile={profile} initials={initials} roleMeta={roleMeta} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ProfileDetailsCard
          profile={profile}
          roleMeta={roleMeta}
          name={name}
          institution={institution}
          extraField={extraField}
          savingProfile={savingProfile}
          hasProfileChanges={hasProfileChanges}
          onNameChange={setName}
          onInstitutionChange={setInstitution}
          onExtraFieldChange={setExtraField}
          onSubmit={handleSaveProfile}
        />

        <PasswordSecurityCard onSignOut={handleSignOut} />
      </div>
    </div>
  );
}
