"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { EXAM_TERM_LABELS, EXAM_TERM_OPTIONS } from "@/lib/constants";
import { calculateAcademicStanding, percentageToLetterGrade } from "@/lib/academics";
import type { AcademicRecordItem, StudentDomainRecord } from "@/lib/domain-types";

interface StudentGradesTabProps {
  student: StudentDomainRecord;
}

export function StudentGradesTab({ student }: StudentGradesTabProps) {
  const [termFilter, setTermFilter] = useState("all");

  const allRecords: AcademicRecordItem[] = Array.isArray(student.academicRecords)
    ? student.academicRecords
    : [];
  const filteredRecords =
    termFilter === "all"
      ? allRecords
      : allRecords.filter((rec) => (rec.term || "first_term") === termFilter);

  const standing = calculateAcademicStanding(filteredRecords);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold tracking-tight text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Official Academic Term Report Card
            </h3>
            <p className="text-xs text-muted-foreground">
              Live verified exam marks and teacher evaluations for {student.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-48">
              <CustomSelect
                value={termFilter}
                onChange={setTermFilter}
                options={[
                  { value: "all", label: "All Terms Combined", badge: `${allRecords.length}` },
                  ...EXAM_TERM_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                    badge: `${allRecords.filter((r) => (r.term || "first_term") === o.value).length}`,
                  })),
                ]}
                size="sm"
              />
            </div>

            {standing.hasRecords && (
              <div
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${standing.passed
                  ? "text-emerald-600 bg-emerald-500/10"
                  : "text-destructive bg-destructive/10"
                  }`}
              >
                {standing.overallPct}% • Grade {standing.letterGrade} (
                {standing.passed ? "Passed" : "Needs Attention"})
              </div>
            )}
          </div>
        </div>

        {filteredRecords.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Term</th>
                    <th className="py-3 px-4">Marks</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Performance Bar</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.map((rec, idx) => {
                    const isAbsent = rec.examStatus === "absent";
                    const total = Number(rec.totalMarks || 100);
                    const obtained = isAbsent ? 0 : Number(rec.obtainedMarks || 0);
                    const pct = isAbsent
                      ? 0
                      : Number(rec.percentage ?? (total > 0 ? Math.round((obtained / total) * 100) : 0));
                    const grade = isAbsent ? "AB" : rec.grade || percentageToLetterGrade(pct);
                    const isPass =
                      !isAbsent &&
                      (rec.resultStatus ? rec.resultStatus === "pass" : pct >= 40);

                    return (
                      <tr key={rec.id || idx} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground">{rec.subject}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {rec.teacherName || "Subject Teacher"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {EXAM_TERM_LABELS[rec.term || "first_term"] || rec.assessment}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                          {isAbsent ? `AB / ${total}` : `${obtained} / ${total}`}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          {isAbsent ? "—" : `${pct}%`}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-bold ${isAbsent || !isPass ? "text-destructive" : "text-primary"
                              }`}
                          >
                            {grade}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 w-44">
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isAbsent || !isPass ? "bg-destructive" : "bg-primary"
                                }`}
                              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isPass
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-destructive/15 text-destructive"
                              }`}
                          >
                            {isAbsent ? "ABSENT" : isPass ? "PASS" : "FAIL"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Teacher Formative Evaluations & Remarks */}
            <div className="border-t p-4 sm:p-5 bg-muted/5 space-y-3">
              <h4 className="font-semibold text-xs text-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Teacher Formative Evaluations &amp; Remarks
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRecords.map((rec, i) => {
                  const isAbsent = rec.examStatus === "absent";
                  const isPass =
                    !isAbsent &&
                    (rec.resultStatus
                      ? rec.resultStatus === "pass"
                      : Number(rec.percentage || 0) >= 40);
                  return (
                    <div key={rec.id || i} className="p-3.5 rounded-xl border bg-card space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-foreground">{rec.subject}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${isAbsent
                              ? "bg-destructive/15 text-destructive"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              }`}
                          >
                            {isAbsent ? "Absent" : "Present"}
                          </span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${isPass ? "bg-emerald-600 text-white" : "bg-destructive text-white"
                            }`}
                        >
                          {isAbsent ? "ABSENT" : isPass ? "PASS" : "FAIL"}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{rec.assessment}</div>
                      <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-lg border italic">
                        &quot;{rec.feedback || "No additional remarks added."}&quot;
                      </p>
                      <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1">
                        <span>Evaluator: {rec.teacherName || "Faculty Instructor"}</span>
                        <span>
                          {rec.recordedAt ? new Date(rec.recordedAt).toLocaleDateString() : "Recent"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 px-6 text-center text-xs text-muted-foreground space-y-2">
            <Award className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="font-semibold text-foreground text-sm">No Exam Marks Published Yet</p>
            <p className="max-w-md mx-auto">
              Once your teachers record term exam marks and feedback in the Teacher Gradebook, your official report card, GPA, and subject bars will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
