"use client";

import { useState, useEffect } from "react";
import { Award, RefreshCw, Sparkles, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { EXAM_TERM_LABELS } from "@/lib/constants";
import { GradebookRoster, type RosterTermFilter } from "./gradebook-roster";

const TEACHER_SUBJECT_OPTIONS = [
  { value: "Mathematics", label: "Mathematics", badge: "STEM" },
  { value: "Computer Science", label: "Computer Science", badge: "STEM" },
  { value: "Physics", label: "Physics", badge: "STEM" },
  { value: "Chemistry", label: "Chemistry", badge: "STEM" },
  { value: "Biology", label: "Biology", badge: "STEM" },
  { value: "English Literature", label: "English Literature", badge: "Humanities" },
  { value: "Pakistan Studies", label: "Pakistan Studies", badge: "Social Studies" },
  { value: "Islamiat / Ethics", label: "Islamiat / Ethics", badge: "Studies" },
];

const EXAM_TERM_OPTIONS = [
  { value: "first_term", label: "First Term Exam", badge: "1st Term" },
  { value: "mid_term", label: "2nd / Mid-Term Exam", badge: "Mid-Term" },
  { value: "final_term", label: "Final Term Exam", badge: "Final" },
  { value: "class_test", label: "Class Test / Unit Quiz", badge: "Quiz" },
];

interface GradebookTabProps {
  students: any[];
  gradeRecords: any[];
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
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [examTerm, setExamTerm] = useState<"first_term" | "mid_term" | "final_term" | "class_test">(
    "first_term"
  );
  const [examStatus, setExamStatus] = useState<"present" | "absent">("present");
  const [gradeSubject, setGradeSubject] = useState("Mathematics");
  const [assessmentTitle, setAssessmentTitle] = useState("First Term Exam");
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [obtainedMarks, setObtainedMarks] = useState<string>("");
  const [teacherFeedback, setTeacherFeedback] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0]._id);
    } else if (students.length === 0) {
      setSelectedStudentId("");
    }
  }, [students, selectedStudentId]);

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
    {
      value: "first_term",
      label: "First Term Exam",
      badge: `${classSectionFilteredGradeRecords.filter((r) => (r.term || "first_term") === "first_term").length}`,
    },
    {
      value: "mid_term",
      label: "2nd / Mid-Term Exam",
      badge: `${classSectionFilteredGradeRecords.filter((r) => (r.term || "first_term") === "mid_term").length}`,
    },
    {
      value: "final_term",
      label: "Final Term Exam",
      badge: `${classSectionFilteredGradeRecords.filter((r) => (r.term || "first_term") === "final_term").length}`,
    },
    {
      value: "class_test",
      label: "Class Test / Unit Quiz",
      badge: `${classSectionFilteredGradeRecords.filter((r) => (r.term || "first_term") === "class_test").length}`,
    },
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
    if (!matching.some((st) => st._id === selectedStudentId)) {
      setSelectedStudentId(matching[0]?._id || "");
    }
  };

  const handleGradeSectionChange = (sec: string) => {
    setGradeSectionFilter(sec);
    const matching = studentsInSelectedGradeClass.filter(
      (st) => sec === "all" || (st.section || "A").trim().toLowerCase() === sec.toLowerCase()
    );
    if (!matching.some((st) => st._id === selectedStudentId)) {
      setSelectedStudentId(matching[0]?._id || "");
    }
  };

  const handleGenerateFeedback = async () => {
    if (examStatus === "present" && obtainedMarks === "") {
      toast.error("Enter obtained marks first to generate contextual AI feedback.");
      return;
    }

    const activeStudent = students.find((st) => st._id === selectedStudentId);
    setGeneratingFeedback(true);
    try {
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: activeStudent?.name,
          subject: gradeSubject,
          assessment: assessmentTitle,
          obtainedMarks: examStatus === "absent" ? 0 : Number(obtainedMarks),
          totalMarks,
          examStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.feedback) {
        setTeacherFeedback(data.feedback);
        toast.success("Personalized Gemini AI feedback generated!");
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
    if (!selectedStudentId) {
      toast.error("Please select a student from the enrolled roster.");
      return;
    }
    if (examStatus === "present" && (obtainedMarks === "" || Number(obtainedMarks) < 0)) {
      toast.error(
        "Please enter valid obtained marks (or mark the student Absent for this subject exam)."
      );
      return;
    }

    const activeTeacherName =
      (typeof window !== "undefined" && localStorage.getItem("campusflow_user_name")) ||
      "Faculty Instructor";

    setSubmittingGrade(true);
    try {
      const res = await fetch("/api/students/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          term: examTerm,
          examStatus,
          subject: gradeSubject,
          assessment: assessmentTitle,
          totalMarks,
          obtainedMarks: examStatus === "absent" ? 0 : Number(obtainedMarks),
          feedback: teacherFeedback.trim() || undefined,
          teacherName: activeTeacherName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          data.message || `Exam record saved successfully for ${data.record.studentName}!`
        );
        await onRefresh();
        setObtainedMarks("");
        setTeacherFeedback("");
        setExamStatus("present");
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
    examStatus === "absent"
      ? 0
      : obtainedMarks !== "" && totalMarks > 0
      ? Math.round((Number(obtainedMarks) / totalMarks) * 100)
      : null;

  const calculatedGrade =
    examStatus === "absent"
      ? "AB"
      : calculatedPct !== null
      ? calculatedPct >= 90
        ? "A+"
        : calculatedPct >= 80
        ? "A"
        : calculatedPct >= 70
        ? "B+"
        : calculatedPct >= 60
        ? "B"
        : calculatedPct >= 50
        ? "C"
        : calculatedPct >= 40
        ? "D"
        : "F"
      : null;

  const calculatedPassStatus =
    examStatus === "absent"
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
        {/* Grading Form */}
        <form
          onSubmit={handleSubmitGrade}
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
                onChange={handleGradeClassChange}
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
                onChange={handleGradeSectionChange}
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
                onChange={(val) => setSelectedStudentId(val)}
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
                  : `No students found in ${
                      gradeClassFilter === "all" ? "all classes" : gradeClassFilter
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
                  const nextTerm = val as "first_term" | "mid_term" | "final_term" | "class_test";
                  setExamTerm(nextTerm);
                  setRosterTermFilter(nextTerm);
                  setAssessmentTitle(EXAM_TERM_LABELS[nextTerm] || "First Term Exam");
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
                onChange={(val) => setGradeSubject(val)}
                options={TEACHER_SUBJECT_OPTIONS}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">
                Exam Attendance ({gradeSubject}) *
              </span>
              <span className="text-[10px] text-muted-foreground">Subject-level presence</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExamStatus("present")}
                className={`h-8.5 rounded-lg border text-xs font-semibold transition-all ${
                  examStatus === "present"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                ✓ Present in Exam
              </button>
              <button
                type="button"
                onClick={() => {
                  setExamStatus("absent");
                  setObtainedMarks("0");
                }}
                className={`h-8.5 rounded-lg border text-xs font-semibold transition-all ${
                  examStatus === "absent"
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
              onChange={(e) => setAssessmentTitle(e.target.value)}
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
                onChange={(e) => setTotalMarks(Number(e.target.value) || 100)}
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
                onChange={(e) => setObtainedMarks(e.target.value)}
                placeholder={examStatus === "absent" ? "Marked Absent (AB)" : `0 - ${totalMarks}`}
                className={`w-full h-9 rounded-lg border px-3 text-xs outline-none focus:ring-1 focus:ring-primary ${
                  examStatus === "absent"
                    ? "bg-destructive/5 border-destructive/30 text-destructive cursor-not-allowed"
                    : "bg-background"
                }`}
                required={examStatus === "present"}
              />
            </div>
          </div>

          {calculatedPassStatus && (
            <div
              className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                calculatedPassStatus === "PASS"
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
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    calculatedPassStatus === "PASS"
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
                onClick={handleGenerateFeedback}
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
              onChange={(e) => setTeacherFeedback(e.target.value)}
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
                Save Marks & Post Feedback
              </>
            )}
          </Button>
        </form>

        {/* Live Roster */}
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
