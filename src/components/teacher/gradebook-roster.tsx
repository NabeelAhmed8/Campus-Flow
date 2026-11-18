"use client";

import { Users, Search, Award, MessageSquare } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { EXAM_TERM_LABELS } from "@/lib/constants";
import type { GradebookEntryRecord } from "@/lib/domain-types";

export type RosterTermFilter = "all" | "first_term" | "mid_term" | "final_term" | "class_test";

interface GradebookRosterProps {
  records: GradebookEntryRecord[];
  gradeClassFilter: string;
  gradeSectionFilter: string;
  rosterTermFilter: RosterTermFilter;
  rosterSearch: string;
  rosterTermOptions: Array<{ value: string; label: string; badge?: string }>;
  onTermFilterChange: (val: RosterTermFilter) => void;
  onSearchChange: (val: string) => void;
  onResetFilters: () => void;
}

export function GradebookRoster({
  records,
  gradeClassFilter,
  gradeSectionFilter,
  rosterTermFilter,
  rosterSearch,
  rosterTermOptions,
  onTermFilterChange,
  onSearchChange,
  onResetFilters,
}: GradebookRosterProps) {
  const passedCount = records.filter(
    (r) =>
      r.examStatus !== "absent" &&
      (r.resultStatus ? r.resultStatus === "pass" : Number(r.percentage || 0) >= 40)
  ).length;
  const absentCount = records.filter(
    (r) => r.examStatus === "absent" || r.resultStatus === "absent"
  ).length;
  const failedCount = records.length - passedCount - absentCount;
  const avgPct =
    records.length > 0
      ? Math.round(
        records.reduce(
          (sum, r) => sum + (r.examStatus === "absent" ? 0 : Number(r.percentage || 0)),
          0
        ) / records.length
      )
      : 0;

  return (
    <div className="xl:col-span-7 min-w-0 flex flex-col rounded-xl border bg-card shadow-2xs">
      {/* Roster Top Header & Controls */}
      <div className="p-3.5 sm:p-4 border-b bg-muted/20 rounded-t-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <h3 className="font-bold text-xs sm:text-sm text-foreground truncate">
              Live Recorded Marks &amp; Feedback Roster
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
              {records.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-background border text-muted-foreground font-medium">
              {gradeClassFilter === "all" ? "All Classes" : gradeClassFilter}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-background border text-muted-foreground font-medium">
              {gradeSectionFilter === "all" ? "All Sections" : `Section ${gradeSectionFilter}`}
            </span>
            {(gradeClassFilter !== "all" ||
              gradeSectionFilter !== "all" ||
              rosterSearch.trim() !== "") && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="text-primary font-semibold hover:underline px-1"
                >
                  Reset
                </button>
              )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative min-w-0">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              id="roster-search"
              name="rosterSearch"
              type="text"
              autoComplete="off"
              aria-label="Search student, roll number, or subject"
              value={rosterSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search student, roll #, or subject..."
              className="w-full h-8.5 rounded-lg border bg-background pl-8 pr-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="min-w-0">
            <CustomSelect
              name="rosterTermFilter"
              value={rosterTermFilter}
              onChange={(val) => onTermFilterChange(val as RosterTermFilter)}
              options={rosterTermOptions}
              size="sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg border bg-background px-2.5 py-1.5 flex items-center justify-between gap-1">
            <span className="text-[10px] text-muted-foreground font-medium">Passed</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {passedCount}
            </span>
          </div>
          <div className="rounded-lg border bg-background px-2.5 py-1.5 flex items-center justify-between gap-1">
            <span className="text-[10px] text-muted-foreground font-medium">Failed</span>
            <span className="text-xs font-bold text-destructive">{failedCount}</span>
          </div>
          <div className="rounded-lg border bg-background px-2.5 py-1.5 flex items-center justify-between gap-1">
            <span className="text-[10px] text-muted-foreground font-medium">Absent</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {absentCount}
            </span>
          </div>
          <div className="rounded-lg border bg-background px-2.5 py-1.5 flex items-center justify-between gap-1">
            <span className="text-[10px] text-muted-foreground font-medium">Avg Score</span>
            <span className="text-xs font-bold text-primary">
              {records.length > 0 ? `${avgPct}%` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Column Header Bar (Zero Horizontal Scroll) */}
      {records.length > 0 && (
        <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2 border-b bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-5">Student &amp; Class</div>
          <div className="col-span-4">Subject &amp; Attendance</div>
          <div className="col-span-3 text-right">Score &amp; Result</div>
        </div>
      )}

      {/* Fluid Zero-Overflow Record Rows */}
      <div className="divide-y rounded-b-xl">
        {records.length > 0 ? (
          records.map((rec, i) => {
            const isAbsent = rec.examStatus === "absent";
            const isPass =
              !isAbsent &&
              (rec.resultStatus
                ? rec.resultStatus === "pass"
                : Number(rec.percentage || 0) >= 40);
            const shortTerm =
              rec.term === "mid_term"
                ? "Mid-Term"
                : rec.term === "final_term"
                  ? "Final Term"
                  : rec.term === "class_test"
                    ? "Class Test"
                    : "1st Term";

            return (
              <div
                key={rec.id || i}
                className={`p-3.5 sm:px-4 sm:py-3 space-y-2 text-xs transition-colors ${isAbsent ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/25"
                  }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center">
                  <div className="sm:col-span-5 min-w-0">
                    <div className="font-semibold text-foreground truncate">{rec.studentName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                      {rec.rollNumber}
                      {rec.classSection ? ` • ${rec.classSection}` : ""}
                    </div>
                  </div>

                  <div className="sm:col-span-4 min-w-0">
                    <div className="font-semibold text-foreground truncate">{rec.subject}</div>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {shortTerm}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${isAbsent
                          ? "bg-destructive/10 text-destructive"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                      >
                        {isAbsent ? "Absent" : "Present"}
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-3 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <div className="font-mono font-bold text-foreground">
                      {isAbsent
                        ? `AB / ${rec.totalMarks}`
                        : `${rec.obtainedMarks} / ${rec.totalMarks}`}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!isAbsent && (
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {rec.percentage}% ({rec.grade})
                        </span>
                      )}
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${isPass
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-destructive/15 text-destructive"
                          }`}
                      >
                        {isAbsent ? "ABSENT" : isPass ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  </div>
                </div>

                {rec.feedback && (
                  <div className="flex items-start gap-1.5 rounded-lg bg-muted/35 border border-border/50 px-2.5 py-1.5 text-[11px] text-muted-foreground leading-snug">
                    <MessageSquare className="h-3 w-3 text-primary/70 shrink-0 mt-0.5" />
                    <p className="min-w-0 break-words">{rec.feedback}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-12 px-4 text-center text-muted-foreground">
            <Award className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="font-medium text-foreground text-xs">
              No marks recorded for{" "}
              {rosterTermFilter === "all" ? "any term" : EXAM_TERM_LABELS[rosterTermFilter]}
            </p>
            <p className="text-[11px] max-w-xs mx-auto mt-0.5">
              Use the form on the left to record exam marks or switch the Exam Term dropdown above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
