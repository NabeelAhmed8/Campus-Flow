"use client";

import { CalendarCheck, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/format";
import type { StudentDomainRecord } from "@/lib/domain-types";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface AttendanceRosterTableProps {
  students: StudentDomainRecord[];
  attendanceMap: Record<string, { status: AttendanceStatus; remarks: string }>;
  attendanceDate: string;
  savingAttendance: boolean;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onRemarksChange: (studentId: string, remarks: string) => void;
  onSaveAttendance: () => void;
}

const STATUS_BUTTONS = [
  { id: "present", label: "Present", activeCls: "bg-emerald-600" },
  { id: "absent", label: "Absent", activeCls: "bg-rose-600" },
  { id: "late", label: "Late", activeCls: "bg-amber-600" },
  { id: "excused", label: "Excused", activeCls: "bg-sky-600" },
] as const;

export function AttendanceRosterTable({
  students,
  attendanceMap,
  attendanceDate,
  savingAttendance,
  onStatusChange,
  onRemarksChange,
  onSaveAttendance,
}: AttendanceRosterTableProps) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Class &amp; Section</th>
              <th className="py-3 px-4">Attendance Status</th>
              <th className="py-3 px-4">Remarks / Explanation</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.length > 0 ? (
              students.map((st) => {
                const currentStatus = attendanceMap[st._id]?.status || "present";
                const currentRemarks = attendanceMap[st._id]?.remarks || "";
                const initials = getInitials(st.name, "ST");

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
                        {STATUS_BUTTONS.map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => onStatusChange(st._id, btn.id)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${currentStatus === btn.id
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
                        onChange={(e) => onRemarksChange(st._id, e.target.value)}
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
            Ready to commit attendance for{" "}
            <strong className="text-foreground">{students.length}</strong> students for Date:{" "}
            <strong className="text-foreground">{attendanceDate}</strong>
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={onSaveAttendance}
          disabled={savingAttendance || students.length === 0}
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
  );
}
