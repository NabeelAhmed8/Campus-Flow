"use client";

import { useState, useEffect } from "react";
import { Award, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EXAM_TERM_LABELS, EXAM_TERM_OPTIONS } from "@/lib/constants";
import { percentageToLetterGrade } from "@/lib/academics";
import type { GradebookEntryRecord, StudentDomainRecord } from "@/lib/domain-types";
import { GradebookRoster, type RosterTermFilter } from "./gradebook-roster";
import { GradebookForm, type ExamTermChoice } from "./gradebook-form";

interface GradeFormDraft {
  studentId: string;
  examTerm: ExamTermChoice;
  examStatus: "present" | "absent";
  subject: string;
  assessmentTitle: string;
  totalMarks: number;
  obtainedMarks: string;
  feedback: string;
}

const INITIAL_GRADE_FORM: GradeFormDraft = {
  studentId: "",
  examTerm: "first_term",
  examStatus: "present",
  subject: "Mathematics",
  assessmentTitle: EXAM_TERM_LABELS.first_term,
  totalMarks: 100,
  obtainedMarks: "",
  feedback: "",
};

interface GradebookTabProps {
  students: StudentDomainRecord[];
  gradeRecords: GradebookEntryRecord[];
  gradeClassOptions: Array<{ value: string; label: string; badge?: string }>;
  loadingGrades: boolean;
  onRefresh: () => Promise<void>;
}

