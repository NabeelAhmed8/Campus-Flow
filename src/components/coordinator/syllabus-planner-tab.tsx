"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import { CoordinatorFileUpload } from "@/components/coordinator-file-upload";
import { GRADE_FILTER_OPTIONS, TERM_OPTIONS } from "@/lib/constants";
import { toIsoDate } from "@/lib/format";
import { SyllabusForm } from "./syllabus-form";
import { SyllabusListPanel } from "./syllabus-list-panel";
import {
  FacultyMember,
  SyllabusRecord,
  SyllabusStatus,
  SyllabusTerm,
} from "./types";

interface SyllabusPlannerTabProps {
  faculty: FacultyMember[];
  syllabusItems: SyllabusRecord[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onUpdateLocal: React.Dispatch<React.SetStateAction<SyllabusRecord[]>>;
}

export function SyllabusPlannerTab({
  faculty,
  syllabusItems,
  isLoading,
  onRefresh,
  onUpdateLocal,
}: SyllabusPlannerTabProps) {
  const [termFilter, setTermFilter] = useState("ALL");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [grade, setGrade] = useState("Grade 10");
  const [term, setTerm] = useState<SyllabusTerm>("first_term");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [topics, setTopics] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [teacher, setTeacher] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setTargetDate(toIsoDate());
  }, []);

  const facultyOptions = useMemo(
    () =>
      faculty.map((t) => ({
        value: t.name,
        label: t.name,
        sublabel: t.subject,
        badge: t.role === "coordinator" ? "Coordinator" : "Teacher",
      })),
    [faculty]
  );

  const filteredItems = useMemo(
    () =>
      syllabusItems.filter((item) => {
        const matchTerm = termFilter === "ALL" || item.term === termFilter;
        const matchGrade = gradeFilter === "ALL" || item.grade === gradeFilter;
        return matchTerm && matchGrade;
      }),
    [syllabusItems, termFilter, gradeFilter]
  );

  const progress = useMemo(() => {
    const total = filteredItems.length;
    const completed = filteredItems.filter((i) => i.status === "completed").length;
    const inProgress = filteredItems.filter((i) => i.status === "in_progress").length;
    return {
      total,
      completed,
      inProgress,
      pending: total - completed - inProgress,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [filteredItems]);

  const handleStartEdit = (item: SyllabusRecord) => {
    setEditingId(item._id);
    setGrade(item.grade);
    setTerm(item.term);
    setSubject(item.subject);
    setChapter(item.chapterTitle);
    setTopics(item.topics || "");
    setTargetDate(item.targetDate || "");
    setTeacher(
      item.assignedTeacher && item.assignedTeacher !== "Subject Teacher"
        ? item.assignedTeacher
        : ""
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setChapter("");
    setTopics("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !chapter.trim()) {
      toast.error("Please enter Subject and Chapter / Unit Title.");
      return;
    }
    setIsSaving(true);
    try {
      const isEditing = Boolean(editingId);
      const res = await fetch("/api/coordinator/syllabus", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { id: editingId } : {}),
          grade,
          term,
          subject: subject.trim(),
          chapterTitle: chapter.trim(),
          topics: topics.trim(),
          targetDate,
          assignedTeacher: teacher.trim() || "Subject Teacher",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save syllabus unit.");
        return;
      }
      toast.success(isEditing ? "Syllabus unit updated." : "Syllabus unit added to term plan.");
      setEditingId(null);
      setChapter("");
      setTopics("");
      window.dispatchEvent(new Event("campusflow_notifications_refresh"));
      await onRefresh();
    } catch {
      toast.error("Unable to save syllabus unit.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: SyllabusStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/coordinator/syllabus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        toast.error("Could not update progress status.");
        return;
      }
      onUpdateLocal((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status } : item))
      );
      toast.success("Syllabus progress updated.");
    } catch {
      toast.error("Unable to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/coordinator/syllabus?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Could not remove syllabus item.");
        return;
      }
      onUpdateLocal((prev) => prev.filter((item) => item._id !== id));
      if (editingId === id) handleCancelEdit();
      toast.success("Syllabus unit removed.");
    } catch {
      toast.error("Unable to delete syllabus item.");
    }
  };

  return (
    <div className="space-y-5">
      <CoordinatorFileUpload category="syllabus" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <SyllabusForm
          editingId={editingId}
          grade={grade}
          term={term}
          subject={subject}
          chapter={chapter}
          topics={topics}
          targetDate={targetDate}
          teacher={teacher}
          isSaving={isSaving}
          facultyOptions={facultyOptions}
          onGradeChange={setGrade}
          onTermChange={setTerm}
          onSubjectChange={setSubject}
          onChapterChange={setChapter}
          onTopicsChange={setTopics}
          onTargetDateChange={setTargetDate}
          onTeacherChange={setTeacher}
          onCancelEdit={handleCancelEdit}
          onSubmit={handleSubmit}
        />

        <div className="lg:col-span-7 rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h2 className="text-base font-bold">
                Syllabus Coverage Tracker ({filteredItems.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Update chapter completion status in real time.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:min-w-[270px]">
              <CustomSelect
                value={termFilter}
                onChange={setTermFilter}
                options={[{ value: "ALL", label: "All Terms" }, ...TERM_OPTIONS]}
                size="sm"
              />
              <CustomSelect
                value={gradeFilter}
                onChange={setGradeFilter}
                options={GRADE_FILTER_OPTIONS}
                size="sm"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-foreground">Overall Completion Rate</span>
              <span className="font-bold text-primary">
                {progress.percent}% Completed ({progress.completed}/{progress.total} units)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
              <span>Completed: {progress.completed}</span>
              <span>In Progress: {progress.inProgress}</span>
              <span>Pending: {progress.pending}</span>
            </div>
          </div>

          <SyllabusListPanel
            items={filteredItems}
            isLoading={isLoading}
            updatingId={updatingId}
            editingId={editingId}
            onStartEdit={handleStartEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
}
