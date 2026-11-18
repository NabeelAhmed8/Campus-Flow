"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Award,
  Sparkles,
  BrainCircuit,
  Bell,
  GraduationCap,
  Users,
  Search,
  Check,
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { CampusDocumentsPanel } from "@/components/campus-documents-panel";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  points: number;
  status: "pending" | "submitted";
  teacher: string;
}

const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: "asg-1",
    title: "Chapter 4: Cell Respiration & ATP Worksheet",
    subject: "Biology",
    dueDate: "Tomorrow, 05:00 PM",
    points: 25,
    status: "pending",
    teacher: "Dr. Tariq Mahmood",
  },
  {
    id: "asg-2",
    title: "Exercise 3.2: Quadratic Formula & Polynomials",
    subject: "Mathematics",
    dueDate: "Nov 22, 2026",
    points: 30,
    status: "submitted",
    teacher: "Mr. Farooq Raza",
  },
  {
    id: "asg-3",
    title: "Essay: Industrial Revolution Impact on Modern Economy",
    subject: "English Literature",
    dueDate: "Nov 24, 2026",
    points: 50,
    status: "pending",
    teacher: "Mrs. Hina Khan",
  },
  {
    id: "asg-4",
    title: "Lab Report: Measuring Gravitational Acceleration (g)",
    subject: "Physics",
    dueDate: "Nov 26, 2026",
    points: 40,
    status: "submitted",
    teacher: "Ms. Ayesha Noor",
  },
];

const TIMETABLE = [
  { period: "Period 1", time: "08:30 - 09:15 AM", subject: "Mathematics", room: "Rm 204", teacher: "Mr. Farooq Raza", active: false },
  { period: "Period 2", time: "09:20 - 10:05 AM", subject: "Physics", room: "Physics Lab B", teacher: "Ms. Ayesha Noor", active: true },
  { period: "Period 3", time: "10:10 - 10:55 AM", subject: "English Literature", room: "Rm 102", teacher: "Mrs. Hina Khan", active: false },
  { period: "Break", time: "10:55 - 11:20 AM", subject: "Recess & Refreshment", room: "Cafeteria / Courtyard", teacher: "-", active: false },
  { period: "Period 4", time: "11:20 - 12:05 PM", subject: "Biology", room: "Bio Lab 1", teacher: "Dr. Tariq Mahmood", active: false },
  { period: "Period 5", time: "12:10 - 12:55 PM", subject: "Computer Science", room: "Computer Lab A", teacher: "Sir Hamza Siddiqui", active: false },
  { period: "Period 6", time: "01:00 - 01:45 PM", subject: "Pakistan Studies", room: "Rm 201", teacher: "Prof. Asad Ullah", active: false },
];

const GRADE_REPORT = [
  { subject: "Mathematics", score: 92, grade: "A+", credits: 4, remarks: "Exceptional analytical proficiency" },
  { subject: "Physics", score: 86, grade: "A", credits: 4, remarks: "Strong experimental execution" },
  { subject: "Biology", score: 89, grade: "A", credits: 4, remarks: "Active inquiry & textbook mastery" },
  { subject: "English Literature", score: 94, grade: "A+", credits: 3, remarks: "Outstanding critical essay writing" },
  { subject: "Computer Science", score: 96, grade: "A+", credits: 3, remarks: "Superior algorithmic problem-solving" },
  { subject: "Pakistan Studies", score: 84, grade: "B+", credits: 2, remarks: "Good historical comprehension" },
];

