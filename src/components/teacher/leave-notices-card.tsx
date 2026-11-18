"use client";

import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LeaveRequestItem {
  _id: string;
  studentName: string;
  rollNumber: string;
  grade: string;
  section: string;
  leaveDate: string;
  reason: string;
  notes?: string;
  parentName: string;
  status: "pending" | "approved" | "rejected" | string;
  reviewedBy?: string;
}

interface LeaveNoticesCardProps {
  leaveRequests: LeaveRequestItem[];
  reviewingLeaveId: string | null;
  onReview: (id: string, status: "approved" | "rejected") => void;
}

export function LeaveNoticesCard({
  leaveRequests,
  reviewingLeaveId,
  onReview,
}: LeaveNoticesCardProps) {
  if (leaveRequests.length === 0) return null;

  return (
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
                    onClick={() => onReview(lv._id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={reviewingLeaveId === lv._id}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => onReview(lv._id, "rejected")}
                  >
                    Reject
                  </Button>
                </>
              ) : (
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${lv.status === "approved"
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
  );
}
