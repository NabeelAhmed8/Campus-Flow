"use client";

import { Award } from "lucide-react";
import { EXAM_TERM_LABELS } from "@/lib/constants";
import type { ExamTermKey } from "./types";

export interface NormalizedExamRecord {
  id?: string;
  _id?: string;
  subject: string;
  teacherName?: string;
  assessment?: string;
  term: string;
  examStatus: "present" | "absent";
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  resultStatus: string;
  grade: string;
}

interface ExamRecordsTableProps {
  records: NormalizedExamRecord[];
  selectedExamTerm: ExamTermKey;
  totalPossible: number;
  totalObtained: number;
  overallPct: number;
  overallGrade: string;
  overallVerdict: string;
}

export function ExamRecordsTable({
  records,
  selectedExamTerm,
  totalPossible,
  totalObtained,
  overallPct,
  overallGrade,
  overallVerdict,
}: ExamRecordsTableProps) {
  if (records.length === 0) {
    return (
      <div className="py-12 px-6 text-center text-xs text-muted-foreground space-y-2">
        <Award className="h-10 w-10 mx-auto text-muted-foreground/30" />
        <p className="font-semibold text-foreground text-sm">
          No records published for{" "}
          {selectedExamTerm === "all"
            ? "any examination term"
            : EXAM_TERM_LABELS[selectedExamTerm]}{" "}
          yet
        </p>
        <p className="max-w-md mx-auto">
          Once subject teachers enter marks or mark subject exam attendance (Present / Absent) in the Teacher Suite, your child&apos;s official subject-wise result card will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="py-3 px-4">Subject</th>
            {selectedExamTerm === "all" && <th className="py-3 px-4">Exam Term</th>}
            <th className="py-3 px-4">Exam Attendance</th>
            <th className="py-3 px-4 text-right">Total Marks</th>
            <th className="py-3 px-4 text-right">Obtained</th>
            <th className="py-3 px-4 text-right">Percentage</th>
            <th className="py-3 px-4 text-center">Grade</th>
            <th className="py-3 px-4 text-center">Pass / Fail</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {records.map((rec, idx) => {
            const isAbsent = rec.examStatus === "absent";
            const isPass = rec.resultStatus === "pass";
            return (
              <tr
                key={rec.id || rec._id || idx}
                className={`transition-colors ${
                  isAbsent ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/20"
                }`}
              >
                <td className="py-3 px-4">
                  <div className="font-semibold text-foreground">{rec.subject}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {rec.teacherName || "Subject Teacher"}
                  </div>
                </td>
                {selectedExamTerm === "all" && (
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {EXAM_TERM_LABELS[rec.term] || rec.assessment}
                    </span>
                  </td>
                )}
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isAbsent
                        ? "bg-destructive/15 text-destructive border border-destructive/25"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isAbsent ? "bg-destructive" : "bg-emerald-500"
                      }`}
                    />
                    {isAbsent ? "Absent" : "Present"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                  {rec.totalMarks}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                  {isAbsent ? <span className="text-destructive">AB</span> : rec.obtainedMarks}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold">
                  {isAbsent ? <span className="text-muted-foreground">—</span> : `${rec.percentage}%`}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block min-w-[28px] px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isAbsent || !isPass
                        ? "bg-destructive/10 text-destructive"
                        : rec.grade.startsWith("A")
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-sky-500/10 text-sky-600"
                    }`}
                  >
                    {rec.grade}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isPass
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
        <tfoot className="border-t-2 bg-muted/30 font-bold text-xs">
          <tr>
            <td colSpan={selectedExamTerm === "all" ? 3 : 2} className="py-3 px-4 text-foreground">
              Grand Total ({records.length} Subjects)
            </td>
            <td className="py-3 px-4 text-right font-mono">{totalPossible}</td>
            <td className="py-3 px-4 text-right font-mono text-primary">{totalObtained}</td>
            <td className="py-3 px-4 text-right font-mono text-primary">{overallPct}%</td>
            <td className="py-3 px-4 text-center">{overallGrade}</td>
            <td className="py-3 px-4 text-center">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  overallVerdict === "PASS"
                    ? "bg-emerald-600 text-white"
                    : "bg-destructive text-white"
                }`}
              >
                {overallVerdict}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
