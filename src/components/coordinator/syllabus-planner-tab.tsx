"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { CoordinatorFileUpload } from "@/components/coordinator-file-upload";
import {
  GRADE_FILTER_OPTIONS,
  GRADE_OPTIONS,
  TERM_LABELS,
  TERM_OPTIONS,
} from "@/lib/constants";
import {
  FacultyMember,
  SyllabusRecord,
  SyllabusStatus,
  SyllabusTerm,
} from "./types";

interface SyllabusPlannerTabProps {
  faculty: FacultyMember[];
  syllabusItems: SyllabusRecord[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onUpdateLocal: React.Dispatch<React.SetStateAction<SyllabusRecord[]>>;
}

export function SyllabusPlannerTab({
  faculty,
  syllabusItems,
  isLoading,
  onRefresh,
  onUpdateLocal,
}: SyllabusPlannerTabProps) {
  const [termFilter, setTermFilter] = useState("ALL");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [grade, setGrade] = useState("Grade 10");
  const [term, setTerm] = useState<SyllabusTerm>("first_term");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [topics, setTopics] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [teacher, setTeacher] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setTargetDate(new Date().toISOString().split("T")[0]);
  }, []);

  const facultyOptions = useMemo(
    () =>
      faculty.map((t) => ({
        value: t.name,
        label: t.name,
        sublabel: t.subject,
        badge: t.role === "coordinator" ? "Coordinator" : "Teacher",
      })),
    [faculty]
  );

  const filteredItems = useMemo(
    () =>
      syllabusItems.filter((item) => {
        const matchTerm = termFilter === "ALL" || item.term === termFilter;
        const matchGrade = gradeFilter === "ALL" || item.grade === gradeFilter;
        return matchTerm && matchGrade;
      }),
    [syllabusItems, termFilter, gradeFilter]
  );

  const progress = useMemo(() => {
    const total = filteredItems.length;
    const completed = filteredItems.filter((i) => i.status === "completed").length;
    const inProgress = filteredItems.filter(
      (i) => i.status === "in_progress"
    ).length;
    return {
      total,
      completed,
      inProgress,
      pending: total - completed - inProgress,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [filteredItems]);

  const handleStartEdit = (item: SyllabusRecord) => {
    setEditingId(item._id);
    setGrade(item.grade);
    setTerm(item.term);
    setSubject(item.subject);
    setChapter(item.chapterTitle);
    setTopics(item.topics || "");
    setTargetDate(item.targetDate || "");
    setTeacher(
      item.assignedTeacher && item.assignedTeacher !== "Subject Teacher"
        ? item.assignedTeacher
        : ""
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setChapter("");
    setTopics("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !chapter.trim()) {
      toast.error("Please enter Subject and Chapter / Unit Title.");
      return;
    }
    setIsSaving(true);
    try {
      const isEditing = Boolean(editingId);
      const res = await fetch("/api/coordinator/syllabus", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { id: editingId } : {}),
          grade,
          term,
          subject: subject.trim(),
          chapterTitle: chapter.trim(),
          topics: topics.trim(),
          targetDate,
          assignedTeacher: teacher.trim() || "Subject Teacher",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save syllabus unit.");
        return;
      }
      toast.success(
        isEditing ? "Syllabus unit updated." : "Syllabus unit added to term plan."
      );
      setEditingId(null);
      setChapter("");
      setTopics("");
      window.dispatchEvent(new Event("campusflow_notifications_refresh"));
      await onRefresh();
    } catch {
      toast.error("Unable to save syllabus unit.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: SyllabusStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/coordinator/syllabus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        toast.error("Could not update progress status.");
        return;
      }
      onUpdateLocal((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status } : item))
      );
      toast.success("Syllabus progress updated.");
    } catch {
      toast.error("Unable to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `/api/coordinator/syllabus?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        toast.error("Could not remove syllabus item.");
        return;
      }
      onUpdateLocal((prev) => prev.filter((item) => item._id !== id));
      if (editingId === id) handleCancelEdit();
      toast.success("Syllabus unit removed.");
    } catch {
      toast.error("Unable to delete syllabus item.");
    }
  };

  return (
    <div className="space-y-5">
      <CoordinatorFileUpload category="syllabus" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={`lg:col-span-5 rounded-2xl border bg-card p-5 shadow-xs space-y-4 transition-colors ${
            editingId ? "border-primary/60 ring-1 ring-primary/20" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                {editingId ? (
                  <Pencil className="h-4 w-4 text-primary" />
                ) : (
                  <BookOpen className="h-4 w-4 text-primary" />
                )}
                {editingId
                  ? "Edit Syllabus Unit / Chapter"
                  : "Add Syllabus Unit / Chapter"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {editingId
                  ? "Modify chapter details, target date, or teacher and save."
                  : "Plan First Term, Mid-Term, and Final Term syllabus targets."}
              </p>
            </div>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label
                htmlFor="syl-grade"
                className="block text-[11px] font-semibold mb-1"
              >
                Class / Grade
              </label>
              <CustomSelect
                id="syl-grade"
                value={grade}
                onChange={setGrade}
                options={[...GRADE_OPTIONS]}
                size="sm"
              />
            </div>

            <div>
              <label
                htmlFor="syl-term"
                className="block text-[11px] font-semibold mb-1"
              >
                Academic Term
              </label>
              <CustomSelect
                id="syl-term"
                value={term}
                onChange={(v) => setTerm(v as SyllabusTerm)}
                options={[...TERM_OPTIONS]}
                size="sm"
              />
            </div>

            <div>
              <label
                htmlFor="syl-subject"
                className="block text-[11px] font-semibold mb-1"
              >
                Subject
              </label>
              <input
                id="syl-subject"
                name="subject"
                type="text"
                autoComplete="off"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology, Chemistry, English"
                className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="syl-target-date"
                className="block text-[11px] font-semibold mb-1"
              >
                Target Completion Date
              </label>
              <CustomDatePicker
                id="syl-target-date"
                name="targetDate"
                value={targetDate}
                onChange={setTargetDate}
                placeholder="Select target date"
                size="sm"
                align="right"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="syl-chapter"
                className="block text-[11px] font-semibold mb-1"
              >
                Chapter / Unit Title
              </label>
              <input
                id="syl-chapter"
                name="chapterTitle"
                type="text"
                autoComplete="off"
                required
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="e.g. Chapter 3: Quadratic Equations & Factorization"
                className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="syl-teacher"
                className="block text-[11px] font-semibold mb-1"
              >
                Responsible Teacher
              </label>
              <CustomSelect
                id="syl-teacher"
                name="assignedTeacher"
                value={teacher}
                onChange={setTeacher}
                options={
                  teacher && !facultyOptions.some((o) => o.value === teacher)
                    ? [
                        {
                          value: teacher,
                          label: teacher,
                          sublabel: "Current Assignment",
                        },
                        ...facultyOptions,
                      ]
                    : facultyOptions
                }
                placeholder={
                  facultyOptions.length > 0
                    ? "Select responsible teacher..."
                    : "No teachers registered yet"
                }
                searchable={facultyOptions.length > 4}
                size="sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="syl-topics"
                className="block text-[11px] font-semibold mb-1"
              >
                Key Topics / Exercises (Optional)
              </label>
              <textarea
                id="syl-topics"
                name="topics"
                rows={3}
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="e.g. Exercise 3.1 to 3.4, board past paper MCQs..."
                className="w-full rounded-lg border bg-background p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-9 text-xs"
            >
              {editingId ? (
                <Save className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Plus className="mr-1.5 h-3.5 w-3.5" />
              )}
              {isSaving
                ? editingId
                  ? "Updating Unit..."
                  : "Saving Unit..."
                : editingId
                ? "Update Syllabus Unit"
                : "Schedule Syllabus Unit"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="h-9 text-xs px-3"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        {/* Coverage Tracker */}
        <div className="lg:col-span-7 rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h2 className="text-base font-bold">
                Syllabus Coverage Tracker ({filteredItems.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Update chapter completion status in real time.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:min-w-[270px]">
              <CustomSelect
                value={termFilter}
                onChange={setTermFilter}
                options={[{ value: "ALL", label: "All Terms" }, ...TERM_OPTIONS]}
                size="sm"
              />
              <CustomSelect
                value={gradeFilter}
                onChange={setGradeFilter}
                options={GRADE_FILTER_OPTIONS}
                size="sm"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-foreground">
                Overall Completion Rate
              </span>
              <span className="font-bold text-primary">
                {progress.percent}% Completed ({progress.completed}/
                {progress.total} units)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
              <span>Completed: {progress.completed}</span>
              <span>In Progress: {progress.inProgress}</span>
              <span>Pending: {progress.pending}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Loading term syllabus units...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-xl border border-dashed text-xs text-muted-foreground space-y-1.5">
              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="font-semibold text-foreground text-sm">
                No Syllabus Units Planned Yet
              </p>
              <p>
                Add chapters for First Term, Mid-Term, or Final Term to track coverage.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
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
                          <span className="text-[11px] font-semibold text-foreground">
                            {item.subject}
                          </span>
                          {isBeingEdited && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                              Editing
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-sm text-foreground">
                          {item.chapterTitle}
                        </p>
                        {item.topics && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {item.topics}
                          </p>
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
                          onClick={() => handleStartEdit(item)}
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
                          onClick={() => handleDelete(item._id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          title="Delete syllabus unit"
                          aria-label={`Delete ${item.chapterTitle}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-dashed">
                      {(
                        [
                          {
                            key: "pending",
                            label: "Pending",
                            active: "bg-slate-600 text-white border-slate-600",
                          },
                          {
                            key: "in_progress",
                            label: "In Progress",
                            active: "bg-amber-500 text-white border-amber-500",
                          },
                          {
                            key: "completed",
                            label: "Completed",
                            active:
                              "bg-emerald-600 text-white border-emerald-600",
                          },
                        ] as const
                      ).map((st) => (
                        <button
                          key={st.key}
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(item._id, st.key)}
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
          )}
        </div>
      </div>
    </div>
  );
}
