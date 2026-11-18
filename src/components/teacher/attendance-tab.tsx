"use client";

import { useState, useEffect } from "react";
import {
  CalendarCheck,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface AttendanceTabProps {
  students: any[];
  gradeClassOptions: Array<{ value: string; label: string; badge?: string }>;
  teacherName: string;
}

export function TeacherAttendanceTab({
  students,
  gradeClassOptions,
  teacherName,
}: AttendanceTabProps) {
  // Initialized inside useEffect for Next.js 16 cacheComponents compatibility
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceGradeFilter, setAttendanceGradeFilter] = useState("all");
  const [attendanceSectionFilter, setAttendanceSectionFilter] = useState("all");
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [reviewingLeaveId, setReviewingLeaveId] = useState<string | null>(null);

  const fetchLeaveRequests = async () => {
    try {
      const res = await fetch("/api/leaves", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.leaves)) {
        setLeaveRequests(data.leaves);
      }
    } catch {
      // silent
    }
  };

  const handleReviewLeave = async (id: string, status: "approved" | "rejected") => {
    setReviewingLeaveId(id);
    try {
      const res = await fetch("/api/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeaveRequests((prev) =>
          prev.map((l) => (l._id === id ? { ...l, status, reviewedBy: teacherName } : l))
        );
        toast.success(`Leave notice ${status} and guardian notified!`);
      } else {
        toast.error(data.error || "Unable to update leave status.");
      }
    } catch {
      toast.error("Network error while updating leave request.");
    } finally {
      setReviewingLeaveId(null);
    }
  };

  const fetchAttendanceForDate = async (targetDate: string) => {
    try {
      const res = await fetch(`/api/attendance?date=${targetDate}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        const map: Record<string, { status: AttendanceStatus; remarks: string }> = {};
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
      // silent
    }
  };

  useEffect(() => {
    setAttendanceDate(new Date().toISOString().split("T")[0]);
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    if (attendanceDate) {
      fetchAttendanceForDate(attendanceDate);
    }
  }, [attendanceDate]);

  const studentsInAttendanceGrade = students.filter(
    (st) => attendanceGradeFilter === "all" || st.grade === attendanceGradeFilter
  );

  const attendanceSectionOptions = (() => {
    const uniqueSections = Array.from(
      new Set(studentsInAttendanceGrade.map((st) => (st.section || "A").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return [
      { value: "all", label: "All Sections", badge: `${studentsInAttendanceGrade.length}` },
      ...uniqueSections.map((sec) => ({
        value: sec,
        label: `Section ${sec}`,
        badge: `${
          studentsInAttendanceGrade.filter(
            (s) => (s.section || "A").trim().toLowerCase() === sec.toLowerCase()
          ).length
        }`,
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

  const handleMarkAll = (status: AttendanceStatus) => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      filteredAttendanceStudents.forEach((st) => {
        next[st._id] = { status, remarks: next[st._id]?.remarks || "" };
      });
      return next;
    });
    toast.success(
      `Marked all ${filteredAttendanceStudents.length} students as ${status.toUpperCase()}`
    );
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { status, remarks: prev[studentId]?.remarks || "" },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { status: prev[studentId]?.status || "present", remarks },
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
        body: JSON.stringify({ date: attendanceDate, teacherName, records }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          data.message ||
            `Daily attendance for ${records.length} students successfully recorded for ${attendanceDate}.`
        );
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

  return (
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
            onClick={() => handleMarkAll("present")}
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30"
          >
            <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Mark All Present
          </Button>
        </div>
      </div>

      {/* Live Parent Leave Notices Pending Review */}
      {leaveRequests.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-amber-600" />
              Guardian Leave Notices ({leaveRequests.filter((l) => l.status === "pending").length} Pending)
            </span>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {leaveRequests.slice(0, 10).map((lv) => (
              <div
                key={lv._id}
                className="rounded-lg border bg-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-foreground">{lv.studentName}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ({lv.rollNumber} • {lv.grade} - Sec {lv.section})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                      {lv.leaveDate}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Reason: <strong className="text-foreground">{lv.reason}</strong>
                    {lv.notes ? ` — ${lv.notes}` : ""} (By {lv.parentName})
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {lv.status === "pending" ? (
                    <>
                      <Button
                        size="xs"
                        disabled={reviewingLeaveId === lv._id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleReviewLeave(lv._id, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={reviewingLeaveId === lv._id}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => handleReviewLeave(lv._id, "rejected")}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        lv.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {lv.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Attendance Counter KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl border bg-muted/30">
          <span className="text-[11px] text-muted-foreground block font-medium">Roster Total</span>
          <span className="text-xl font-bold text-foreground">{attendanceTotal}</span>
          <span className="text-[10px] text-muted-foreground block">Active learners</span>
        </div>

        <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Present
          </span>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
            {attendancePresentCount}
          </span>
          <span className="text-[10px] text-emerald-600/80 block font-medium">
            {attendanceTotal > 0 ? Math.round((attendancePresentCount / attendanceTotal) * 100) : 0}% attendance
          </span>
        </div>

        <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5">
          <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Absent
          </span>
          <span className="text-xl font-bold text-rose-700 dark:text-rose-400">
            {attendanceAbsentCount}
          </span>
          <span className="text-[10px] text-rose-600/80 block font-medium">Unexcused</span>
        </div>

        <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" /> Late
          </span>
          <span className="text-xl font-bold text-amber-700 dark:text-amber-400">
            {attendanceLateCount}
          </span>
          <span className="text-[10px] text-amber-600/80 block font-medium">Tardy</span>
        </div>

        <div className="p-3 rounded-xl border border-sky-500/20 bg-sky-500/5 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-sky-700 dark:text-sky-400 font-medium flex items-center gap-1">
            <UserCheck className="h-3 w-3" /> Excused
          </span>
          <span className="text-xl font-bold text-sky-700 dark:text-sky-400">
            {attendanceExcusedCount}
          </span>
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
                  const initials =
                    st.name
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
                            <div className="font-semibold text-foreground text-xs leading-tight">
                              {st.name}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {st.rollNumber}
                            </div>
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
                          {(
                            [
                              { id: "present", label: "Present", activeCls: "bg-emerald-600" },
                              { id: "absent", label: "Absent", activeCls: "bg-rose-600" },
                              { id: "late", label: "Late", activeCls: "bg-amber-600" },
                              { id: "excused", label: "Excused", activeCls: "bg-sky-600" },
                            ] as const
                          ).map((btn) => (
                            <button
                              key={btn.id}
                              type="button"
                              onClick={() => handleStatusChange(st._id, btn.id)}
                              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                                currentStatus === btn.id
                                  ? `${btn.activeCls} text-white font-semibold shadow-xs`
                                  : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="text"
                          name={`attendanceRemark_${st._id}`}
                          aria-label={`Attendance remark for ${st.name}`}
                          placeholder="Optional remark (e.g. Sick, Doctor appointment)..."
                          value={currentRemarks}
                          onChange={(e) => handleRemarksChange(st._id, e.target.value)}
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
              Ready to commit attendance for <strong className="text-foreground">{attendanceTotal}</strong>{" "}
              students for Date: <strong className="text-foreground">{attendanceDate}</strong>
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
  );
}
