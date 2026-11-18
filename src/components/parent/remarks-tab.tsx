"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { EXAM_TERM_LABELS } from "@/lib/constants";
import { formatReadableDate } from "@/lib/format";
import type { RemarksTermKey } from "./types";

interface ParentRemarksTabProps {
  student: any;
}

export function ParentRemarksTab({ student }: ParentRemarksTabProps) {
  const [selectedRemarksTerm, setSelectedRemarksTerm] = useState<RemarksTermKey>("first_term");
  const [liveNotices, setLiveNotices] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && Array.isArray(d.notifications)) {
          const advisories = d.notifications
            .filter((n: any) => ["announcement", "circular", "urgent"].includes(n.category))
            .slice(0, 4);
          setLiveNotices(advisories);
        }
      })
      .catch(() => {});
  }, []);

  const allRemarks: any[] = Array.isArray(student.academicRecords) ? student.academicRecords : [];
  const getRecordTerm = (rec: any) => rec.term || "first_term";
  const countByTerm = (termKey: string) =>
    allRemarks.filter((r) => getRecordTerm(r) === termKey).length;

  const filteredRemarks =
    selectedRemarksTerm === "all"
      ? allRemarks
      : allRemarks.filter((rec) => getRecordTerm(rec) === selectedRemarksTerm);

  return (
    <div id="remarks" className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-5 scroll-mt-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-base text-foreground leading-tight">
              Teacher Assessment Marks &amp; Faculty Feedback
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select an exam term to view subject-wise marks &amp; instructor remarks
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="w-full sm:w-56">
            <CustomSelect
              id="parent-remarks-term-select"
              name="remarksTermFilter"
              value={selectedRemarksTerm}
              onChange={(val) => setSelectedRemarksTerm(val as RemarksTermKey)}
              options={[
                {
                  value: "first_term",
                  label: "First Term Exam",
                  badge: String(countByTerm("first_term")),
                },
                {
                  value: "mid_term",
                  label: "2nd / Mid-Term Exam",
                  badge: String(countByTerm("mid_term")),
                },
                {
                  value: "final_term",
                  label: "Final Term Exam",
                  badge: String(countByTerm("final_term")),
                },
                {
                  value: "class_test",
                  label: "Class Tests",
                  badge: String(countByTerm("class_test")),
                },
                {
                  value: "all",
                  label: "All Terms Combined",
                  badge: String(allRemarks.length),
                },
              ]}
              size="sm"
              align="right"
            />
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary shrink-0">
            {filteredRemarks.length} {filteredRemarks.length === 1 ? "Record" : "Records"}
          </span>
        </div>
      </div>

      {/* Term-Filtered Teacher Assessment Remarks (Internal Vertical Scroll) */}
      {filteredRemarks.length > 0 ? (
        <div className="max-h-[420px] overflow-y-auto pr-1.5 space-y-3">
          {filteredRemarks.map((rec: any, idx: number) => {
            const recTerm = getRecordTerm(rec);
            const isAbsent = rec.examStatus === "absent";
            return (
              <div
                key={rec.id || idx}
                className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="font-bold text-sm text-primary">{rec.subject}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                      {EXAM_TERM_LABELS[recTerm] || "First Term Exam"}
                    </span>
                    {rec.assessment && (
                      <span className="text-xs font-medium text-muted-foreground truncate">
                        • {rec.assessment}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
                    {isAbsent ? (
                      <span className="rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 px-2.5 py-0.5 text-[10px] font-bold">
                        ABSENT IN EXAM
                      </span>
                    ) : (
                      <>
                        <span className="font-bold text-foreground">
                          Score: {rec.obtainedMarks}/{rec.totalMarks}
                        </span>
                        <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                          Grade {rec.grade}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-foreground text-xs italic leading-relaxed bg-background/85 p-3 rounded-lg border border-border/50">
                  &quot;{rec.feedback || "No additional remarks added."}&quot;
                </p>

                <div className="text-[10px] text-muted-foreground flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <span>Teacher: {rec.teacherName || "Faculty Instructor"}</span>
                  <span>
                    Recorded:{" "}
                    {rec.recordedAt ? new Date(rec.recordedAt).toLocaleDateString() : "Recent"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center text-muted-foreground text-xs rounded-xl border border-dashed p-6 space-y-1.5">
          <Bell className="h-8 w-8 mx-auto text-muted-foreground/35" />
          <p className="font-semibold text-foreground text-sm">
            No Feedback Found for {EXAM_TERM_LABELS[selectedRemarksTerm] || "Selected Term"}
          </p>
          <p className="max-w-md mx-auto">
            {allRemarks.length > 0
              ? "Try choosing another exam term from the dropdown above to view recorded marks and faculty remarks."
              : "When teachers record marks and formative feedback in their portal, they will appear here live."}
          </p>
        </div>
      )}

      {/* Live Campus Broadcast Notices (Real MongoDB Notifications) */}
      <div className="pt-4 border-t space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live Campus Broadcasts &amp; Advisories ({liveNotices.length})
        </h4>
        {liveNotices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {liveNotices.map((notice) => (
              <div key={notice.id} className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
                <div className="flex items-center justify-between gap-2 font-semibold">
                  <span className="truncate">{notice.title}</span>
                  <span className="text-[10px] text-primary shrink-0">
                    {formatReadableDate(notice.createdAt)}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  {notice.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No school broadcasts published yet. Official announcements from Administration or Coordinator will appear here automatically.
          </p>
        )}
      </div>
    </div>
  );
}
