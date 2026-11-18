"use client";

import { BookOpen, Plus, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { GRADE_OPTIONS, TERM_OPTIONS } from "@/lib/constants";
import type { SyllabusTerm } from "./types";

interface SyllabusFormProps {
  editingId: string | null;
  grade: string;
  term: SyllabusTerm;
  subject: string;
  chapter: string;
  topics: string;
  targetDate: string;
  teacher: string;
  isSaving: boolean;
  facultyOptions: Array<{ value: string; label: string; sublabel?: string; badge?: string }>;
  onGradeChange: (val: string) => void;
  onTermChange: (val: SyllabusTerm) => void;
  onSubjectChange: (val: string) => void;
  onChapterChange: (val: string) => void;
  onTopicsChange: (val: string) => void;
  onTargetDateChange: (val: string) => void;
  onTeacherChange: (val: string) => void;
  onCancelEdit: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SyllabusForm({
  editingId,
  grade,
  term,
  subject,
  chapter,
  topics,
  targetDate,
  teacher,
  isSaving,
  facultyOptions,
  onGradeChange,
  onTermChange,
  onSubjectChange,
  onChapterChange,
  onTopicsChange,
  onTargetDateChange,
  onTeacherChange,
  onCancelEdit,
  onSubmit,
}: SyllabusFormProps) {
  return (
    <form
      onSubmit={onSubmit}
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
            {editingId ? "Edit Syllabus Unit / Chapter" : "Add Syllabus Unit / Chapter"}
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
            onClick={onCancelEdit}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label htmlFor="syl-grade" className="block text-[11px] font-semibold mb-1">
            Class / Grade
          </label>
          <CustomSelect
            id="syl-grade"
            value={grade}
            onChange={onGradeChange}
            options={[...GRADE_OPTIONS]}
            size="sm"
          />
        </div>

        <div>
          <label htmlFor="syl-term" className="block text-[11px] font-semibold mb-1">
            Academic Term
          </label>
          <CustomSelect
            id="syl-term"
            value={term}
            onChange={(v) => onTermChange(v as SyllabusTerm)}
            options={[...TERM_OPTIONS]}
            size="sm"
          />
        </div>

        <div>
          <label htmlFor="syl-subject" className="block text-[11px] font-semibold mb-1">
            Subject
          </label>
          <input
            id="syl-subject"
            name="subject"
            type="text"
            autoComplete="off"
            required
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="e.g. Biology, Chemistry, English"
            className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="syl-target-date" className="block text-[11px] font-semibold mb-1">
            Target Completion Date
          </label>
          <CustomDatePicker
            id="syl-target-date"
            name="targetDate"
            value={targetDate}
            onChange={onTargetDateChange}
            placeholder="Select target date"
            size="sm"
            align="right"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="syl-chapter" className="block text-[11px] font-semibold mb-1">
            Chapter / Unit Title
          </label>
          <input
            id="syl-chapter"
            name="chapterTitle"
            type="text"
            autoComplete="off"
            required
            value={chapter}
            onChange={(e) => onChapterChange(e.target.value)}
            placeholder="e.g. Chapter 3: Quadratic Equations & Factorization"
            className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="syl-teacher" className="block text-[11px] font-semibold mb-1">
            Responsible Teacher
          </label>
          <CustomSelect
            id="syl-teacher"
            name="assignedTeacher"
            value={teacher}
            onChange={onTeacherChange}
            options={
              teacher && !facultyOptions.some((o) => o.value === teacher)
                ? [{ value: teacher, label: teacher, sublabel: "Current Assignment" }, ...facultyOptions]
                : facultyOptions
            }
            placeholder={
              facultyOptions.length > 0 ? "Select responsible teacher..." : "No teachers registered yet"
            }
            searchable={facultyOptions.length > 4}
            size="sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="syl-topics" className="block text-[11px] font-semibold mb-1">
            Key Topics / Exercises (Optional)
          </label>
          <textarea
            id="syl-topics"
            name="topics"
            rows={3}
            value={topics}
            onChange={(e) => onTopicsChange(e.target.value)}
            placeholder="e.g. Exercise 3.1 to 3.4, board past paper MCQs..."
            className="w-full rounded-lg border bg-background p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSaving} className="flex-1 h-9 text-xs">
          {editingId ? <Save className="mr-1.5 h-3.5 w-3.5" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
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
            onClick={onCancelEdit}
            className="h-9 text-xs px-3"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
