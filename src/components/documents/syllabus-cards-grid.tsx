"use client";

import { BookOpen, CalendarDays } from "lucide-react";
import { TERM_LABELS } from "@/lib/constants";
import type { SyllabusRecord } from "@/lib/domain-types";

interface SyllabusCardsGridProps {
  items: SyllabusRecord[];
}

export function SyllabusCardsGrid({ items }: SyllabusCardsGridProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
      <h3 className="text-sm font-bold flex items-center gap-2 pb-2 border-b">
        <BookOpen className="h-4 w-4 text-emerald-600" />
        Term Syllabus Schedule ({items.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {items.map((item) => (
          <div key={item._id} className="rounded-xl border bg-muted/15 p-3.5 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {item.grade}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300">
                  {TERM_LABELS[item.term] || item.term}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  item.status === "completed"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : item.status === "in_progress"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {item.status === "completed"
                  ? "Completed"
                  : item.status === "in_progress"
                    ? "In Progress"
                    : "Scheduled"}
              </span>
            </div>
            <p className="font-bold text-sm text-foreground">
              {item.subject}: {item.chapterTitle}
            </p>
            {item.topics && <p className="text-xs text-muted-foreground">{item.topics}</p>}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span>Teacher: {item.assignedTeacher}</span>
              {item.targetDate && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Target: {item.targetDate}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
