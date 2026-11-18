"use client";

import { useState } from "react";
import { FileText, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { formatReadableDate } from "@/lib/format";

export interface StudentAssignment {
  id: string;
  title: string;
  subject: string;
  description?: string;
  dueDate: string;
  points: number;
  status: "pending" | "submitted";
  teacher: string;
  submittedAt?: string | null;
}

interface StudentAssignmentsTabProps {
  assignments: StudentAssignment[];
  togglingId: string | null;
  onToggleStatus: (id: string, currentStatus: "pending" | "submitted") => void;
}

export function StudentAssignmentsTab({
  assignments,
  togglingId,
  onToggleStatus,
}: StudentAssignmentsTabProps) {
  const [assignmentFilter, setAssignmentFilter] = useState("all");

  const filtered = assignments.filter(
    (a) => assignmentFilter === "all" || a.status === assignmentFilter
  );

  return (
    <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold tracking-tight text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Homework &amp; Term Assignments
          </h3>
          <p className="text-xs text-muted-foreground">
            Live homework assigned by your teachers — submissions save permanently to school records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-44 min-w-[150px]">
            <CustomSelect
              value={assignmentFilter}
              onChange={(val) => setAssignmentFilter(val)}
              options={[
                { value: "all", label: "All Tasks", badge: `${assignments.length}` },
                {
                  value: "pending",
                  label: "Pending",
                  badge: `${assignments.filter((a) => a.status === "pending").length}`,
                },
                {
                  value: "submitted",
                  label: "Submitted",
                  badge: `${assignments.filter((a) => a.status === "submitted").length}`,
                },
              ]}
              size="sm"
            />
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="divide-y">
          {filtered.map((asg) => {
            const busy = togglingId === asg.id;
            return (
              <div
                key={asg.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/15 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
                      {asg.subject}
                    </span>
                    <h4 className="font-semibold text-sm text-foreground">{asg.title}</h4>
                  </div>
                  {asg.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {asg.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Instructor: {asg.teacher} • Max Points: {asg.points} pts
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-600" />
                      Due: {formatReadableDate(asg.dueDate)}
                    </span>
                    {asg.submittedAt && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Submitted: {formatReadableDate(asg.submittedAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                      asg.status === "submitted"
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
                    disabled={busy}
                    onClick={() => onToggleStatus(asg.id, asg.status)}
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : asg.status === "submitted" ? (
                      "Undo Submission"
                    ) : (
                      "Mark as Submitted"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 px-6 text-center text-xs text-muted-foreground space-y-1.5">
          <FileText className="h-9 w-9 mx-auto text-muted-foreground/35" />
          <p className="font-semibold text-foreground text-sm">No Homework Assigned Yet</p>
          <p className="max-w-md mx-auto">
            {assignments.length > 0
              ? "No assignments match the selected filter."
              : "When your teachers post homework or coursework tasks for your class, they will appear right here."}
          </p>
        </div>
      )}
    </div>
  );
}
