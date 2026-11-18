"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BrainCircuit,
  Clock,
  HelpCircle,
  Award,
  RefreshCw,
  CalendarCheck,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { CampusDocumentsPanel } from "@/components/campus-documents-panel";
import { usePortalTab } from "@/hooks/use-portal-tab";
import { useClientAuth } from "@/hooks/use-client-auth";
import type { GradebookEntryRecord, StudentDomainRecord } from "@/lib/domain-types";
import { LessonPlannerTab } from "@/components/teacher/lesson-planner-tab";
import { QuizMakerTab } from "@/components/teacher/quiz-maker-tab";
import { GradebookTab } from "@/components/teacher/gradebook-tab";
import { TeacherAttendanceTab } from "@/components/teacher/attendance-tab";
import { TeacherAssignmentsTab } from "@/components/teacher/assignments-tab";

type TeacherTab = "planner" | "quiz" | "homework" | "gradebook" | "attendance" | "schedules";
const TEACHER_TABS: readonly TeacherTab[] = [
  "planner",
  "quiz",
  "homework",
  "gradebook",
  "attendance",
  "schedules",
] as const;

export default function TeacherPage() {
  const [activeTab, switchTab] = usePortalTab<TeacherTab>(TEACHER_TABS, "planner");

  const [grade, setGrade] = useState("Grade 9");
  const [students, setStudents] = useState<StudentDomainRecord[]>([]);
  const [gradeRecords, setGradeRecords] = useState<GradebookEntryRecord[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const { name: teacherName } = useClientAuth({ name: "Faculty Educator" });
  const [assignedClasses, setAssignedClasses] = useState<
    Array<{ grade: string; section: string }>
  >([]);

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

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const gradeClassOptions = useMemo(() => {
    const uniqueGrades = Array.from(new Set(students.map((st) => st.grade).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b, undefined, { numeric: true })
    );

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
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              AI Lesson Planner & Pedagogy Suite
            </h1>
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

      {/* Workspace Tabs */}
      <WorkspaceTabs
        activeTab={activeTab}
        onChange={switchTab}
        tabs={[
          { id: "planner", label: "AI Lesson Planner", shortLabel: "Lesson AI", icon: BrainCircuit },
          { id: "quiz", label: "Quiz Maker", shortLabel: "Quizzes", icon: HelpCircle },
          { id: "homework", label: "Homework", shortLabel: "Homework", icon: FileText },
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
          { id: "schedules", label: "Schedules & Files", shortLabel: "Schedules", icon: Clock },
        ]}
      />

      {/* Tab Views */}
      {activeTab === "planner" && <LessonPlannerTab grade={grade} onGradeChange={setGrade} />}

      {activeTab === "quiz" && <QuizMakerTab grade={grade} />}

      {activeTab === "homework" && <TeacherAssignmentsTab assignedClasses={assignedClasses} />}

      {activeTab === "gradebook" && (
        <GradebookTab
          students={students}
          gradeRecords={gradeRecords}
          gradeClassOptions={gradeClassOptions}
          loadingGrades={loadingGrades}
          onRefresh={fetchTeacherData}
        />
      )}

      {activeTab === "attendance" && (
        <TeacherAttendanceTab
          students={students}
          gradeClassOptions={gradeClassOptions}
          teacherName={teacherName}
        />
      )}

      {activeTab === "schedules" && (
        <div id="schedules" className="scroll-mt-20">
          <CampusDocumentsPanel portalLabel="Faculty Timetable, Syllabus & Exam Date Sheets" />
        </div>
      )}
    </div>
  );
}
