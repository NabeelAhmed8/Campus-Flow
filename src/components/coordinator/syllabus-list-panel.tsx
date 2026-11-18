"use client";

import { BookOpen, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TERM_LABELS } from "@/lib/constants";
import type { SyllabusRecord, SyllabusStatus } from "./types";

interface SyllabusListPanelProps {
  items: SyllabusRecord[];
  isLoading: boolean;
  updatingId: string | null;
  editingId: string | null;
  onStartEdit: (item: SyllabusRecord) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: SyllabusStatus) => void;
}

const STATUS_TABS = [
  { key: "pending", label: "Pending", active: "bg-slate-600 text-white border-slate-600" },
  { key: "in_progress", label: "In Progress", active: "bg-amber-500 text-white border-amber-500" },
  { key: "completed", label: "Completed", active: "bg-emerald-600 text-white border-emerald-600" },
] as const;

export function SyllabusListPanel({
  items,
  isLoading,
  updatingId,
  editingId,
  onStartEdit,
  onDelete,
  onStatusChange,
}: SyllabusListPanelProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        Loading term syllabus units...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 px-4 text-center rounded-xl border border-dashed text-xs text-muted-foreground space-y-1.5">
        <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/40" />
        <p className="font-semibold text-foreground text-sm">No Syllabus Units Added Yet</p>
        <p>Add chapters for First Term, Mid-Term, or Final Term to track coverage.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isUpdating = updatingId === item._id;
        const isBeingEdited = editingId === item._id;
        return (
          <div
            key={item._id}
            className={`rounded-xl border p-4 space-y-2.5 transition-colors ${
              isBeingEdited
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "bg-muted/15"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                    {item.grade}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300">
                    {TERM_LABELS[item.term] || item.term}
                  </span>
                  <span className="text-[11px] font-semibold text-foreground">{item.subject}</span>
                  {isBeingEdited && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                      Editing
                    </span>
                  )}
                </div>
                <p className="font-bold text-sm text-foreground">{item.chapterTitle}</p>
                {item.topics && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.topics}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                  <span>Teacher: {item.assignedTeacher}</span>
                  {item.targetDate && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Target: {item.targetDate}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-start shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onStartEdit(item)}
                  className={`h-8 w-8 p-0 ${
                    isBeingEdited
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  title="Edit syllabus unit"
                  aria-label={`Edit ${item.chapterTitle}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item._id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  title="Delete syllabus unit"
                  aria-label={`Delete ${item.chapterTitle}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-dashed">
              {STATUS_TABS.map((st) => (
                <button
                  key={st.key}
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onStatusChange(item._id, st.key)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                    item.status === st.key
                      ? st.active
                      : "bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
