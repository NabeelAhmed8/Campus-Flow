"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import { EXAM_TERM_LABELS, EXAM_TERM_OPTIONS } from "@/lib/constants";
import { percentageToLetterGrade } from "@/lib/academics";
import type { AcademicRecordItem, StudentDomainRecord } from "@/lib/domain-types";
import { ExamRecordsTable, type NormalizedExamRecord } from "./exam-records-table";
import type { ExamTermKey } from "./types";

interface ParentExamResultsTabProps {
  student: StudentDomainRecord;
}

const TERM_DEFS: Array<{ key: ExamTermKey; label: string; shortLabel: string }> = [
  ...EXAM_TERM_OPTIONS.filter((o) => o.value !== "class_test").map((o) => ({
    key: o.value as ExamTermKey,
    label: o.label,
    shortLabel: o.shortLabel,
  })),
  { key: "all", label: "All Exams Summary", shortLabel: "All Terms" },
];

function normalizeRecord(rec: AcademicRecordItem): NormalizedExamRecord {
  const examStatus = rec.examStatus === "absent" ? "absent" : "present";
  const total = Number(rec.totalMarks || 100);
  const obtained = examStatus === "absent" ? 0 : Number(rec.obtainedMarks ?? rec.marksObtained ?? 0);
  const pct =
    examStatus === "absent" ? 0 : Number(rec.percentage ?? Math.round((obtained / total) * 100));
  const resultStatus =
    rec.resultStatus || (examStatus === "absent" ? "absent" : pct >= 40 ? "pass" : "fail");
  const grade = examStatus === "absent" ? "AB" : rec.grade || percentageToLetterGrade(pct);
  const term = rec.term || "first_term";
  return {
    id: rec.id,
    _id: rec._id,
    subject: rec.subject,
    teacherName: rec.teacherName,
    assessment: rec.assessment,
    term,
    examStatus,
    totalMarks: total,
    obtainedMarks: obtained,
    percentage: pct,
    resultStatus,
    grade,
  };
}