export default function StudentPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"timetable" | "schedules" | "assignments" | "grades" | "study-ai">("timetable");
  const [institutionName, setInstitutionName] = useState("St. Jude Collegiate Academy");

  // Assignments State
  const [assignments, setAssignments] = useState<Assignment[]>(DEFAULT_ASSIGNMENTS);
  const [assignmentFilter, setAssignmentFilter] = useState("all");

  // Gemini AI Study Buddy State
  const [studyTopic, setStudyTopic] = useState("");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [studyQuestions, setStudyQuestions] = useState<string[] | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("campusflow_institution");
      if (saved) setInstitutionName(saved);

      const handleUpdate = () => {
        const updated = localStorage.getItem("campusflow_institution");
        if (updated) setInstitutionName(updated);
      };
      window.addEventListener("campusflow_institution_updated", handleUpdate);

      const handleTabSync = (e?: any) => {
        if (e && "detail" in e && (e.detail?.tab || e.detail?.tabKey)) {
          const t = e.detail.tab || e.detail.tabKey;
          if (t === "timetable" || t === "schedules" || t === "assignments" || t === "grades" || t === "study-ai") {
            setActiveTab(t as any);
            return;
          }
        }
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab === "timetable" || tab === "schedules" || tab === "assignments" || tab === "grades" || tab === "study-ai") {
          setActiveTab(tab as any);
        } else {
          setActiveTab("timetable");
        }
      };
      handleTabSync();
      window.addEventListener("popstate", handleTabSync);
      window.addEventListener("campusflow_tab_change", handleTabSync);

      return () => {
        window.removeEventListener("campusflow_institution_updated", handleUpdate);
        window.removeEventListener("popstate", handleTabSync);
        window.removeEventListener("campusflow_tab_change", handleTabSync);
      };
    }
  }, []);

  const switchTab = (tab: "timetable" | "schedules" | "assignments" | "grades" | "study-ai") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `?tab=${tab}`);
      window.dispatchEvent(new CustomEvent("campusflow_tab_change", { detail: { tab } }));
    }
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students");
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
  const [attendanceStats, setAttendanceStats] = useState<any>(null);

  useEffect(() => {
    if (activeStudent?._id) {
      fetch(`/api/attendance?studentId=${activeStudent._id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.stats) {
            setAttendanceStats(d.stats);
          }
        })
        .catch(() => { });
    }
  }, [activeStudent?._id]);

  const toggleAssignmentStatus = (id: string) => {
    setAssignments((prev) =>
      prev.map((asg) => {
        if (asg.id === id) {
          const nextStatus = asg.status === "submitted" ? "pending" : "submitted";
          toast.success(
            nextStatus === "submitted"
              ? `Marked "${asg.title}" as Submitted!`
              : `Reopened "${asg.title}" as Pending`
          );
          return { ...asg, status: nextStatus };
        }
        return asg;
      })
    );
  };

  const handleGenerateStudyQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyTopic.trim()) {
      toast.error("Please enter a subject or topic to study.");
      return;
    }

    setGeneratingQuiz(true);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: studyTopic.trim(),
          grade: activeStudent?.grade || "Grade 9",
          count: 4,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setStudyQuestions(data.questions);
        toast.success("AI Practice Flashcards created via Gemini!");
      } else {
        toast.error(data.error || "Failed to generate study practice questions");
      }
    } catch {
      toast.error("Network error while reaching AI study service");
    } finally {
      setGeneratingQuiz(false);
    }
  };

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
            Your personalized academic workspace: class timetable, homework submissions, report cards, and AI study coach.
          </p>
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={fetchStudentData} disabled={loading} title="Refresh Records">
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
          <p className="text-xs text-muted-foreground mt-1">Retrieving timetable, grades, and active assignments.</p>
        </div>
      )}

      {/* Empty State: No students in database */}
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
          {/* Dynamic & Responsive Multi-Student Selector */}
          {students.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border shadow-2xs">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Switch Student Learning Profile:</span>
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

          {/* Student Profile Hero Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl uppercase shadow-xs">
                {activeStudent.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{activeStudent.name}</h2>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-semibold">
                    Enrolled Student
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Roll Number: <span className="font-mono font-medium text-foreground">{activeStudent.rollNumber}</span> •{" "}
                  {activeStudent.grade} - Section {activeStudent.section}
                </p>
                <p className="text-xs text-muted-foreground">{institutionName} • Academic Year 2026-2027</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 text-center md:text-left">
              <div>
                <span className="text-[11px] text-muted-foreground block">Term GPA</span>
                <span className="text-lg font-bold text-foreground">3.88 / 4.0</span>
                <span className="block text-[10px] text-emerald-600 font-semibold">Grade A+</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Attendance</span>
                <span className="text-lg font-bold text-foreground">
                  {attendanceStats && attendanceStats.total > 0
                    ? `${attendanceStats.attendancePercentage}%`
                    : "100%"}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {attendanceStats && attendanceStats.total > 0
                    ? `${attendanceStats.present}/${attendanceStats.total} Sessions`
                    : "Good Standing"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Assignments</span>
                <span className="text-lg font-bold text-foreground">
                  {assignments.filter((a) => a.status === "submitted").length}/{assignments.length}
                </span>
                <span className="block text-[10px] text-primary font-medium">Completed</span>
              </div>
            </div>
          </div>

          {/* Dynamic Responsive Workspace Tabs */}
          <WorkspaceTabs
            activeTab={activeTab}
            onChange={switchTab}
            tabs={[
              {
                id: "timetable",
                label: "Today's Schedule",
                shortLabel: "Today",
                icon: Calendar,
              },
              {
                id: "schedules",
                label: "Schedules & Files",
                shortLabel: "Files",
                icon: Clock,
              },
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
              {
                id: "grades",
                label: "Report Card",
                shortLabel: "Grades",
                icon: Award,
              },
              {
                id: "study-ai",
                label: "AI Study Coach",
                shortLabel: "Study AI",
                icon: BrainCircuit,
              },
            ]}
          />

          {/* TAB 1: TIMETABLE & CLASS SCHEDULE */}
          {activeTab === "timetable" && (
            <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b bg-muted/10 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold tracking-tight text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Today&apos;s Class Schedule & Timetable
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Real-time class roster for {activeStudent.grade} - Section {activeStudent.section}
                  </p>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-background px-3 py-1 rounded-lg border">
                  Monday Schedule
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Time Slot</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Room / Lab</th>
                      <th className="py-3 px-4">Course Instructor</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {TIMETABLE.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`transition-colors ${row.active ? "bg-primary/5 font-medium" : "hover:bg-muted/20"
                          }`}
                      >
                        <td className="py-3 px-4 font-semibold text-foreground">{row.period}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{row.time}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{row.subject}</td>
                        <td className="py-3 px-4 text-muted-foreground">{row.room}</td>
                        <td className="py-3 px-4 text-foreground">{row.teacher}</td>
                        <td className="py-3 px-4 text-right">
                          {row.active ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              In Session
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNMENTS & HOMEWORK TRACKER */}
          {activeTab === "assignments" && (
            <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold tracking-tight text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Homework & Term Assignments
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Track coursework deadlines and mark submissions directly
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-44 min-w-[150px]">
                    <CustomSelect
                      value={assignmentFilter}
                      onChange={(val) => setAssignmentFilter(val)}
                      options={[
                        { value: "all", label: "All Tasks", badge: `${assignments.length}` },
                        { value: "pending", label: "Pending", badge: `${assignments.filter((a) => a.status === "pending").length}` },
                        { value: "submitted", label: "Submitted", badge: `${assignments.filter((a) => a.status === "submitted").length}` },
                      ]}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              <div className="divide-y">
                {assignments
                  .filter((a) => assignmentFilter === "all" || a.status === assignmentFilter)
                  .map((asg) => (
                    <div
                      key={asg.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/15 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
                            {asg.subject}
                          </span>
                          <h4 className="font-semibold text-sm text-foreground">{asg.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Instructor: {asg.teacher} • Max Points: {asg.points} pts
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                          <Clock className="h-3 w-3 text-amber-600" />
                          <span>Due: {asg.dueDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${asg.status === "submitted"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                            }`}
                        >
                          {asg.status === "submitted" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {asg.status}
                        </span>
                        <Button
                          variant={asg.status === "submitted" ? "outline" : "default"}
                          size="xs"
                          onClick={() => toggleAssignmentStatus(asg.id)}
                        >
                          {asg.status === "submitted" ? "Undo Submission" : "Mark as Submitted"}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: REPORT CARD & GRADES */}
          {activeTab === "grades" && (
            <div className="space-y-6">
              <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b bg-muted/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold tracking-tight text-base flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Academic Term Report Card
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Grade breakdown and teacher evaluations for {activeStudent.name}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-lg">
                    Academic Standing: Grade A+ (Passed)
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Credits</th>
                        <th className="py-3 px-4">Percentage Score</th>
                        <th className="py-3 px-4">Letter Grade</th>
                        <th className="py-3 px-4">Performance Bar</th>
                        <th className="py-3 px-4 text-right">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {GRADE_REPORT.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-foreground">{row.subject}</td>
                          <td className="py-3.5 px-4 text-muted-foreground">{row.credits}</td>
                          <td className="py-3.5 px-4 font-bold text-foreground">{row.score}%</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-primary">{row.grade}</span>
                          </td>
                          <td className="py-3.5 px-4 w-48">
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${row.score}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right text-muted-foreground">{row.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Real Teacher Formative Evaluations & Assessment Marks */}
                {Array.isArray(activeStudent.academicRecords) && activeStudent.academicRecords.length > 0 && (
                  <div className="border-t p-4 sm:p-5 bg-muted/5 space-y-3">
                    <h4 className="font-semibold text-xs text-foreground flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Teacher Formative Evaluations & Assessment Marks (Official Records)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeStudent.academicRecords.map((rec: any, i: number) => {
                        const isAbsent = rec.examStatus === "absent";
                        const isPass = !isAbsent && (rec.resultStatus ? rec.resultStatus === "pass" : Number(rec.percentage || 0) >= 40);
                        return (
                          <div key={rec.id || i} className="p-3.5 rounded-xl border bg-card space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-foreground">{rec.subject}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${isAbsent
                                    ? "bg-destructive/15 text-destructive"
                                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    }`}
                                >
                                  {isAbsent ? "Absent" : "Present"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                                  {isAbsent
                                    ? `AB / ${rec.totalMarks}`
                                    : `${rec.obtainedMarks} / ${rec.totalMarks} (${rec.percentage}%) • ${rec.grade}`}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${isPass
                                    ? "bg-emerald-600 text-white"
                                    : "bg-destructive text-white"
                                    }`}
                                >
                                  {isAbsent ? "ABSENT" : isPass ? "PASS" : "FAIL"}
                                </span>
                              </div>
                            </div>
                            <div className="text-[11px] text-muted-foreground">{rec.assessment}</div>
                            <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-lg border italic">
                              &quot;{rec.feedback}&quot;
                            </p>
                            <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1">
                              <span>Evaluator: {rec.teacherName || "Faculty Instructor"}</span>
                              <span>{new Date(rec.recordedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: GEMINI AI STUDY COACH */}
          {activeTab === "study-ai" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 rounded-2xl border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-base">Gemini 2.5 AI Study Coach</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Type any topic from your coursework to generate customized formative flashcards and practice test questions.
                </p>

                <form onSubmit={handleGenerateStudyQuiz} className="space-y-3.5 text-xs">
                  <div>
                    <label htmlFor="student-study-topic" className="font-semibold block mb-1">
                      Topic or Concept to Practice
                    </label>
                    <input
                      id="student-study-topic"
                      name="studyTopic"
                      type="text"
                      autoComplete="off"
                      required
                      placeholder="e.g. Newton's 3 Laws, Mitosis vs Meiosis, Quadratic Equations"
                      value={studyTopic}
                      onChange={(e) => setStudyTopic(e.target.value)}
                      className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={generatingQuiz}>
                    {generatingQuiz ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Flashcards via Gemini...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        Create Study Practice Quiz
                      </>
                    )}
                  </Button>
                </form>

                <div className="p-3 rounded-xl bg-muted/40 border space-y-2 text-xs">
                  <span className="font-semibold text-foreground block">Quick Recommended Topics:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Photosynthesis", "Kinematics Equations", "Cell Structure", "Chemical Bonding"].map(
                      (top) => (
                        <button
                          key={top}
                          type="button"
                          onClick={() => setStudyTopic(top)}
                          className="px-2 py-0.5 rounded-md bg-background border hover:border-primary text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {top}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 rounded-2xl border bg-card p-6 shadow-xs flex flex-col min-h-[380px]">
                <div className="flex items-center justify-between pb-3 border-b mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-base">Practice Assessment Questions</h3>
                  </div>
                </div>

                {!studyQuestions && !generatingQuiz && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                    <BrainCircuit className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="font-semibold text-foreground text-sm">No Practice Questions Yet</p>
                    <p className="text-xs max-w-sm mt-1">
                      Enter a topic on the left to let Gemini AI generate custom revision questions and conceptual tests.
                    </p>
                  </div>
                )}

                {generatingQuiz && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                    <p className="text-sm font-semibold">Gemini 2.5 Flash is creating your study test...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Curating questions tailored to {activeStudent.grade}.
                    </p>
                  </div>
                )}

                {studyQuestions && !generatingQuiz && (
                  <div className="space-y-3.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Ready for Self-Assessment: {studyTopic}</span>
                    </div>

                    <div className="space-y-3">
                      {studyQuestions.map((q, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border bg-muted/20 space-y-1.5">
                          <p className="font-medium text-foreground leading-relaxed">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </>
      )}

      {/* TAB 5: OFFICIAL TIMETABLE, SYLLABUS & DATE SHEETS */}
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
