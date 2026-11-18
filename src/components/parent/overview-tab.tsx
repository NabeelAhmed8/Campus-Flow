"use client";

import { CalendarCheck, Award, Receipt, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateAcademicStanding } from "@/lib/academics";
import { getInitials } from "@/lib/format";
import type {
  AttendanceStatsRecord,
  FeeDomainRecord,
  StudentDomainRecord,
} from "@/lib/domain-types";
import type { ParentTab } from "./types";

interface ParentOverviewTabProps {
  student: StudentDomainRecord;
  feeRecord: FeeDomainRecord | null;
  attendanceStats: AttendanceStatsRecord | null;
  onSwitchTab: (tab: ParentTab) => void;
}

export function ParentOverviewTab({
  student,
  feeRecord,
  attendanceStats,
  onSwitchTab,
}: ParentOverviewTabProps) {
  const standing = calculateAcademicStanding(student.academicRecords);
  const feeLabel =
    feeRecord?.status === "pending_verification"
      ? "Verifying"
      : feeRecord?.status || "Pending";

  return (
    <div className="space-y-6">
      {/* Child Summary Hero Card */}
      <div
        id="overview"
        className="rounded-2xl border bg-card p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 scroll-mt-20"
      >
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase">
            {getInitials(student.name, "ST")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-semibold">
                Enrolled Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Roll No:{" "}
              <span className="font-mono font-medium text-foreground">{student.rollNumber}</span> •{" "}
              {student.grade} - {student.section}
            </p>
            <p className="text-xs text-muted-foreground">
              Guardian: {student.guardianName || "Registered Guardian"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-xs text-muted-foreground block">Term Attendance</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-lg font-bold">
                {attendanceStats && (attendanceStats.total ?? 0) > 0
                  ? `${attendanceStats.attendancePercentage ?? 0}%`
                  : "—"}
              </span>
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Academic Standing</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold">
                {standing.hasRecords
                  ? `Grade ${standing.letterGrade} (${standing.overallPct}%)`
                  : "Pending"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Jump Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Fee Clearance
            </span>
            <Receipt className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-foreground">
              Rs. {Number(feeRecord?.amount || student.monthlyFee || 0).toLocaleString()}
            </span>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${feeRecord?.status === "paid"
                ? "bg-emerald-500/10 text-emerald-600"
                : feeRecord?.status === "pending_verification"
                  ? "bg-sky-500/10 text-sky-600"
                  : "bg-amber-500/10 text-amber-600"
                }`}
            >
              {feeLabel}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => onSwitchTab("fees")}
          >
            View Voucher & Pay →
          </Button>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Teacher Assessment
            </span>
            <Bell className="h-4 w-4 text-sky-600" />
          </div>
          <div>
            <span className="text-lg font-bold text-foreground">
              {Array.isArray(student.academicRecords) ? student.academicRecords.length : 0} Remarks
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {student.academicRecords?.[0]?.feedback
                ? `"${student.academicRecords[0].feedback}"`
                : "No teacher evaluations posted yet"}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => onSwitchTab("remarks")}
          >
            Read All Feedback →
          </Button>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Attendance Registry
            </span>
            <CalendarCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <span className="text-lg font-bold text-foreground">
              {attendanceStats?.present ?? 0} Days Present
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Need time off? Submit a real leave notice
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => onSwitchTab("leave")}
          >
            Apply for Absence Leave →
          </Button>
        </div>
      </div>
    </div>
  );
}
