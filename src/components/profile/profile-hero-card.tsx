"use client";

import {
  Mail,
  Building,
  ShieldCheck,
  Calendar,
  Clock,
  BadgeCheck,
  KeyRound,
  Briefcase,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { formatReadableDate } from "@/lib/format";
import type { ProfileData, ProfileRoleMeta } from "./types";

interface ProfileHeroCardProps {
  profile: ProfileData | null;
  initials: string;
  roleMeta: ProfileRoleMeta;
}

export function ProfileHeroCard({ profile, initials, roleMeta }: ProfileHeroCardProps) {
  return (
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
                <span className="font-medium text-foreground/80">{roleMeta.extraLabel}:</span>
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
              {formatReadableDate(profile?.createdAt)}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 px-3 py-2 text-xs">
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last Updated
            </div>
            <div className="font-semibold text-foreground mt-0.5">
              {formatReadableDate(profile?.updatedAt)}
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
  );
}
