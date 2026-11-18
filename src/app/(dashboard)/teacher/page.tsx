"use client";

import { useState, useEffect } from "react";
import {
  BrainCircuit,
  Sparkles,
  BookOpen,
  CheckCircle,
  Copy,
  Clock,
  Send,
  Loader2,
  ListOrdered,
  HelpCircle,
  Award,
  Users,
  Search,
  MessageSquare,
  Plus,
  RefreshCw,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  UserCheck,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { CampusDocumentsPanel } from "@/components/campus-documents-panel";

const GRADE_LEVEL_OPTIONS = [
  { value: "Grade 7", label: "Grade 7", badge: "Middle School" },
  { value: "Grade 8", label: "Grade 8", badge: "Middle School" },
  { value: "Grade 9", label: "Grade 9", badge: "Matric / O-Level" },
  { value: "Grade 10", label: "Grade 10", badge: "Matric / O-Level" },
  { value: "Grade 11", label: "Grade 11", badge: "Inter / A-Level" },
  { value: "Grade 12", label: "Grade 12", badge: "Inter / A-Level" },
];

const DURATION_OPTIONS = [
  { value: "30 mins", label: "30 mins", sublabel: "Short period" },
  { value: "45 mins", label: "45 mins", sublabel: "Standard period" },
  { value: "60 mins", label: "60 mins", sublabel: "Extended block" },
  { value: "90 mins", label: "90 mins", sublabel: "Double lab session" },
];

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

const EXAM_TERM_LABELS: Record<string, string> = {
  first_term: "First Term Exam",
  mid_term: "2nd / Mid-Term Exam",
  final_term: "Final Term Exam",
  class_test: "Class Test / Unit Quiz",
};

export default function TeacherPage() {
  // Lesson Planner State
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("Grade 9");
  const [duration, setDuration] = useState("45 mins");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  // Formative Quiz State
  const [quizPrompt, setQuizPrompt] = useState("");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<string[] | null>(null);

  // Student Marks & Feedback State
  const [students, setStudents] = useState<any[]>([]);
  const [gradeRecords, setGradeRecords] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(true);

  const [gradeClassFilter, setGradeClassFilter] = useState("all");
  const [gradeSectionFilter, setGradeSectionFilter] = useState("all");
  const [rosterTermFilter, setRosterTermFilter] = useState<
    "all" | "first_term" | "mid_term" | "final_term" | "class_test"
  >("first_term");
  const [rosterSearch, setRosterSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [examTerm, setExamTerm] = useState<"first_term" | "mid_term" | "final_term" | "class_test">("first_term");
  const [examStatus, setExamStatus] = useState<"present" | "absent">("present");
  const [gradeSubject, setGradeSubject] = useState("Mathematics");
  const [assessmentTitle, setAssessmentTitle] = useState("First Term Exam");
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [obtainedMarks, setObtainedMarks] = useState<string>("");
  const [teacherFeedback, setTeacherFeedback] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  // Attendance Register State (initialized on client mount for Next.js 16 cacheComponents compatibility)
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceGradeFilter, setAttendanceGradeFilter] = useState("all");
  const [attendanceSectionFilter, setAttendanceSectionFilter] = useState("all");
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: "present" | "absent" | "late" | "excused"; remarks: string }>
  >({});
  const [savedAttendance, setSavedAttendance] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [teacherName, setTeacherName] = useState("Faculty Educator");
  const [assignedClasses, setAssignedClasses] = useState<
    Array<{ grade: string; section: string }>
  >([]);

  // Tab State: planner | quiz | gradebook | attendance | schedules
  const [activeTab, setActiveTab] = useState<"planner" | "quiz" | "gradebook" | "attendance" | "schedules">("planner");

  // Fetch Students & Grade Records from MongoDB
  const fetchTeacherData = async () => {
    try {
      setLoadingGrades(true);
      const [studentsRes, gradesRes] = await Promise.all([
        fetch("/api/students", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/students/grade", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]);

      if (studentsRes?.success && Array.isArray(studentsRes.students)) {
        setStudents(studentsRes.students);
        if (Array.isArray(studentsRes.assignedClasses)) {
          setAssignedClasses(studentsRes.assignedClasses);
        }
        if (studentsRes.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(studentsRes.students[0]._id);
        } else if (studentsRes.students.length === 0) {
          setSelectedStudentId("");
        }
      }

      if (gradesRes?.success && Array.isArray(gradesRes.records)) {
        setGradeRecords(gradesRes.records);
      }
    } catch {
      toast.error("Failed to load student roster and grade records. Please refresh.");
    } finally {
      setLoadingGrades(false);
    }
  };

  const fetchAttendanceForDate = async (targetDate: string) => {
    try {
      setLoadingAttendance(true);
      const res = await fetch(`/api/attendance?date=${targetDate}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        setSavedAttendance(data.records);
        const map: Record<string, { status: "present" | "absent" | "late" | "excused"; remarks: string }> = {};
        data.records.forEach((rec: any) => {
          const sId = rec.studentId?._id || rec.studentId?.toString() || rec.studentId;
          map[sId] = {
            status: rec.status,
            remarks: rec.remarks || "",
          };
        });
        setAttendanceMap(map);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    setAttendanceDate(new Date().toISOString().split("T")[0]);
    fetchTeacherData();
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("campusflow_user_name");
      if (name) setTeacherName(name);
    }
  }, []);

  useEffect(() => {
    if (attendanceDate) {
      fetchAttendanceForDate(attendanceDate);
    }
  }, [attendanceDate]);

  // Synchronize activeTab with URL ?tab= or #hash
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleTabSync = (e?: any) => {
        if (e && "detail" in e && (e.detail?.tab || e.detail?.tabKey)) {
          const t = e.detail.tab || e.detail.tabKey;
          if (t === "planner" || t === "quiz" || t === "gradebook" || t === "attendance" || t === "schedules") {
            setActiveTab(t);
            return;
          }
        }
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab === "planner" || tab === "quiz" || tab === "gradebook" || tab === "attendance" || tab === "schedules") {
          setActiveTab(tab);
        } else if (window.location.hash) {
          const hash = window.location.hash.replace("#", "");
          if (hash === "planner" || hash === "quiz" || hash === "gradebook" || hash === "attendance" || hash === "schedules") {
            setActiveTab(hash as any);
          }
        } else {
          setActiveTab("planner");
        }
      };

      handleTabSync();
      window.addEventListener("popstate", handleTabSync);
      window.addEventListener("campusflow_tab_change", handleTabSync);

      return () => {
        window.removeEventListener("popstate", handleTabSync);
        window.removeEventListener("campusflow_tab_change", handleTabSync);
      };
    }
  }, []);

  const switchTab = (tab: "planner" | "quiz" | "gradebook" | "attendance" | "schedules") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `?tab=${tab}`);
      window.dispatchEvent(new CustomEvent("campusflow_tab_change", { detail: { tab } }));
    }
  };

  const handleMarkAllAttendance = (status: "present" | "absent" | "late" | "excused") => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      filteredAttendanceStudents.forEach((st) => {
        next[st._id] = {
          status,
          remarks: next[st._id]?.remarks || "",
        };
      });
      return next;
    });
    toast.success(`Marked all ${filteredAttendanceStudents.length} students as ${status.toUpperCase()}`);
  };

  const handleAttendanceStatusChange = (
    studentId: string,
    status: "present" | "absent" | "late" | "excused"
  ) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status,
        remarks: prev[studentId]?.remarks || "",
      },
    }));
  };

  const handleAttendanceRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || "present",
        remarks,
      },
    }));
  };

  const handleSaveAttendance = async () => {
    if (filteredAttendanceStudents.length === 0) {
      toast.error("No students to mark attendance for.");
      return;
    }

    setSavingAttendance(true);
    const records = filteredAttendanceStudents.map((st) => ({
      studentId: st._id,
      status: attendanceMap[st._id]?.status || "present",
      remarks: attendanceMap[st._id]?.remarks || "",
    }));

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: attendanceDate,
          teacherName,
          records,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Daily attendance for ${records.length} students successfully recorded for ${attendanceDate}.`);
        fetchAttendanceForDate(attendanceDate);
      } else {
        toast.error(data.error || "Failed to save attendance.");
      }
    } catch {
      toast.error("Network error while recording attendance");
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter a lesson topic.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          grade,
          duration,
          subject: subject.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setGeneratedPlan(data.plan);
        toast.success("AI Lesson Plan generated successfully!");
      } else {
        toast.error(data.error || "Failed to generate lesson plan");
      }
    } catch {
      toast.error("Network error while communicating with AI service");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizPrompt.trim()) {
      toast.error("Enter a topic for quiz generation.");
      return;
    }
    setGeneratingQuiz(true);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: quizPrompt.trim(),
          grade,
          count: 3,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setQuizResult(data.questions);
        toast.success("Formative assessment quiz created via Gemini AI!");
      } else {
        toast.error(data.error || "Failed to create assessment quiz");
      }
    } catch {
      toast.error("Network error while communicating with AI quiz service");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // AI Feedback Generator based on score & subject
  const handleGenerateFeedback = () => {
    if (!obtainedMarks) {
      toast.error("Enter obtained marks first to generate contextual feedback.");
      return;
    }

    setGeneratingFeedback(true);
    const score = Number(obtainedMarks);
    const pct = Math.round((score / totalMarks) * 100);

    setTimeout(() => {
      let suggestion = "";
      if (pct >= 90) {
        suggestion = `Exemplary performance in ${gradeSubject}! Demonstrates superior conceptual mastery, analytical precision, and independent problem-solving skills. Highly commended.`;
      } else if (pct >= 80) {
        suggestion = `Strong grasp of core concepts in ${gradeSubject}. Displays consistent analytical rigor with minor room for improvement in multi-step advanced problem formulation.`;
      } else if (pct >= 70) {
        suggestion = `Good academic progress in ${gradeSubject}. Solid foundational understanding shown; targeted revision on complex proof exercises will elevate performance to the next grade bracket.`;
      } else if (pct >= 50) {
        suggestion = `Satisfactory effort in ${gradeSubject}. Basic understanding achieved, but regular conceptual reinforcement and assignment revisions are strongly advised.`;
      } else {
        suggestion = `Requires dedicated academic support and structured revision in ${gradeSubject}. Recommend one-on-one remedial guidance sessions to strengthen foundational gaps.`;
      }

      setTeacherFeedback(suggestion);
      setGeneratingFeedback(false);
      toast.success("AI pedagogical feedback generated!");
    }, 400);
  };

  // Submit Student Marks & Feedback to MongoDB
  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error("Please select a student from the enrolled roster.");
      return;
    }

    if (examStatus === "present" && (obtainedMarks === "" || Number(obtainedMarks) < 0)) {
      toast.error("Please enter valid obtained marks (or mark the student Absent for this subject exam).");
      return;
    }

    const teacherName =
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
          teacherName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          data.message || `Exam record saved successfully for ${data.record.studentName}!`
        );
        await fetchTeacherData();
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

  const gradeClassOptions = (() => {
    const uniqueGrades = Array.from(
      new Set(students.map((st) => st.grade).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return [
      {
        value: "all",
        label: "All Classes",
        badge: `${students.length} ${students.length === 1 ? "student" : "students"}`,
      },
      ...uniqueGrades.map((g) => {
        const count = students.filter((st) => st.grade === g).length;
        return {
          value: g,
          label: g,
          badge: `${count} ${count === 1 ? "student" : "students"}`,
        };
      }),
    ];
  })();

  const studentsInSelectedGradeClass = students.filter(
    (st) => gradeClassFilter === "all" || st.grade === gradeClassFilter
  );

  const gradeSectionOptions = (() => {
    const uniqueSections = Array.from(
      new Set(
        studentsInSelectedGradeClass
          .map((st) => (st.section || "A").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return [
      {
        value: "all",
        label: "All Sections",
        badge: `${studentsInSelectedGradeClass.length}`,
      },
      ...uniqueSections.map((sec) => {
        const count = studentsInSelectedGradeClass.filter(
          (st) => (st.section || "A").trim().toLowerCase() === sec.toLowerCase()
        ).length;
        return {
          value: sec,
          label: `Section ${sec}`,
          badge: `${count}`,
        };
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

    const matchesClass =
      gradeClassFilter === "all" || recGrade === gradeClassFilter;
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
      rosterTermFilter === "all" ||
      (rec.term || "first_term") === rosterTermFilter;
    const q = rosterSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      (rec.studentName || "").toLowerCase().includes(q) ||
      (rec.rollNumber || "").toLowerCase().includes(q) ||
      (rec.subject || "").toLowerCase().includes(q);
    return matchesTerm && matchesQuery;
  });

  const rosterPassedCount = filteredGradeRecords.filter(
    (r) => r.examStatus !== "absent" && (r.resultStatus ? r.resultStatus === "pass" : Number(r.percentage || 0) >= 40)
  ).length;
  const rosterAbsentCount = filteredGradeRecords.filter(
    (r) => r.examStatus === "absent" || r.resultStatus === "absent"
  ).length;
  const rosterFailedCount =
    filteredGradeRecords.length - rosterPassedCount - rosterAbsentCount;
  const rosterAvgPct =
    filteredGradeRecords.length > 0
      ? Math.round(
        filteredGradeRecords.reduce(
          (sum, r) => sum + (r.examStatus === "absent" ? 0 : Number(r.percentage || 0)),
          0
        ) / filteredGradeRecords.length
      )
      : 0;

  const handleGradeClassChange = (val: string) => {
    setGradeClassFilter(val);
    const inClass = students.filter((st) => val === "all" || st.grade === val);
    const hasCurrentSection =
      gradeSectionFilter === "all" ||
      inClass.some(
        (st) =>
          (st.section || "A").trim().toLowerCase() ===
          gradeSectionFilter.toLowerCase()
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
      (st) =>
        sec === "all" ||
        (st.section || "A").trim().toLowerCase() === sec.toLowerCase()
    );
    if (!matching.some((st) => st._id === selectedStudentId)) {
      setSelectedStudentId(matching[0]?._id || "");
    }
  };

  const studentsInAttendanceGrade = students.filter(
    (st) => attendanceGradeFilter === "all" || st.grade === attendanceGradeFilter
  );

  const attendanceSectionOptions = (() => {
    const uniqueSections = Array.from(
      new Set(
        studentsInAttendanceGrade
          .map((st) => (st.section || "A").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return [
      { value: "all", label: "All Sections", badge: `${studentsInAttendanceGrade.length}` },
      ...uniqueSections.map((sec) => ({
        value: sec,
        label: `Section ${sec}`,
        badge: `${studentsInAttendanceGrade.filter((s) => (s.section || "A").trim().toLowerCase() === sec.toLowerCase()).length}`,
      })),
    ];
  })();

  const filteredAttendanceStudents = studentsInAttendanceGrade.filter(
    (st) =>
      attendanceSectionFilter === "all" ||
      (st.section || "A").trim().toLowerCase() === attendanceSectionFilter.toLowerCase()
  );

  const attendanceTotal = filteredAttendanceStudents.length;
  const attendancePresentCount = filteredAttendanceStudents.filter(
    (st) => (attendanceMap[st._id]?.status || "present") === "present"
  ).length;
  const attendanceAbsentCount = filteredAttendanceStudents.filter(
    (st) => attendanceMap[st._id]?.status === "absent"
  ).length;
  const attendanceLateCount = filteredAttendanceStudents.filter(
    (st) => attendanceMap[st._id]?.status === "late"
  ).length;
  const attendanceExcusedCount = filteredAttendanceStudents.filter(
    (st) => attendanceMap[st._id]?.status === "excused"
  ).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Lesson Planner & Pedagogy Suite</h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
              Gemini 2.5 Flash
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Instantly generate curriculum-aligned pedagogy frameworks, formative quizzes, and assessments.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={fetchTeacherData}
          disabled={loadingGrades}
          className="self-start sm:self-auto shrink-0 text-xs"
          title="Refresh workspace data & section assignments"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingGrades ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Notice only when no classes/sections have been assigned yet */}
      {!loadingGrades && assignedClasses.length === 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-start gap-2.5 text-xs">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-800 dark:text-amber-300">
              No Classes or Sections Assigned Yet
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              For student privacy, student records and attendance remain locked until your school administrator assigns your classes &amp; sections.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Responsive Workspace Tabs */}
      <WorkspaceTabs
        activeTab={activeTab}
        onChange={switchTab}
        tabs={[
          {
            id: "planner",
            label: "AI Lesson Planner",
            shortLabel: "Lesson AI",
            icon: BrainCircuit,
          },
          {
            id: "quiz",
            label: "Quiz Maker",
            shortLabel: "Quizzes",
            icon: HelpCircle,
          },
          {
            id: "gradebook",
            label: "Marks & Feedback",
            shortLabel: "Marks",
            icon: Award,
            badge: gradeRecords.length > 0 ? gradeRecords.length : null,
          },
          {
            id: "attendance",
            label: "Daily Attendance",
            shortLabel: "Attendance",
            icon: CalendarCheck,
          },
          {
            id: "schedules",
            label: "Schedules & Files",
            shortLabel: "Schedules",
            icon: Clock,
          },
        ]}
      />

      {/* TAB 1: AI LESSON PLANNER */}
      {activeTab === "planner" && (
        <div id="planner" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-20">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Lesson Generator Form */}
            <div className="rounded-2xl border bg-card p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-base">Lesson Configuration</h2>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="lesson-topic" className="font-semibold text-foreground block mb-1.5">
                    Lesson Topic or Concept <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="lesson-topic"
                    name="lessonTopic"
                    type="text"
                    autoComplete="off"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Photosynthesis & Cellular Respiration, Calculus Integrals..."
                    className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lesson-subject" className="font-semibold text-foreground block mb-1.5">
                    Subject & Discipline
                  </label>
                  <input
                    id="lesson-subject"
                    name="subject"
                    type="text"
                    autoComplete="off"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Biology, General Science, World History"
                    className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="lesson-grade" className="font-semibold text-foreground block mb-1.5">Grade Level</label>
                    <CustomSelect
                      name="lessonGrade"
                      value={grade}
                      onChange={(val) => setGrade(val)}
                      options={GRADE_LEVEL_OPTIONS}
                    />
                  </div>

                  <div>
                    <label htmlFor="lesson-duration" className="font-semibold text-foreground block mb-1.5">Class Duration</label>
                    <CustomSelect
                      name="lessonDuration"
                      value={duration}
                      onChange={(val) => setDuration(val)}
                      options={DURATION_OPTIONS}
                    />
                  </div>
                </div>

                <Button type="submit" size="sm" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Synthesizing Curriculum...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="mr-2 h-4 w-4" />
                      Generate AI Lesson Plan
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Output Column */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border bg-card p-6 shadow-xs h-full flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-base">Lesson Architecture & Scaffold</h2>
                </div>
                {generatedPlan && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => copyToClipboard(JSON.stringify(generatedPlan, null, 2))}
                    className="gap-1 text-xs"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Plan</span>
                  </Button>
                )}
              </div>

              {!generatedPlan && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                  <BrainCircuit className="h-12 w-12 stroke-[1.2] text-muted-foreground/40 mb-3" />
                  <h3 className="font-semibold text-foreground text-sm">No Plan Generated Yet</h3>
                  <p className="text-xs max-w-sm mt-1">
                    Fill in the lesson parameters on the left and click &quot;Generate AI Lesson Plan&quot; to produce a full curriculum structure.
                  </p>
                </div>
              )}

              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p className="text-sm font-semibold">Gemini AI is crafting your lesson plan...</p>
                  <p className="text-xs text-muted-foreground mt-1">Aligning objectives, time allocation, and assessment criteria.</p>
                </div>
              )}

              {generatedPlan && !loading && (
                <div className="space-y-5 text-xs">
                  <div>
                    <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-primary">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Learning Objectives
                    </h4>
                    <ul className="space-y-1.5 pl-1">
                      {generatedPlan.objectives?.map((obj: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-muted-foreground">
                          <span className="font-bold text-foreground">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      Lesson Content & Timeline
                    </h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/20 border rounded-xl p-4 whitespace-pre-line text-foreground/90 font-mono text-xs leading-relaxed">
                      {generatedPlan.content}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-primary">
                      <ListOrdered className="h-3.5 w-3.5" />
                      Formative Assessment Questions
                    </h4>
                    <ol className="space-y-1.5 pl-1">
                      {generatedPlan.assessmentQuestions?.map((q: string, i: number) => (
                        <li key={i} className="text-muted-foreground">
                          <span className="font-semibold text-foreground mr-1.5">{i + 1}.</span>
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {generatedPlan.homework && (
                    <div className="pt-2 border-t">
                      <span className="font-bold text-foreground mr-2">Assigned Homework:</span>
                      <span className="text-muted-foreground">{generatedPlan.homework}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FORMATIVE QUIZ MAKER */}
      {activeTab === "quiz" && (
        <div id="quiz" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-20">
          <div className="lg:col-span-5">
            <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-base">Instant Formative Quiz Maker</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Draft a 3-question formative assessment via Gemini AI for your exit tickets, flashcards, or pop quizzes.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label htmlFor="quiz-topic" className="font-semibold text-foreground block mb-1">
                    Quiz Topic or Concept *
                  </label>
                  <input
                    id="quiz-topic"
                    name="quizTopic"
                    type="text"
                    autoComplete="off"
                    value={quizPrompt}
                    onChange={(e) => setQuizPrompt(e.target.value)}
                    placeholder="Enter topic e.g. Newton's 3rd Law, Photosynthesis..."
                    className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => e.key === "Enter" && handleGenerateQuiz()}
                  />
                </div>

                <Button size="sm" onClick={handleGenerateQuiz} disabled={generatingQuiz} className="w-full">
                  {generatingQuiz ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Quiz via AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Formative Quiz
                    </>
                  )}
                </Button>

                <div className="pt-2 border-t">
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">Suggested Prompts:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Newton's Laws", "Quadratic Equations", "Cellular Respiration", "Python Loops", "Pakistan Movement"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setQuizPrompt(chip)}
                        className="text-[10px] px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors font-medium"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border bg-card p-6 shadow-xs h-full flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b mb-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-base">Generated Formative Questions</h2>
                </div>
                {quizResult && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => copyToClipboard(quizResult.join("\n\n"))}
                    className="gap-1 text-xs"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Questions</span>
                  </Button>
                )}
              </div>

              {!quizResult && !generatingQuiz && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 stroke-[1.2] text-muted-foreground/40 mb-3" />
                  <h3 className="font-semibold text-foreground text-sm">No Quiz Generated Yet</h3>
                  <p className="text-xs max-w-sm mt-1">
                    Enter a concept on the left and click &quot;Generate Formative Quiz&quot; to synthesize rapid checks for understanding.
                  </p>
                </div>
              )}

              {generatingQuiz && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p className="text-sm font-semibold">Gemini AI is crafting your assessment...</p>
                  <p className="text-xs text-muted-foreground mt-1">Formulating multiple-choice questions and answer keys.</p>
                </div>
              )}

              {quizResult && !generatingQuiz && (
                <div className="space-y-4 text-xs">
                  {quizResult.map((q, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-muted/20 border space-y-1.5">
                      <div className="font-bold text-foreground flex items-center gap-1.5 text-xs text-primary">
                        <CheckCircle className="h-3.5 w-3.5" /> Question {i + 1}
                      </div>
                      <p className="text-foreground text-xs leading-relaxed whitespace-pre-line">{q}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT MARKS, GRADING & FORMATIVE FEEDBACK */}
      {activeTab === "gradebook" && (
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
              onClick={fetchTeacherData}
              disabled={loadingGrades}
              className="self-start sm:self-auto shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingGrades ? "animate-spin" : ""}`} />
              Refresh Records
            </Button>
          </div>

          {/* Input Form & Preview Grid */}
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

              {/* Per-Subject Exam Attendance Toggle */}
              <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Exam Attendance ({gradeSubject}) *
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Subject-level presence
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExamStatus("present")}
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
                      setExamStatus("absent");
                      setObtainedMarks("0");
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
                  onChange={(e) => setAssessmentTitle(e.target.value)}
                  placeholder="e.g. First Term Exam, 2nd / Mid-Term Exam, Final Term Exam"
                  className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="total-marks" className="block font-semibold mb-1 text-foreground">Total Marks</label>
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
                  <label htmlFor="teacher-feedback" className="font-semibold text-foreground">Teacher Pedagogical Feedback / Remarks</label>
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

            {/* Gradebook Live History Panel (Zero horizontal scrollbar on all viewports) */}
            <div className="xl:col-span-7 min-w-0 flex flex-col rounded-xl border bg-card shadow-2xs">
              {/* Roster Top Header & Controls */}
              <div className="p-3.5 sm:p-4 border-b bg-muted/20 rounded-t-xl space-y-3">
                {/* Row 1: Title + Active Scope Pills */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="font-bold text-xs sm:text-sm text-foreground truncate">
                      Live Recorded Marks &amp; Feedback Roster
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                      {filteredGradeRecords.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-background border text-muted-foreground font-medium">
                      {gradeClassFilter === "all" ? "All Classes" : gradeClassFilter}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-background border text-muted-foreground font-medium">
                      {gradeSectionFilter === "all"
                        ? "All Sections"
                        : `Section ${gradeSectionFilter}`}
                    </span>
                    {(gradeClassFilter !== "all" ||
                      gradeSectionFilter !== "all" ||
                      rosterSearch.trim() !== "") && (
                        <button
                          type="button"
                          onClick={() => {
                            setGradeClassFilter("all");
                            setGradeSectionFilter("all");
                            setRosterSearch("");
                          }}
                          className="text-primary font-semibold hover:underline px-1"
                        >
                          Reset
                        </button>
                      )}
                  </div>
                </div>

                {/* Row 2: Balanced Search + Exam Term Dropdown */}
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
                      onChange={(e) => setRosterSearch(e.target.value)}
                      placeholder="Search student, roll #, or subject..."
                      className="w-full h-8.5 rounded-lg border bg-background pl-8 pr-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="min-w-0">
                    <CustomSelect
                      name="rosterTermFilter"
                      value={rosterTermFilter}
                      onChange={(val) =>
                        setRosterTermFilter(
                          val as
                          | "all"
                          | "first_term"
                          | "mid_term"
                          | "final_term"
                          | "class_test"
                        )
                      }
                      options={rosterTermOptions}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Row 3: Dynamic Term Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-lg border bg-background px-2.5 py-1.5 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Passed</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {rosterPassedCount}
                    </span>
                  </div>
                  <div className="rounded-lg border bg-background px-2.5 py-1.5 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Failed</span>
                    <span className="text-xs font-bold text-destructive">
                      {rosterFailedCount}
                    </span>
                  </div>
                  <div className="rounded-lg border bg-background px-2.5 py-1.5 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Absent</span>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {rosterAbsentCount}
                    </span>
                  </div>
                  <div className="rounded-lg border bg-background px-2.5 py-1.5 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Avg Score</span>
                    <span className="text-xs font-bold text-primary">
                      {filteredGradeRecords.length > 0 ? `${rosterAvgPct}%` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column Header Bar (Desktop >= sm, Zero Horizontal Scroll) */}
              {filteredGradeRecords.length > 0 && (
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2 border-b bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <div className="col-span-5">Student &amp; Class</div>
                  <div className="col-span-4">Subject &amp; Attendance</div>
                  <div className="col-span-3 text-right">Score &amp; Result</div>
                </div>
              )}

              {/* Fluid Zero-Overflow Record Rows (All Viewports — Zero Horizontal Scrollbar) */}
              <div className="divide-y rounded-b-xl">
                {filteredGradeRecords.length > 0 ? (
                  filteredGradeRecords.map((rec, i) => {
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
                        className={`p-3.5 sm:px-4 sm:py-3 space-y-2 text-xs transition-colors ${isAbsent
                          ? "bg-destructive/5 hover:bg-destructive/10"
                          : "hover:bg-muted/25"
                          }`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center">
                          {/* Zone 1: Student Identity */}
                          <div className="sm:col-span-5 min-w-0">
                            <div className="font-semibold text-foreground truncate">
                              {rec.studentName}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                              {rec.rollNumber}
                              {rec.classSection ? ` • ${rec.classSection}` : ""}
                            </div>
                          </div>

                          {/* Zone 2: Subject, Term & Exam Attendance */}
                          <div className="sm:col-span-4 min-w-0">
                            <div className="font-semibold text-foreground truncate">
                              {rec.subject}
                            </div>
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

                          {/* Zone 3: Score, Grade & Pass/Fail Status */}
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

                        {/* Full-Width Natural-Wrap Teacher Remarks */}
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
                      {rosterTermFilter === "all"
                        ? "any term"
                        : EXAM_TERM_LABELS[rosterTermFilter]}
                    </p>
                    <p className="text-[11px] max-w-xs mx-auto mt-0.5">
                      Use the form on the left to record exam marks or switch the Exam Term dropdown above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DAILY ATTENDANCE REGISTER */}
      {activeTab === "attendance" && (
        <div id="attendance" className="scroll-mt-20 rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight">Daily Student Attendance Register</h2>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    Live Attendance
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mark classroom roll call, tardiness, and verified absences directly to institutional records.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-40">
                <CustomDatePicker
                  id="attendance-date"
                  name="attendanceDate"
                  value={attendanceDate}
                  onChange={(val) => setAttendanceDate(val)}
                  placeholder="Select date"
                  size="sm"
                />
              </div>

              <div className="w-36">
                <CustomSelect
                  value={attendanceGradeFilter}
                  onChange={(val) => {
                    setAttendanceGradeFilter(val);
                    setAttendanceSectionFilter("all");
                  }}
                  options={gradeClassOptions}
                  size="sm"
                />
              </div>

              <div className="w-36">
                <CustomSelect
                  value={attendanceSectionFilter}
                  onChange={(val) => setAttendanceSectionFilter(val)}
                  options={attendanceSectionOptions}
                  size="sm"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => handleMarkAllAttendance("present")}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30"
              >
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Mark All Present
              </Button>
            </div>
          </div>

          {/* Live Attendance Counter KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl border bg-muted/30">
              <span className="text-[11px] text-muted-foreground block font-medium">Roster Total</span>
              <span className="text-xl font-bold text-foreground">{attendanceTotal}</span>
              <span className="text-[10px] text-muted-foreground block">Active learners</span>
            </div>

            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Present
              </span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{attendancePresentCount}</span>
              <span className="text-[10px] text-emerald-600/80 block font-medium">
                {attendanceTotal > 0 ? Math.round((attendancePresentCount / attendanceTotal) * 100) : 0}% attendance
              </span>
            </div>

            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5">
              <span className="text-[11px] text-rose-700 dark:text-rose-400 block font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Absent
              </span>
              <span className="text-xl font-bold text-rose-700 dark:text-rose-400">{attendanceAbsentCount}</span>
              <span className="text-[10px] text-rose-600/80 block font-medium">Unexcused</span>
            </div>

            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <span className="text-[11px] text-amber-700 dark:text-amber-400 block font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> Late
              </span>
              <span className="text-xl font-bold text-amber-700 dark:text-amber-400">{attendanceLateCount}</span>
              <span className="text-[10px] text-amber-600/80 block font-medium">Tardy</span>
            </div>

            <div className="p-3 rounded-xl border border-sky-500/20 bg-sky-500/5 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-sky-700 dark:text-sky-400 block font-medium flex items-center gap-1">
                <UserCheck className="h-3 w-3" /> Excused
              </span>
              <span className="text-xl font-bold text-sky-700 dark:text-sky-400">{attendanceExcusedCount}</span>
              <span className="text-[10px] text-sky-600/80 block font-medium">Official leave</span>
            </div>
          </div>

          {/* Student Attendance Marking Table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class & Section</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4">Remarks / Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAttendanceStudents.length > 0 ? (
                    filteredAttendanceStudents.map((st) => {
                      const currentStatus = attendanceMap[st._id]?.status || "present";
                      const currentRemarks = attendanceMap[st._id]?.remarks || "";
                      const initials = st.name
                        .split(" ")
                        .filter(Boolean)
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "ST";

                      return (
                        <tr key={st._id} className="hover:bg-muted/15 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                                {initials}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground text-xs leading-tight">{st.name}</div>
                                <div className="text-[10px] font-mono text-muted-foreground">{st.rollNumber}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-medium">
                              {st.grade} • Sec {st.section}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="inline-flex rounded-lg border bg-muted/50 p-0.5 gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleAttendanceStatusChange(st._id, "present")}
                                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${currentStatus === "present"
                                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                                  : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                                  }`}
                              >
                                Present
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAttendanceStatusChange(st._id, "absent")}
                                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${currentStatus === "absent"
                                  ? "bg-rose-600 text-white font-semibold shadow-xs"
                                  : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                                  }`}
                              >
                                Absent
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAttendanceStatusChange(st._id, "late")}
                                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${currentStatus === "late"
                                  ? "bg-amber-600 text-white font-semibold shadow-xs"
                                  : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                                  }`}
                              >
                                Late
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAttendanceStatusChange(st._id, "excused")}
                                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${currentStatus === "excused"
                                  ? "bg-sky-600 text-white font-semibold shadow-xs"
                                  : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                                  }`}
                              >
                                Excused
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <input
                              type="text"
                              name={`attendanceRemark_${st._id}`}
                              aria-label={`Attendance remark for ${st.name}`}
                              placeholder="Optional remark (e.g. Sick, Doctor appointment)..."
                              value={currentRemarks}
                              onChange={(e) => handleAttendanceRemarksChange(st._id, e.target.value)}
                              className="w-full h-8 rounded-lg border bg-background px-2.5 text-xs outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground">
                        <CalendarCheck className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="font-medium text-foreground text-xs">No students found</p>
                        <p className="text-[11px] max-w-xs mx-auto mt-0.5">
                          Ensure students are enrolled in Admin Hub with the selected grade filter.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Submission Bar */}
            <div className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span>
                  Ready to commit attendance for <strong className="text-foreground">{attendanceTotal}</strong> students for Date:{" "}
                  <strong className="text-foreground">{attendanceDate}</strong>
                </span>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleSaveAttendance}
                disabled={savingAttendance || filteredAttendanceStudents.length === 0}
                className="shadow-sm font-semibold h-9 px-5"
              >
                {savingAttendance ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Attendance Records...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    Save Daily Attendance Records
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TIMETABLE, SYLLABUS & DATE SHEETS (FROM COORDINATOR) */}
      {activeTab === "schedules" && (
        <div id="schedules" className="scroll-mt-20">
          <CampusDocumentsPanel portalLabel="Faculty Timetable, Syllabus & Exam Date Sheets" />
        </div>
      )}
    </div>
  );
}
