"use client";

import { useState } from "react";
import { ShieldCheck, Users, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { GRADE_OPTIONS } from "@/lib/constants";
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
            const assigned: Array<{ grade: string; section: string }> = Array.isArray(
              teacher.assignedClasses
            )
              ? teacher.assignedClasses
              : [];
            const isSaving = savingTeacherId === teacher.id;

            return (
              <div
                key={teacher.id}
                className="rounded-xl border bg-muted/15 p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">{teacher.name}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          teacher.role === "coordinator"
                            ? "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {teacher.role === "coordinator" ? "Academic Coordinator" : "Faculty Teacher"}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {teacher.subject}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{teacher.email}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                    {teacher.role === "coordinator" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={isSaving}
                        onClick={() => onToggleRole(teacher.id, "teacher")}
                        className="h-7 text-[11px] border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                      >
                        Demote to Teacher
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={isSaving}
                        onClick={() => onToggleRole(teacher.id, "coordinator")}
                        className="h-7 text-[11px] border-violet-500/40 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10"
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Promote to Coordinator
                      </Button>
                    )}

                    {teacher.role !== "coordinator" && (
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                          assigned.length > 0
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {assigned.length > 0
                          ? `${assigned.length} ${assigned.length === 1 ? "Section" : "Sections"} Assigned`
                          : "No Sections Assigned"}
                      </span>
                    )}
                  </div>
                </div>

                {teacher.role === "coordinator" ? (
                  <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-3.5 py-2.5 text-xs text-muted-foreground flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">
                        Dedicated Coordinator Portal Active (coordinator)
                      </span>
                      <p className="text-[11px] mt-0.5">
                        Authorized to record daily faculty attendance &amp; substitutions, schedule class timetables, manage term syllabus tracking, and publish exam date sheets &amp; campus circulars.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Current Assigned Class + Section Chips */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-foreground block">
                        Authorized Classes &amp; Sections:
                      </span>
                      {assigned.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {assigned.map((item) => (
                            <span
                              key={`${item.grade}-${item.section}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-background text-xs font-semibold text-foreground shadow-2xs"
                            >
                              <span>
                                {item.grade} • Section {item.section}
                              </span>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => {
                                  const filtered = assigned.filter(
                                    (a) =>
                                      !(
                                        a.grade.toLowerCase() === item.grade.toLowerCase() &&
                                        a.section.toLowerCase() === item.section.toLowerCase()
                                      )
                                  );
                                  onSaveAssignments(teacher.id, filtered);
                                }}
                                className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded"
                                title="Remove section permission"
                                aria-label={`Remove ${item.grade} Section ${item.section}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          This teacher currently has no access to student records. Assign at least one class &amp; section below.
                        </p>
                      )}
                    </div>

                    {/* Quick Assign from School's Existing Enrolled Sections */}
                    {schoolClassSectionCombos.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Quick Assign From Enrolled Sections:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {schoolClassSectionCombos.map((combo) => {
                            const alreadyAssigned = assigned.some(
                              (a) =>
                                a.grade.toLowerCase() === combo.grade.toLowerCase() &&
                                a.section.toLowerCase() === combo.section.toLowerCase()
                            );
                            return (
                              <button
                                key={`${combo.grade}-${combo.section}`}
                                type="button"
                                disabled={isSaving || alreadyAssigned}
                                onClick={() =>
                                  onSaveAssignments(teacher.id, [
                                    ...assigned,
                                    { grade: combo.grade, section: combo.section },
                                  ])
                                }
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                                  alreadyAssigned
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 cursor-default"
                                    : "bg-background hover:border-primary hover:text-primary"
                                }`}
                              >
                                {alreadyAssigned ? "✓ " : "+ "}
                                {combo.grade} - Sec {combo.section} ({combo.count})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Manual Custom Class + Section Assignment Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1 items-end text-xs">
                      <div className="sm:col-span-5">
                        <label
                          htmlFor={`assign-grade-${teacher.id}`}
                          className="block text-[11px] font-semibold mb-1 text-foreground"
                        >
                          Class / Grade
                        </label>
                        <CustomSelect
                          value={draft.grade}
                          onChange={(val) =>
                            setTeacherAssignDraft((prev) => ({
                              ...prev,
                              [teacher.id]: { ...draft, grade: val },
                            }))
                          }
                          options={[...GRADE_OPTIONS]}
                          size="sm"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label
                          htmlFor={`assign-section-${teacher.id}`}
                          className="block text-[11px] font-semibold mb-1 text-foreground"
                        >
                          Section Name
                        </label>
                        <input
                          id={`assign-section-${teacher.id}`}
                          name={`assignSection_${teacher.id}`}
                          type="text"
                          autoComplete="off"
                          value={draft.section}
                          onChange={(e) =>
                            setTeacherAssignDraft((prev) => ({
                              ...prev,
                              [teacher.id]: { ...draft, section: e.target.value },
                            }))
                          }
                          placeholder="e.g. A, B, Iqbal, Jinnah"
                          className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSaving || !draft.section.trim()}
                          onClick={() => {
                            const sec = draft.section.trim();
                            if (!sec) return;
                            onSaveAssignments(teacher.id, [
                              ...assigned,
                              { grade: draft.grade, section: sec },
                            ]);
                          }}
                          className="w-full h-8.5 text-xs"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          {isSaving ? "Saving..." : "Assign Section"}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
