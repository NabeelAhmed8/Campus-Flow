"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Clock, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { SUBJECT_OPTIONS } from "@/lib/constants";
import { formatReadableDate } from "@/lib/format";
import type { AssignmentSubmissionItem } from "@/lib/domain-types";

interface TeacherAssignmentItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  section: string;
  dueDate: string;
  points: number;
  description?: string;
  submissionsCount?: number;
  submissions?: AssignmentSubmissionItem[];
}

interface TeacherAssignmentsTabProps {
  assignedClasses: Array<{ grade: string; section: string }>;
}

export function TeacherAssignmentsTab({ assignedClasses }: TeacherAssignmentsTabProps) {
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const uniqueGrades = Array.from(new Set(assignedClasses.map((ac) => ac.grade))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [grade, setGrade] = useState(uniqueGrades[0] || "Grade 9");
  const [section, setSection] = useState("All");
  const [dueDate, setDueDate] = useState("");
  const [points, setPoints] = useState(25);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (uniqueGrades.length > 0 && !uniqueGrades.includes(grade)) {
      setGrade(uniqueGrades[0]);
    }
  }, [assignedClasses.length]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/assignments", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.assignments)) {
        setAssignments(data.assignments);
      }
    } catch {
      toast.error("Failed to load homework assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const sectionsForGrade = Array.from(
    new Set(
      assignedClasses.filter((ac) => ac.grade === grade).map((ac) => ac.section.trim())
    )
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      toast.error("Please enter a homework title and due date.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject,
          grade,
          section,
          dueDate,
          points,
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Homework assigned and students/parents notified!");
        setTitle("");
        setDescription("");
        setDueDate("");
        fetchAssignments();
      } else {
        toast.error(data.error || "Failed to publish homework.");
      }
    } catch {
      toast.error("Network error while publishing homework.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/assignments?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setAssignments((prev) => prev.filter((a) => a.id !== id));
        toast.success("Assignment deleted.");
      } else {
        toast.error(data.error || "Failed to delete assignment.");
      }
    } catch {
      toast.error("Network error while deleting assignment.");
    }
  };

  return (
    <div id="homework" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-20">
      {/* Create Homework Form */}
      <div className="lg:col-span-5">
        <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-base">Assign Class Homework</h2>
              <p className="text-[11px] text-muted-foreground">
                Instantly syncs to Student Portal &amp; notifies students &amp; parents
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
            <div>
              <label htmlFor="hw-title" className="block font-semibold mb-1 text-foreground">
                Homework / Task Title *
              </label>
              <input
                id="hw-title"
                name="homeworkTitle"
                type="text"
                autoComplete="off"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 4: Exercise 4.2 Questions 1–10"
                className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="hw-subject" className="block font-semibold mb-1 text-foreground">
                  Subject *
                </label>
                <CustomSelect
                  name="hwSubject"
                  value={subject}
                  onChange={setSubject}
                  options={SUBJECT_OPTIONS}
                  size="sm"
                />
              </div>
              <div>
                <label htmlFor="hw-points" className="block font-semibold mb-1 text-foreground">
                  Max Points
                </label>
                <input
                  id="hw-points"
                  name="hwPoints"
                  type="number"
                  min={1}
                  max={500}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value) || 25)}
                  className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="hw-grade" className="block font-semibold mb-1 text-foreground">
                  Assigned Class *
                </label>
                <CustomSelect
                  name="hwGrade"
                  value={grade}
                  onChange={(val) => {
                    setGrade(val);
                    setSection("All");
                  }}
                  options={
                    uniqueGrades.length > 0
                      ? uniqueGrades.map((g) => ({ value: g, label: g }))
                      : [{ value: "Grade 9", label: "No Classes Assigned" }]
                  }
                  size="sm"
                />
              </div>
              <div>
                <label htmlFor="hw-section" className="block font-semibold mb-1 text-foreground">
                  Section
                </label>
                <CustomSelect
                  name="hwSection"
                  value={section}
                  onChange={setSection}
                  options={[
                    { value: "All", label: "All Sections" },
                    ...sectionsForGrade.map((s) => ({ value: s, label: `Section ${s}` })),
                  ]}
                  size="sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="hw-due-date" className="block font-semibold mb-1 text-foreground">
                Submission Due Date *
              </label>
              <CustomDatePicker
                id="hw-due-date"
                name="hwDueDate"
                required
                value={dueDate}
                onChange={setDueDate}
                placeholder="Select due date"
                size="sm"
              />
            </div>

            <div>
              <label htmlFor="hw-desc" className="block font-semibold mb-1 text-foreground">
                Instructions / Details (Optional)
              </label>
              <textarea
                id="hw-desc"
                name="hwDescription"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add textbook page numbers, rubric notes, or submission guidance..."
                className="w-full rounded-lg border bg-background p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={submitting || uniqueGrades.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Publishing Homework...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Assign Homework to Class
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Published Homework & Submissions List */}
      <div className="lg:col-span-7">
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b bg-muted/10 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base">Published Homework ({assignments.length})</h3>
              <p className="text-xs text-muted-foreground">
                Live submission tracking from your students
              </p>
            </div>
            <Button variant="outline" size="xs" onClick={fetchAssignments} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary mb-2" />
              Loading homework assignments...
            </div>
          ) : assignments.length > 0 ? (
            <div className="divide-y max-h-[560px] overflow-y-auto">
              {assignments.map((a) => (
                <div key={a.id} className="p-4 space-y-2 text-xs hover:bg-muted/15 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[10px]">
                          {a.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium text-[10px]">
                          {a.grade} • {a.section === "All" ? "All Sections" : `Sec ${a.section}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {a.submissionsCount || 0} Submitted
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground">{a.title}</h4>
                      {a.description && (
                        <p className="text-muted-foreground leading-relaxed">{a.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 text-amber-600" />
                          Due: {formatReadableDate(a.dueDate)}
                        </span>
                        <span>Points: {a.points}</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleDelete(a.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      title="Delete assignment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {Array.isArray(a.submissions) && a.submissions.length > 0 && (
                    <div className="pt-2 border-t flex flex-wrap gap-1.5">
                      {a.submissions.map((sub, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                        >
                          ✓ {sub.studentName} ({sub.rollNumber})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 px-6 text-center text-xs text-muted-foreground space-y-1.5">
              <FileText className="h-9 w-9 mx-auto text-muted-foreground/35" />
              <p className="font-semibold text-foreground text-sm">No Homework Posted Yet</p>
              <p className="max-w-sm mx-auto">
                Use the form on the left to assign real homework tasks to your classes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