export function ParentExamResultsTab({ student }: ParentExamResultsTabProps) {
  const [selectedExamTerm, setSelectedExamTerm] = useState<ExamTermKey>("first_term");

  const allRecords = Array.isArray(student.academicRecords) ? student.academicRecords : [];
  const normalizedAll = allRecords.map(normalizeRecord);

  const filteredRecs =
    selectedExamTerm === "all"
      ? normalizedAll
      : normalizedAll.filter((r) => r.term === selectedExamTerm);

  const totalPossible = filteredRecs.reduce((acc, r) => acc + r.totalMarks, 0);
  const totalObtained = filteredRecs.reduce((acc, r) => acc + r.obtainedMarks, 0);
  const overallPct = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

  const presentSubjects = filteredRecs.filter((r) => r.examStatus === "present");
  const absentSubjects = filteredRecs.filter((r) => r.examStatus === "absent");
  const failedSubjects = filteredRecs.filter((r) => r.resultStatus === "fail");

  const allAbsent = filteredRecs.length > 0 && absentSubjects.length === filteredRecs.length;
  const overallGrade =
    filteredRecs.length === 0 ? "—" : allAbsent ? "AB" : percentageToLetterGrade(overallPct);

  const overallVerdict =
    filteredRecs.length === 0
      ? "PENDING"
      : allAbsent
        ? "ABSENT"
        : absentSubjects.length > 0 || failedSubjects.length > 0 || overallPct < 40
          ? "FAIL"
          : "PASS";

  const getTermStats = (tk: string) => {
    const recs = normalizedAll.filter((r) => r.term === tk);
    if (recs.length === 0) return null;
    const tot = recs.reduce((a, r) => a + r.totalMarks, 0);
    const obt = recs.reduce((a, r) => a + r.obtainedMarks, 0);
    const abs = recs.filter((r) => r.examStatus === "absent").length;
    const fail = recs.filter((r) => r.resultStatus === "fail").length;
    const pct = tot > 0 ? Math.round((obt / tot) * 100) : 0;
    return {
      count: recs.length,
      pct,
      absentCount: abs,
      passed: abs === 0 && fail === 0 && pct >= 40,
    };
  };

  return (
    <div id="results" className="space-y-5 scroll-mt-20">
      {/* 3-Term Progress Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {(["first_term", "mid_term", "final_term"] as const).map((tk) => {
          const stats = getTermStats(tk);
          const isSelected = selectedExamTerm === tk;
          return (
            <button
              key={tk}
              type="button"
              onClick={() => setSelectedExamTerm(tk)}
              className={`text-left rounded-2xl border p-4 transition-all ${isSelected
                ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                : "bg-card hover:bg-muted/30"
                }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground">{EXAM_TERM_LABELS[tk]}</span>
                {stats ? (
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${stats.passed
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-destructive/15 text-destructive"
                      }`}
                  >
                    {stats.passed ? "PASS" : "FAIL"}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Not Posted
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-foreground">
                  {stats ? `${stats.pct}%` : "—"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {stats
                    ? `${stats.count} ${stats.count === 1 ? "subject" : "subjects"}${stats.absentCount > 0 ? ` • ${stats.absentCount} AB` : ""
                    }`
                    : "Awaiting exam marks"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Report Card Container */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b bg-muted/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Official Student Examination Result Card
                </h3>
                <p className="text-xs text-muted-foreground">
                  {student.name} • {student.grade} ({student.section}) • Roll #{student.rollNumber}
                </p>
              </div>
            </div>

            {filteredRecs.length > 0 && (
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${overallVerdict === "PASS"
                    ? "bg-emerald-600 text-white"
                    : "bg-destructive text-white"
                    }`}
                >
                  Result: {overallVerdict}
                </span>
              </div>
            )}
          </div>

          {/* Term Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {TERM_DEFS.map((td) => {
              const count =
                td.key === "all"
                  ? normalizedAll.length
                  : normalizedAll.filter((r) => r.term === td.key).length;
              const active = selectedExamTerm === td.key;
              return (
                <button
                  key={td.key}
                  type="button"
                  onClick={() => setSelectedExamTerm(td.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 border ${active
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                    : "bg-background text-muted-foreground hover:text-foreground border-border"
                    }`}
                >
                  <span>{td.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Summary Metrics Strip */}
          {filteredRecs.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div className="rounded-xl border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Exam Attendance
                </div>
                <div className="text-sm font-bold text-foreground mt-0.5">
                  {allAbsent
                    ? "Absent (All Papers)"
                    : absentSubjects.length === 0
                      ? `Present (${presentSubjects.length}/${filteredRecs.length})`
                      : `${presentSubjects.length} Present • ${absentSubjects.length} Absent`}
                </div>
                {absentSubjects.length > 0 && (
                  <p className="text-[10px] text-destructive font-medium mt-0.5 truncate">
                    Absent in: {absentSubjects.map((s) => s.subject).join(", ")}
                  </p>
                )}
              </div>

              <div className="rounded-xl border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Marks Obtained
                </div>
                <div className="text-sm font-bold text-foreground mt-0.5 font-mono">
                  {totalObtained} / {totalPossible}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Passing criteria: 40% per subject
                </p>
              </div>

              <div className="rounded-xl border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Overall Percentage
                </div>
                <div className="text-sm font-bold text-primary mt-0.5">
                  {overallPct}% • Grade {overallGrade}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {filteredRecs.length} {filteredRecs.length === 1 ? "subject" : "subjects"} evaluated
                </p>
              </div>

              <div className="rounded-xl border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Final Status
                </div>
                <div
                  className={`text-sm font-bold mt-0.5 ${overallVerdict === "PASS"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                    }`}
                >
                  {overallVerdict === "PASS"
                    ? "Passed & Cleared"
                    : overallVerdict === "ABSENT"
                      ? "Absent in Examination"
                      : `Failed (${failedSubjects.length + absentSubjects.length} paper${failedSubjects.length + absentSubjects.length === 1 ? "" : "s"
                      })`}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {selectedExamTerm === "all"
                    ? "Combined Academic Standing"
                    : EXAM_TERM_LABELS[selectedExamTerm]}
                </p>
              </div>
            </div>
          )}
        </div>

        <ExamRecordsTable
          records={filteredRecs}
          selectedExamTerm={selectedExamTerm}
          totalPossible={totalPossible}
          totalObtained={totalObtained}
          overallPct={overallPct}
          overallGrade={overallGrade}
          overallVerdict={overallVerdict}
        />
      </div>
    </div>
  );
}
