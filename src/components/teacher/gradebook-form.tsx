"use client";

import { Sparkles, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { EXAM_TERM_LABELS, EXAM_TERM_OPTIONS, SUBJECT_OPTIONS } from "@/lib/constants";
import type { StudentDomainRecord } from "@/lib/domain-types";

export type ExamTermChoice = "first_term" | "mid_term" | "final_term" | "class_test";

interface GradebookFormProps {
  students: StudentDomainRecord[];
  filteredGradeStudents: StudentDomainRecord[];
  gradeClassFilter: string;
  gradeSectionFilter: string;
  gradeClassOptions: Array<{ value: string; label: string; badge?: string }>;
  gradeSectionOptions: Array<{ value: string; label: string; badge?: string }>;
  selectedStudentId: string;
  examTerm: ExamTermChoice;
  examStatus: "present" | "absent";
  gradeSubject: string;
  assessmentTitle: string;
  totalMarks: number;
  obtainedMarks: string;
  teacherFeedback: string;
  calculatedPct: number | null;
  calculatedGrade: string | null;
  calculatedPassStatus: string | null;
  submittingGrade: boolean;
  generatingFeedback: boolean;
  onClassChange: (val: string) => void;
  onSectionChange: (val: string) => void;
  onStudentChange: (val: string) => void;
  onExamTermChange: (val: ExamTermChoice) => void;
  onSubjectChange: (val: string) => void;
  onExamStatusChange: (status: "present" | "absent") => void;
  onAssessmentTitleChange: (val: string) => void;
  onTotalMarksChange: (val: number) => void;
  onObtainedMarksChange: (val: string) => void;
  onFeedbackChange: (val: string) => void;
  onGenerateFeedback: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function GradebookForm({
  students,
  filteredGradeStudents,
  gradeClassFilter,
  gradeSectionFilter,
  gradeClassOptions,
  gradeSectionOptions,
  selectedStudentId,
  examTerm,
  examStatus,
  gradeSubject,
  assessmentTitle,
  totalMarks,
  obtainedMarks,
  teacherFeedback,
  calculatedPct,
  calculatedGrade,
  calculatedPassStatus,
  submittingGrade,
  generatingFeedback,
  onClassChange,
  onSectionChange,
  onStudentChange,
  onExamTermChange,
  onSubjectChange,
  onExamStatusChange,
  onAssessmentTitleChange,
  onTotalMarksChange,
  onObtainedMarksChange,
  onFeedbackChange,
  onGenerateFeedback,
  onSubmit,
}: GradebookFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="xl:col-span-5 rounded-xl border bg-muted/15 p-4 sm:p-5 space-y-4 text-xs"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="grade-class-filter" className="block font-semibold mb-1 text-foreground">
            Select Class / Grade
          </label>
          <CustomSelect
            name="gradeClassFilter"
            value={gradeClassFilter}
            onChange={onClassChange}
            options={gradeClassOptions}
            placeholder="Select class..."
          />
        </div>

        <div>
          <label htmlFor="grade-section-filter" className="block font-semibold mb-1 text-foreground">
            Select Section
          </label>
          <CustomSelect
            name="gradeSectionFilter"
            value={gradeSectionFilter}
            onChange={onSectionChange}
            options={gradeSectionOptions}
            placeholder="e.g. A, B, Iqbal, Jinnah..."
          />
        </div>
      </div>

      <div>
        <label htmlFor="grade-student" className="block font-semibold mb-1 text-foreground">
          Select Enrolled Student *
          {(gradeClassFilter !== "all" || gradeSectionFilter !== "all") && (
            <span className="ml-1.5 text-[10px] font-normal text-primary">
              ({gradeClassFilter === "all" ? "All Classes" : gradeClassFilter}
              {gradeSectionFilter !== "all" ? ` • Section ${gradeSectionFilter}` : ""})
            </span>
          )}
        </label>
        {filteredGradeStudents.length > 0 ? (
          <CustomSelect
            name="studentSelect"
            value={selectedStudentId}
            onChange={onStudentChange}
            options={filteredGradeStudents.map((st) => ({
              value: st._id,
              label: `${st.name} (${st.rollNumber})`,
              sublabel: `${st.grade} • Section ${st.section}`,
              badge: `Sec ${st.section}`,
            }))}
            searchable={true}
            placeholder="Select or search student..."
          />
        ) : (
          <p className="text-xs text-muted-foreground italic py-2">
            {students.length === 0
              ? "No students currently enrolled. Admit students in Admin Hub."
              : `No students found in ${gradeClassFilter === "all" ? "all classes" : gradeClassFilter
              }${gradeSectionFilter !== "all" ? ` - Section ${gradeSectionFilter}` : ""}.`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="exam-term" className="block font-semibold mb-1 text-foreground">
            Examination Term *
          </label>
          <CustomSelect
            name="examTerm"
            value={examTerm}
            onChange={(val) => {
              const nextTerm = val as ExamTermChoice;
              onExamTermChange(nextTerm);
              onAssessmentTitleChange(EXAM_TERM_LABELS[nextTerm] || "First Term Exam");
            }}
            options={EXAM_TERM_OPTIONS}
          />
        </div>

        <div>
          <label htmlFor="grade-subject" className="block font-semibold mb-1 text-foreground">
            Subject *
          </label>
          <CustomSelect
            name="gradeSubject"
            value={gradeSubject}
            onChange={onSubjectChange}
            options={SUBJECT_OPTIONS}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">Exam Attendance ({gradeSubject}) *</span>
          <span className="text-[10px] text-muted-foreground">Subject-level presence</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onExamStatusChange("present")}
            className={`h-8.5 rounded-lg border text-xs font-semibold transition-all ${examStatus === "present"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
              : "bg-background text-muted-foreground hover:text-foreground"
              }`}
          >
            ✓ Present in Exam
          </button>
          <button
            type="button"
            onClick={() => {
              onExamStatusChange("absent");
              onObtainedMarksChange("0");
            }}
            className={`h-8.5 rounded-lg border text-xs font-semibold transition-all ${examStatus === "absent"
              ? "bg-destructive text-white border-destructive shadow-xs"
              : "bg-background text-muted-foreground hover:text-foreground"
              }`}
          >
            ✕ Absent in Exam (AB)
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="assessment-title" className="block font-semibold mb-1 text-foreground">
          Assessment / Paper Title *
        </label>
        <input
          id="assessment-title"
          name="assessmentTitle"
          type="text"
          autoComplete="off"
          value={assessmentTitle}
          onChange={(e) => onAssessmentTitleChange(e.target.value)}
          placeholder="e.g. First Term Exam, 2nd / Mid-Term Exam, Final Term Exam"
          className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="total-marks" className="block font-semibold mb-1 text-foreground">
            Total Marks
          </label>
          <input
            id="total-marks"
            name="totalMarks"
            type="number"
            min="1"
            value={totalMarks}
            onChange={(e) => onTotalMarksChange(Number(e.target.value) || 100)}
            className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="obtained-marks" className="block font-semibold mb-1 text-foreground">
            Obtained Marks {examStatus === "present" ? "*" : "(Absent)"}
          </label>
          <input
            id="obtained-marks"
            name="obtainedMarks"
            type="number"
            min="0"
            max={totalMarks}
            disabled={examStatus === "absent"}
            value={examStatus === "absent" ? "0" : obtainedMarks}
            onChange={(e) => onObtainedMarksChange(e.target.value)}
            placeholder={examStatus === "absent" ? "Marked Absent (AB)" : `0 - ${totalMarks}`}
            className={`w-full h-9 rounded-lg border px-3 text-xs outline-none focus:ring-1 focus:ring-primary ${examStatus === "absent"
              ? "bg-destructive/5 border-destructive/30 text-destructive cursor-not-allowed"
              : "bg-background"
              }`}
            required={examStatus === "present"}
          />
        </div>
      </div>

      {calculatedPassStatus && (
        <div
          className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${calculatedPassStatus === "PASS"
            ? "bg-emerald-500/10 border-emerald-500/25"
            : "bg-destructive/10 border-destructive/25"
            }`}
        >
          <span className="text-muted-foreground font-medium">Result Verdict:</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">
              {examStatus === "absent"
                ? "Absent (AB)"
                : `${calculatedPct}% • Grade ${calculatedGrade}`}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${calculatedPassStatus === "PASS"
                ? "bg-emerald-600 text-white"
                : "bg-destructive text-white"
                }`}
            >
              {calculatedPassStatus}
            </span>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="teacher-feedback" className="font-semibold text-foreground">
            Teacher Pedagogical Feedback / Remarks
          </label>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onGenerateFeedback}
            disabled={generatingFeedback}
            className="text-[11px] text-primary gap-1 h-6"
          >
            <Sparkles className="h-3 w-3" />
            <span>{generatingFeedback ? "Drafting..." : "AI Suggest Feedback"}</span>
          </Button>
        </div>
        <textarea
          id="teacher-feedback"
          name="teacherFeedback"
          value={teacherFeedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          placeholder="Write constructive formative feedback for the student and guardian..."
          rows={3}
          className="w-full rounded-lg border bg-background p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <Button
        type="submit"
        size="sm"
        className="w-full"
        disabled={submittingGrade || filteredGradeStudents.length === 0 || !selectedStudentId}
      >
        {submittingGrade ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Grade Record...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Save Marks &amp; Post Feedback
          </>
        )}
      </Button>
    </form>
  );
}