export function GradebookTab({
  students,
  gradeRecords,
  gradeClassOptions,
  loadingGrades,
  onRefresh,
}: GradebookTabProps) {
  const [gradeClassFilter, setGradeClassFilter] = useState("all");
  const [gradeSectionFilter, setGradeSectionFilter] = useState("all");
  const [rosterTermFilter, setRosterTermFilter] = useState<RosterTermFilter>("first_term");
  const [rosterSearch, setRosterSearch] = useState("");
  const [form, setForm] = useState<GradeFormDraft>(INITIAL_GRADE_FORM);
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  const patchForm = (partial: Partial<GradeFormDraft>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  useEffect(() => {
    if (students.length > 0 && !form.studentId) {
      setForm((prev) => ({ ...prev, studentId: students[0]._id }));
    } else if (students.length === 0 && form.studentId) {
      setForm((prev) => ({ ...prev, studentId: "" }));
    }
  }, [students, form.studentId]);

  const studentsInSelectedGradeClass = students.filter(
    (st) => gradeClassFilter === "all" || st.grade === gradeClassFilter
  );

  const gradeSectionOptions = (() => {
    const uniqueSections = Array.from(
      new Set(
        studentsInSelectedGradeClass.map((st) => (st.section || "A").trim()).filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return [
      { value: "all", label: "All Sections", badge: `${studentsInSelectedGradeClass.length}` },
      ...uniqueSections.map((sec) => {
        const count = studentsInSelectedGradeClass.filter(
          (st) => (st.section || "A").trim().toLowerCase() === sec.toLowerCase()
        ).length;
        return { value: sec, label: `Section ${sec}`, badge: `${count}` };
      }),
    ];
  })();

  const filteredGradeStudents = studentsInSelectedGradeClass.filter(
    (st) =>
      gradeSectionFilter === "all" ||
      (st.section || "A").trim().toLowerCase() === gradeSectionFilter.toLowerCase()
  );

  const classSectionFilteredGradeRecords = gradeRecords.filter((rec) => {
    const cs = (rec.classSection || "").trim();
    const parts = cs.split(" - ");
    const recGrade = (parts[0] || cs).trim();
    const recSection = (parts[1] || "").trim();
    const matchesClass = gradeClassFilter === "all" || recGrade === gradeClassFilter;
    const matchesSection =
      gradeSectionFilter === "all" ||
      recSection.toLowerCase() === gradeSectionFilter.toLowerCase();
    return matchesClass && matchesSection;
  });

  const rosterTermOptions = [
    ...EXAM_TERM_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.label,
      badge: `${classSectionFilteredGradeRecords.filter(
        (r) => (r.term || "first_term") === opt.value
      ).length
        }`,
    })),
    {
      value: "all",
      label: "All Terms Combined",
      badge: `${classSectionFilteredGradeRecords.length}`,
    },
  ];

  const filteredGradeRecords = classSectionFilteredGradeRecords.filter((rec) => {
    const matchesTerm =
      rosterTermFilter === "all" || (rec.term || "first_term") === rosterTermFilter;
    const q = rosterSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      (rec.studentName || "").toLowerCase().includes(q) ||
      (rec.rollNumber || "").toLowerCase().includes(q) ||
      (rec.subject || "").toLowerCase().includes(q);
    return matchesTerm && matchesQuery;
  });

  const handleGradeClassChange = (val: string) => {
    setGradeClassFilter(val);
    const inClass = students.filter((st) => val === "all" || st.grade === val);
    const hasCurrentSection =
      gradeSectionFilter === "all" ||
      inClass.some(
        (st) => (st.section || "A").trim().toLowerCase() === gradeSectionFilter.toLowerCase()
      );
    const nextSection = hasCurrentSection ? gradeSectionFilter : "all";
    setGradeSectionFilter(nextSection);
    const matching = inClass.filter(
      (st) =>
        nextSection === "all" ||
        (st.section || "A").trim().toLowerCase() === nextSection.toLowerCase()
    );
    if (!matching.some((st) => st._id === form.studentId)) {
      patchForm({ studentId: matching[0]?._id || "" });
    }
  };

  const handleGradeSectionChange = (sec: string) => {
    setGradeSectionFilter(sec);
    const matching = studentsInSelectedGradeClass.filter(
      (st) => sec === "all" || (st.section || "A").trim().toLowerCase() === sec.toLowerCase()
    );
    if (!matching.some((st) => st._id === form.studentId)) {
      patchForm({ studentId: matching[0]?._id || "" });
    }
  };

  const handleGenerateFeedback = async () => {
    if (form.examStatus === "present" && form.obtainedMarks === "") {
      toast.error("Enter obtained marks first to generate contextual AI feedback.");
      return;
    }

    const activeStudent = students.find((st) => st._id === form.studentId);
    setGeneratingFeedback(true);
    try {
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: activeStudent?.name,
          subject: form.subject,
          assessment: form.assessmentTitle,
          obtainedMarks: form.examStatus === "absent" ? 0 : Number(form.obtainedMarks),
          totalMarks: form.totalMarks,
          examStatus: form.examStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.feedback) {
        patchForm({ feedback: data.feedback });
        toast.success("Personalized AI feedback generated!");
      } else {
        toast.error(data.error || "Unable to generate AI feedback.");
      }
    } catch {
      toast.error("Network error while reaching AI feedback service.");
    } finally {
      setGeneratingFeedback(false);
    }
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) {
      toast.error("Please select a student from the enrolled roster.");
      return;
    }
    if (form.examStatus === "present" && (form.obtainedMarks === "" || Number(form.obtainedMarks) < 0)) {
      toast.error(
        "Please enter valid obtained marks (or mark the student Absent for this subject exam)."
      );
      return;
    }

    setSubmittingGrade(true);
    try {
      const res = await fetch("/api/students/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: form.studentId,
          term: form.examTerm,
          examStatus: form.examStatus,
          subject: form.subject,
          assessment: form.assessmentTitle,
          totalMarks: form.totalMarks,
          obtainedMarks: form.examStatus === "absent" ? 0 : Number(form.obtainedMarks),
          feedback: form.feedback.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          data.message || `Exam record saved successfully for ${data.record.studentName}!`
        );
        await onRefresh();
        patchForm({ obtainedMarks: "", feedback: "", examStatus: "present" });
      } else {
        toast.error(data.error || "Failed to save marks. Please try again.");
      }
    } catch {
      toast.error("Network error while saving grade record.");
    } finally {
      setSubmittingGrade(false);
    }
  };

  const calculatedPct =
    form.examStatus === "absent"
      ? 0
      : form.obtainedMarks !== "" && form.totalMarks > 0
        ? Math.round((Number(form.obtainedMarks) / form.totalMarks) * 100)
        : null;

  const calculatedGrade =
    form.examStatus === "absent"
      ? "AB"
      : calculatedPct !== null
        ? percentageToLetterGrade(calculatedPct)
        : null;

  const calculatedPassStatus =
    form.examStatus === "absent"
      ? "ABSENT"
      : calculatedPct !== null
        ? calculatedPct >= 40
          ? "PASS"
          : "FAIL"
        : null;

  return (
    <div id="gradebook" className="rounded-2xl border bg-card p-4 sm:p-6 shadow-xs space-y-5 scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
            <Award className="h-5 w-5 text-primary shrink-0" />
            <span className="truncate">Student Academic Grading &amp; Exam Records</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Filter by class and section, record term exam marks or subject-level absence, and sync directly to parent report cards.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loadingGrades}
          className="self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingGrades ? "animate-spin" : ""}`} />
          Refresh Records
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <GradebookForm
          students={students}
          filteredGradeStudents={filteredGradeStudents}
          gradeClassFilter={gradeClassFilter}
          gradeSectionFilter={gradeSectionFilter}
          gradeClassOptions={gradeClassOptions}
          gradeSectionOptions={gradeSectionOptions}
          selectedStudentId={form.studentId}
          examTerm={form.examTerm}
          examStatus={form.examStatus}
          gradeSubject={form.subject}
          assessmentTitle={form.assessmentTitle}
          totalMarks={form.totalMarks}
          obtainedMarks={form.obtainedMarks}
          teacherFeedback={form.feedback}
          calculatedPct={calculatedPct}
          calculatedGrade={calculatedGrade}
          calculatedPassStatus={calculatedPassStatus}
          submittingGrade={submittingGrade}
          generatingFeedback={generatingFeedback}
          onClassChange={handleGradeClassChange}
          onSectionChange={handleGradeSectionChange}
          onStudentChange={(studentId) => patchForm({ studentId })}
          onExamTermChange={(nextTerm) => {
            patchForm({ examTerm: nextTerm });
            setRosterTermFilter(nextTerm);
          }}
          onSubjectChange={(subject) => patchForm({ subject })}
          onExamStatusChange={(examStatus) => patchForm({ examStatus })}
          onAssessmentTitleChange={(assessmentTitle) => patchForm({ assessmentTitle })}
          onTotalMarksChange={(totalMarks) => patchForm({ totalMarks })}
          onObtainedMarksChange={(obtainedMarks) => patchForm({ obtainedMarks })}
          onFeedbackChange={(feedback) => patchForm({ feedback })}
          onGenerateFeedback={handleGenerateFeedback}
          onSubmit={handleSubmitGrade}
        />

        <GradebookRoster
          records={filteredGradeRecords}
          gradeClassFilter={gradeClassFilter}
          gradeSectionFilter={gradeSectionFilter}
          rosterTermFilter={rosterTermFilter}
          rosterSearch={rosterSearch}
          rosterTermOptions={rosterTermOptions}
          onTermFilterChange={setRosterTermFilter}
          onSearchChange={setRosterSearch}
          onResetFilters={() => {
            setGradeClassFilter("all");
            setGradeSectionFilter("all");
            setRosterSearch("");
          }}
        />
      </div>
    </div>
  );
}
