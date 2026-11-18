"use client";

import { Users } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import type { AttendanceDraft, FacultyMember, FacultyStatus } from "./types";

interface FacultyAttendanceRosterProps {
  faculty: FacultyMember[];
  isLoadingFaculty: boolean;
  attendanceMap: Record<string, AttendanceDraft>;
  onUpdateDraft: (teacherId: string, draft: AttendanceDraft) => void;
}

const STATUS_OPTIONS = [
  { key: "present", label: "Present", active: "bg-emerald-600 text-white border-emerald-600" },
  { key: "absent", label: "Absent", active: "bg-rose-600 text-white border-rose-600" },
  { key: "late", label: "Late", active: "bg-amber-500 text-white border-amber-500" },
  { key: "leave", label: "On Leave", active: "bg-sky-600 text-white border-sky-600" },
] as const;

export function FacultyAttendanceRoster({
  faculty,
  isLoadingFaculty,
  attendanceMap,
  onUpdateDraft,
}: FacultyAttendanceRosterProps) {
  if (isLoadingFaculty) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        Loading campus faculty roster...
      </div>
    );
  }

  if (faculty.length === 0) {
    return (
      <div className="py-12 px-4 text-center rounded-xl border border-dashed text-xs text-muted-foreground space-y-1.5">
        <Users className="h-8 w-8 mx-auto text-muted-foreground/40" />
        <p className="font-semibold text-foreground text-sm">
          No Faculty Members Registered Yet
        </p>
        <p>
          Once teachers sign up with your school join code, they will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {faculty.map((member) => {
        const draft: AttendanceDraft = attendanceMap[member.id] || {
          status: "present" as FacultyStatus,
          substituteTeacher: "",
          remarks: "",
          saved: false,
        };
        const needsSub = draft.status !== "present";
        const otherTeachers = faculty.filter((f) => f.id !== member.id);

        return (
          <div key={member.id} className="rounded-xl border bg-muted/15 p-4 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-sm text-foreground truncate">{member.name}</p>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      member.role === "coordinator"
                        ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30"
                        : "bg-primary/10 text-primary border-primary/20"
                    }`}
                  >
                    {member.role === "coordinator" ? "Coordinator" : "Teacher"}
                  </span>
                  {draft.saved && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      Recorded
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {member.subject} • {member.email}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 shrink-0">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      onUpdateDraft(member.id, {
                        ...draft,
                        status: opt.key,
                        substituteTeacher: opt.key === "present" ? "" : draft.substituteTeacher,
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      draft.status === opt.key
                        ? opt.active
                        : "bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {needsSub && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dashed">
                <div>
                  <label
                    htmlFor={`sub-teacher-${member.id}`}
                    className="block text-[11px] font-semibold text-foreground mb-1"
                  >
                    Substitute / Arrangement Teacher
                  </label>
                  <CustomSelect
                    id={`sub-teacher-${member.id}`}
                    name={`substituteTeacher_${member.id}`}
                    value={draft.substituteTeacher}
                    onChange={(val) =>
                      onUpdateDraft(member.id, { ...draft, substituteTeacher: val })
                    }
                    options={[
                      { value: "", label: "No Substitute Assigned" },
                      ...otherTeachers.map((t) => ({
                        value: t.name,
                        label: t.name,
                        sublabel: t.subject,
                        badge: t.role === "coordinator" ? "Coordinator" : "Teacher",
                      })),
                    ]}
                    placeholder="Select arrangement teacher..."
                    searchable={otherTeachers.length > 4}
                    size="sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`remarks-${member.id}`}
                    className="block text-[11px] font-semibold text-foreground mb-1"
                  >
                    Coordinator Remarks / Reason
                  </label>
                  <input
                    id={`remarks-${member.id}`}
                    name={`remarks_${member.id}`}
                    type="text"
                    autoComplete="off"
                    value={draft.remarks}
                    onChange={(e) =>
                      onUpdateDraft(member.id, { ...draft, remarks: e.target.value })
                    }
                    placeholder="e.g. Medical leave, arrived 15 mins late..."
                    className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
