import type { AcademicRecordItem } from "@/lib/domain-types";

export interface AcademicStandingSummary {
  hasRecords: boolean;
  totalSubjects: number;
  overallPct: number | null;
  letterGrade: string;
  gpa: string;
  passed: boolean | null;
}

export function percentageToLetterGrade(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

export function percentageToGpa(pct: number): number {
  if (pct >= 90) return 4.0;
  if (pct >= 85) return 3.8;
  if (pct >= 80) return 3.6;
  if (pct >= 75) return 3.3;
  if (pct >= 70) return 3.0;
  if (pct >= 65) return 2.7;
  if (pct >= 60) return 2.4;
  if (pct >= 50) return 2.0;
  if (pct >= 40) return 1.5;
  return 0.0;
}

export function calculateAcademicStanding(
  academicRecords?: AcademicRecordItem[] | null
): AcademicStandingSummary {
  const records = Array.isArray(academicRecords) ? academicRecords : [];
  if (records.length === 0) {
    return {
      hasRecords: false,
      totalSubjects: 0,
      overallPct: null,
      letterGrade: "Pending",
      gpa: "—",
      passed: null,
    };
  }

  let totalPossible = 0;
  let totalObtained = 0;
  let hasFailOrAbsent = false;

  for (const rec of records) {
    const isAbsent = rec.examStatus === "absent";
    const total = Number(rec.totalMarks || 100);
    const obtained = isAbsent ? 0 : Number(rec.obtainedMarks || 0);
    const pct = isAbsent ? 0 : total > 0 ? Math.round((obtained / total) * 100) : 0;

    totalPossible += total;
    totalObtained += obtained;
    if (isAbsent || pct < 40 || rec.resultStatus === "fail") {
      hasFailOrAbsent = true;
    }
  }

  const overallPct = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;
  const letterGrade = percentageToLetterGrade(overallPct);
  const gpa = percentageToGpa(overallPct).toFixed(2);

  return {
    hasRecords: true,
    totalSubjects: records.length,
    overallPct,
    letterGrade,
    gpa,
    passed: !hasFailOrAbsent && overallPct >= 40,
  };
}
