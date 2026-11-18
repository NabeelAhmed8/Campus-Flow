"use client";

import { useState } from "react";
import { ShieldCheck, Users } from "lucide-react";
import { FacultyMemberCard } from "./faculty-member-card";
import type { AdminTeacher, ClassSectionCombo } from "./types";

interface FacultyTabProps {
  teachers: AdminTeacher[];
  schoolClassSectionCombos: ClassSectionCombo[];
  savingTeacherId: string | null;
  schoolCode: string;
  institutionName: string;
  onToggleRole: (teacherId: string, targetRole: "teacher" | "coordinator") => void;
  onSaveAssignments: (
    teacherId: string,
    nextAssignments: Array<{ grade: string; section: string }>
  ) => void;
}

export function FacultyTab({
  teachers,
  schoolClassSectionCombos,
  savingTeacherId,
  schoolCode,
  institutionName,
  onToggleRole,
  onSaveAssignments,
}: FacultyTabProps) {
  const [teacherAssignDraft, setTeacherAssignDraft] = useState<
    Record<string, { grade: string; section: string }>
  >({});

  return (
    <div id="faculty" className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Faculty Class &amp; Section Permissions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assign specific classes and sections to each teacher. Teachers can only view, grade, and mark attendance for their assigned sections.
          </p>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary self-start sm:self-auto">
          {teachers.length} Registered {teachers.length === 1 ? "Teacher" : "Teachers"}
        </span>
      </div>

      {teachers.length > 0 ? (
        <div className="space-y-4">
          {teachers.map((teacher) => {
            const draft = teacherAssignDraft[teacher.id] || {
              grade: schoolClassSectionCombos[0]?.grade || "Grade 9",
              section: schoolClassSectionCombos[0]?.section || "A",
            };
            return (
              <FacultyMemberCard
                key={teacher.id}
                teacher={teacher}
                draft={draft}
                schoolClassSectionCombos={schoolClassSectionCombos}
                isSaving={savingTeacherId === teacher.id}
                onDraftChange={(next) =>
                  setTeacherAssignDraft((prev) => ({ ...prev, [teacher.id]: next }))
                }
                onToggleRole={onToggleRole}
                onSaveAssignments={onSaveAssignments}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-12 px-4 text-center rounded-xl border border-dashed text-xs text-muted-foreground space-y-2">
          <Users className="h-9 w-9 mx-auto text-muted-foreground/30" />
          <p className="font-semibold text-foreground text-sm">No Teachers Registered Yet</p>
          <p className="max-w-md mx-auto">
            Share your School Join Code{" "}
            {schoolCode ? (
              <code className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                {schoolCode}
              </code>
            ) : null}{" "}
            with your teachers so they can sign up under {institutionName}. Once registered, you can assign specific classes &amp; sections to each teacher here.
          </p>
        </div>
      )}
    </div>
  );
}
