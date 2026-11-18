"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  FileText,
  Award,
  BrainCircuit,
  GraduationCap,
  Users,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { CampusDocumentsPanel } from "@/components/campus-documents-panel";
import { usePortalTab } from "@/hooks/use-portal-tab";
import { useClientAuth } from "@/hooks/use-client-auth";
import { getInitials } from "@/lib/format";
import { calculateAcademicStanding } from "@/lib/academics";
import type { AttendanceStatsRecord, StudentDomainRecord } from "@/lib/domain-types";
import { StudentTimetableTab } from "@/components/student/timetable-tab";
import {
  StudentAssignmentsTab,
  type StudentAssignment,
} from "@/components/student/assignments-tab";
import { StudentGradesTab } from "@/components/student/grades-tab";
import { StudentStudyAiTab } from "@/components/student/study-ai-tab";

type StudentTab = "timetable" | "schedules" | "assignments" | "grades" | "study-ai";
const STUDENT_TABS: readonly StudentTab[] = [
  "timetable",
  "schedules",
  "assignments",
  "grades",
  "study-ai",
] as const;

export default function StudentPage() {
  const [activeTab, switchTab] = usePortalTab<StudentTab>(STUDENT_TABS, "timetable");

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentDomainRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { institution: institutionName } = useClientAuth();
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [togglingAssignmentId, setTogglingAssignmentId] = useState<string | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStatsRecord | null>(null);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.students)) {
        setStudents(data.students);
      }
    } catch {
      toast.error("Failed to load student profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const activeStudent = students[selectedIndex] || null;

  const fetchStudentAuxData = async (studentId: string) => {
    const [attRes, asgRes] = await Promise.all([
      fetch(`/api/attendance?studentId=${studentId}`, { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => null),
      fetch(`/api/assignments?studentId=${studentId}`, { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => null),
    ]);
    if (attRes?.success && attRes.stats) setAttendanceStats(attRes.stats);
    if (asgRes?.success && Array.isArray(asgRes.assignments)) {
      setAssignments(asgRes.assignments);
    }
  };

  useEffect(() => {
    if (activeStudent?._id) {
      fetchStudentAuxData(activeStudent._id);
    }
  }, [activeStudent?._id]);

  const toggleAssignmentStatus = async (id: string, currentStatus: "pending" | "submitted") => {
    setTogglingAssignmentId(id);
    try {
      const res = await fetch("/api/assignments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: id,
          action: currentStatus === "submitted" ? "unsubmit" : "submit",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextStatus = data.status as "pending" | "submitted";
        setAssignments((prev) =>
          prev.map((asg) =>
            asg.id === id
              ? {
                ...asg,
                status: nextStatus,
                submittedAt: nextStatus === "submitted" ? new Date().toISOString() : null,
              }
              : asg
          )
        );
        toast.success(
          nextStatus === "submitted"
            ? "Homework marked as Submitted and saved!"
            : "Homework reopened as Pending."
        );
      } else {
        toast.error(data.error || "Unable to update submission.");
      }
    } catch {
      toast.error("Network error while updating homework submission.");
    } finally {
      setTogglingAssignmentId(null);
    }
  };

  const standing = calculateAcademicStanding(activeStudent?.academicRecords);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Student Learning Portal</h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
              {institutionName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your personalized academic workspace: live class timetable, homework submissions, report cards, and AI study coach.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStudentData();
              if (activeStudent?._id) fetchStudentAuxData(activeStudent._id);
            }}
            disabled={loading}
            title="Refresh Records"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-xs">
          <RefreshCw className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
          <p className="text-sm font-semibold">Loading your student workspace...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Retrieving timetable, grades, and active assignments.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && students.length === 0 && (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-xs">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h2 className="text-lg font-bold text-foreground">No Student Profile Enrolled</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-6">
            There are currently no active students registered. Please contact your school administrator or enroll a student via the Admin Hub.
          </p>
          <Link href="/admin">
            <Button size="sm">
              <UserCheck className="mr-1.5 h-4 w-4" /> Go to Admin Hub
            </Button>
          </Link>
        </div>
      )}

      {/* Populated Student Workspace */}
      {!loading && activeStudent && (
        <>
          {students.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border shadow-2xs">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Switch Student Learning Profile:
                </span>
              </div>
              <div className="w-full sm:w-80">
                <CustomSelect
                  value={students[selectedIndex]?._id || ""}
                  onChange={(val) => {
                    const idx = students.findIndex((s) => s._id === val);
                    if (idx !== -1) setSelectedIndex(idx);
                  }}
                  options={students.map((st) => ({
                    value: st._id,
                    label: st.name,
                    sublabel: `${st.grade} (${st.section}) • Roll #${st.rollNumber}`,
                    badge: st.grade,
                  }))}
                  size="sm"
                />
              </div>
            </div>
          )}

          {/* Student Profile Hero Card (100% Live Metrics) */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl uppercase shadow-xs">
                {getInitials(activeStudent.name, "ST")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{activeStudent.name}</h2>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-semibold">
                    Enrolled Student
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Roll Number:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {activeStudent.rollNumber}
                  </span>{" "}
                  • {activeStudent.grade} - Section {activeStudent.section}
                </p>
                <p className="text-xs text-muted-foreground">{institutionName}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 text-center md:text-left">
              <div>
                <span className="text-[11px] text-muted-foreground block">Term GPA</span>
                <span className="text-lg font-bold text-foreground">
                  {standing.hasRecords ? `${standing.gpa} / 4.0` : "—"}
                </span>
                <span
                  className={`block text-[10px] font-semibold ${!standing.hasRecords
                    ? "text-muted-foreground"
                    : standing.passed
                      ? "text-emerald-600"
                      : "text-destructive"
                    }`}
                >
                  {standing.hasRecords
                    ? `Grade ${standing.letterGrade} (${standing.overallPct}%)`
                    : "No Exams Yet"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Attendance</span>
                <span className="text-lg font-bold text-foreground">
                  {attendanceStats && (attendanceStats.total ?? 0) > 0
                    ? `${attendanceStats.attendancePercentage ?? 0}%`
                    : "—"}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {attendanceStats && (attendanceStats.total ?? 0) > 0
                    ? `${attendanceStats.present}/${attendanceStats.total ?? 0} Sessions`
                    : "No Roll Calls Yet"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Assignments</span>
                <span className="text-lg font-bold text-foreground">
                  {assignments.filter((a) => a.status === "submitted").length}/{assignments.length}
                </span>
                <span className="block text-[10px] text-primary font-medium">
                  {assignments.length > 0 ? "Completed" : "None Assigned"}
                </span>
              </div>
            </div>
          </div>

          {/* Workspace Tabs */}
          <WorkspaceTabs
            activeTab={activeTab}
            onChange={switchTab}
            tabs={[
              { id: "timetable", label: "Class Timetable", shortLabel: "Timetable", icon: Calendar },
              { id: "schedules", label: "Schedules & Files", shortLabel: "Files", icon: Clock },
              {
                id: "assignments",
                label: "Homework & Tasks",
                shortLabel: "Tasks",
                icon: FileText,
                badge:
                  assignments.filter((a) => a.status === "pending").length > 0
                    ? `${assignments.filter((a) => a.status === "pending").length} Due`
                    : null,
                badgeTone: "warning",
              },
              { id: "grades", label: "Report Card", shortLabel: "Grades", icon: Award },
              { id: "study-ai", label: "AI Study Coach", shortLabel: "Study AI", icon: BrainCircuit },
            ]}
          />

          {activeTab === "timetable" && (
            <StudentTimetableTab grade={activeStudent.grade} section={activeStudent.section} />
          )}

          {activeTab === "assignments" && (
            <StudentAssignmentsTab
              assignments={assignments}
              togglingId={togglingAssignmentId}
              onToggleStatus={toggleAssignmentStatus}
            />
          )}

          {activeTab === "grades" && <StudentGradesTab student={activeStudent} />}

          {activeTab === "study-ai" && <StudentStudyAiTab grade={activeStudent.grade} />}
        </>
      )}

      {!loading && activeTab === "schedules" && (
        <div id="schedules" className="scroll-mt-20">
          <CampusDocumentsPanel
            portalLabel="Student Timetable, Syllabus & Exam Date Sheets"
            defaultGradeFilter="ALL"
          />
        </div>
      )}
    </div>
  );
}
