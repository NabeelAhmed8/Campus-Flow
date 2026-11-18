"use client";

import { useState, useEffect } from "react";
import { CalendarCheck, CheckCircle2, Clock, XCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { formatReadableDate } from "@/lib/format";

interface LeaveHistoryItem {
  _id: string;
  reason: string;
  leaveDate: string;
  notes?: string;
  reviewedBy?: string;
  status: "pending" | "approved" | "rejected" | string;
}

interface ParentLeaveTabProps {
  studentId?: string;
  studentName?: string;
}

const LEAVE_REASON_OPTIONS = [
  { value: "Medical / Sickness", label: "Medical / Doctor Appointment", badge: "Health" },
  { value: "Urgent Family Matter", label: "Urgent Family Matter", badge: "Family" },
  { value: "Out of Station Travel", label: "Out of Station Travel", badge: "Travel" },
  { value: "Other Formal Leave", label: "Other Formal Reason", badge: "General" },
];

export function ParentLeaveTab({ studentId, studentName }: ParentLeaveTabProps) {
  const [leaveReason, setLeaveReason] = useState("Medical / Sickness");
  const [leaveDate, setLeaveDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<LeaveHistoryItem[]>([]);

  const fetchLeaves = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/leaves?studentId=${studentId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.leaves)) {
        setHistory(data.leaves);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [studentId]);

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error("No linked student selected.");
      return;
    }
    if (!leaveDate) {
      toast.error("Please select an absence date.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          reason: leaveReason,
          leaveDate,
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          `Leave notice submitted for ${studentName || "Student"} on ${leaveDate} — Teacher & Admin notified!`
        );
        setLeaveDate("");
        setNotes("");
        fetchLeaves();
      } else {
        toast.error(data.error || "Failed to submit leave notice.");
      }
    } catch {
      toast.error("Network error while submitting leave notice.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="leave" className="rounded-2xl border bg-card p-6 shadow-xs space-y-5 scroll-mt-20">
      <div className="flex items-center justify-between pb-3 border-b">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-base">
              Submit Absence &amp; Leave Notice to Administration
            </h3>
            <p className="text-xs text-muted-foreground">
              Saved directly to school records &amp; notifies class teacher in real time
            </p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5">
          Official Record
        </span>
      </div>

      <form onSubmit={handleLeaveSubmit} className="space-y-3.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="parent-leave-reason" className="font-semibold block mb-1">
              Reason for Leave
            </label>
            <CustomSelect
              name="leaveReason"
              value={leaveReason}
              onChange={(val) => setLeaveReason(val)}
              options={LEAVE_REASON_OPTIONS}
              size="sm"
            />
          </div>
          <div>
            <label htmlFor="parent-leave-date" className="font-semibold block mb-1">
              Date of Absence *
            </label>
            <CustomDatePicker
              id="parent-leave-date"
              name="leaveDate"
              required
              value={leaveDate}
              onChange={(val) => setLeaveDate(val)}
              placeholder="Select absence date"
              size="sm"
            />
          </div>
          <div className="sm:col-span-1 flex items-end">
            <Button type="submit" size="sm" className="w-full h-8.5" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Formal Leave Notice"
              )}
            </Button>
          </div>
        </div>

        <div>
          <label htmlFor="parent-leave-notes" className="font-semibold block mb-1">
            Additional Notes (Optional)
          </label>
          <input
            id="parent-leave-notes"
            name="leaveNotes"
            type="text"
            autoComplete="off"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Fever & doctor appointment at 10 AM..."
            className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </form>

      {/* Live Leave Request History */}
      <div className="pt-4 border-t space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Submitted Leave History ({history.length})
          </h4>
          <Button variant="ghost" size="xs" onClick={fetchLeaves} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {history.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item._id}
                className="p-3 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{item.reason}</span>
                    <span className="font-mono text-[11px] text-primary">
                      {formatReadableDate(item.leaveDate)}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.notes}</p>
                  )}
                  {item.reviewedBy && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Reviewed by {item.reviewedBy}
                    </p>
                  )}
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                    item.status === "approved"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : item.status === "rejected"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {item.status === "approved" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : item.status === "rejected" ? (
                    <XCircle className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic py-3">
            No leave notices submitted for {studentName || "this student"} yet.
          </p>
        )}
      </div>

      <div className="p-3.5 rounded-xl bg-muted/20 border text-xs text-muted-foreground space-y-1">
        <span className="font-semibold text-foreground">Notice Policy Guidelines:</span>
        <p className="text-[11px] leading-relaxed">
          Medical leaves exceeding 2 consecutive days require a doctor certificate upon return. Routine planned absences should be notified at least 24 hours prior to prevent attendance demerits.
        </p>
      </div>
    </div>
  );
}
