"use client";

import { User, Mail, Building, Briefcase, Save, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProfileData, ProfileRoleMeta } from "./types";

interface ProfileDetailsCardProps {
  profile: ProfileData | null;
  roleMeta: ProfileRoleMeta;
  name: string;
  institution: string;
  extraField: string;
  savingProfile: boolean;
  hasProfileChanges: boolean;
  onNameChange: (val: string) => void;
  onInstitutionChange: (val: string) => void;
  onExtraFieldChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProfileDetailsCard({
  profile,
  roleMeta,
  name,
  institution,
  extraField,
  savingProfile,
  hasProfileChanges,
  onNameChange,
  onInstitutionChange,
  onExtraFieldChange,
  onSubmit,
}: ProfileDetailsCardProps) {
  return (
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

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="profile-fullname" className="block font-semibold mb-1 text-foreground">
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
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full h-9 rounded-lg border bg-background pl-8.5 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-email" className="block font-semibold mb-1 text-foreground">
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
                  onChange={(e) => onInstitutionChange(e.target.value)}
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
                  onChange={(e) => onExtraFieldChange(e.target.value)}
                  placeholder={roleMeta.extraPlaceholder}
                  className="w-full h-9 rounded-lg border bg-background pl-8.5 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-[11px] text-muted-foreground">
              Portal role:{" "}
              <span className="font-semibold text-foreground uppercase">{profile?.role}</span>
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
  );
}
