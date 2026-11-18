"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  CalendarCheck,
  Check,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { toIsoDate } from "@/lib/format";
import { FacultyAttendanceRoster } from "./faculty-attendance-roster";
import { AttendanceDraft, FacultyMember, FacultyStatus } from "./types";

interface FacultyAttendanceTabProps {
  faculty: FacultyMember[];
  isLoadingFaculty: boolean;
}

export function FacultyAttendanceTab({
  faculty,
  isLoadingFaculty,
}: FacultyAttendanceTabProps) {
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceDraft>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAttendanceDate(toIsoDate());
  }, []);

  const fetchAttendanceForDate = useCallback(
    async (dateStr: string, staffList: FacultyMember[]) => {
      if (!dateStr) return;
      try {
        const res = await fetch(
          `/api/coordinator/teacher-attendance?date=${encodeURIComponent(dateStr)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        const savedByTeacherId = new Map<
          string,
          { status: FacultyStatus; substituteTeacher: string; remarks: string }
        >();

        if (res.ok && Array.isArray(data.records)) {
          for (const rec of data.records) {
            if (rec.teacherId) {
              savedByTeacherId.set(String(rec.teacherId), {
                status: (rec.status as FacultyStatus) || "present",
                substituteTeacher: rec.substituteTeacher || "",
                remarks: rec.remarks || "",
              });
            }
          }
        }

        const nextMap: Record<string, AttendanceDraft> = {};
        for (const member of staffList) {
          const existing = savedByTeacherId.get(member.id);
          nextMap[member.id] = existing
            ? { ...existing, saved: true }
            : {
                status: "present",
                substituteTeacher: "",
                remarks: "",
                saved: false,
              };
        }
        setAttendanceMap(nextMap);
      } catch {
        toast.error("Could not load faculty attendance records.");
      }
    },
    []
  );

  useEffect(() => {
    if (attendanceDate && faculty.length > 0) {
      fetchAttendanceForDate(attendanceDate, faculty);
    }
  }, [attendanceDate, faculty, fetchAttendanceForDate]);

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let substitutes = 0;
    for (const member of faculty) {
      const rec = attendanceMap[member.id];
      const status = rec?.status || "present";
      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "late") late++;
      else if (status === "leave") leave++;
      if (rec?.substituteTeacher?.trim()) substitutes++;
    }
    return { total: faculty.length, present, absent, late, leave, substitutes };
  }, [faculty, attendanceMap]);

  const handleMarkAllPresent = () => {
    setAttendanceMap((prev) => {
      const next: Record<string, AttendanceDraft> = {};
      for (const member of faculty) {
        next[member.id] = {
          ...(prev[member.id] || { substituteTeacher: "", remarks: "" }),
          status: "present",
          substituteTeacher: "",
        };
      }
      return next;
    });
    toast.info("All faculty members marked Present. Click Save to record.");
  };

  const handleUpdateDraft = (teacherId: string, draft: AttendanceDraft) => {
    setAttendanceMap((prev) => ({ ...prev, [teacherId]: draft }));
  };

  const handleSave = async () => {
    if (!attendanceDate || faculty.length === 0) return;
    setIsSaving(true);
    try {
      const records = faculty.map((member) => {
        const draft = attendanceMap[member.id] || {
          status: "present" as FacultyStatus,
          substituteTeacher: "",
          remarks: "",
        };
        return {
          teacherId: member.id,
          status: draft.status,
          substituteTeacher: draft.substituteTeacher,
          remarks: draft.remarks,
        };
      });

      const res = await fetch("/api/coordinator/teacher-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: attendanceDate, records }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save faculty attendance.");
        return;
      }

      toast.success(data.message || "Daily faculty attendance saved.");
      await fetchAttendanceForDate(attendanceDate, faculty);
    } catch {
      toast.error("Network error while saving faculty attendance.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Faculty</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mt-1.5">{stats.total}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Registered teaching staff
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Present Today</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-1.5 text-emerald-600 dark:text-emerald-400">
            {stats.present}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            On duty in campus
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Absent / Leave / Late</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-1.5 text-amber-600 dark:text-amber-400">
            {stats.absent + stats.leave + stats.late}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {stats.absent} absent • {stats.leave} leave • {stats.late} late
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Substitutions Set</span>
            <UserCheck className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-2xl font-bold mt-1.5 text-violet-600 dark:text-violet-400">
            {stats.substitutes}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Arrangement teachers assigned
          </p>
        </div>
      </div>

      {/* Register Card */}
      <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              Daily Faculty Attendance &amp; Arrangement Register
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mark daily teacher attendance and immediately assign a substitute teacher if anyone is absent or on leave.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="faculty-attendance-date"
                className="text-xs font-semibold text-muted-foreground shrink-0"
              >
                Date:
              </label>
              <div className="w-40">
                <CustomDatePicker
                  id="faculty-attendance-date"
                  name="attendanceDate"
                  value={attendanceDate}
                  onChange={setAttendanceDate}
                  placeholder="Select date"
                  size="default"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              disabled={faculty.length === 0}
              className="h-9 text-xs"
            >
              <Check className="mr-1 h-3.5 w-3.5" />
              Mark All Present
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || faculty.length === 0 || !attendanceDate}
              className="h-9 text-xs"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {isSaving ? "Saving..." : "Save Daily Attendance"}
            </Button>
          </div>
        </div>

        <FacultyAttendanceRoster
          faculty={faculty}
          isLoadingFaculty={isLoadingFaculty}
          attendanceMap={attendanceMap}
          onUpdateDraft={handleUpdateDraft}
        />
      </div>
    </div>
  );
}
