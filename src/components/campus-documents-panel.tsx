"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Clock,
  BookOpen,
  Bell,
  RefreshCw,
  CalendarDays,
  FolderOpen,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { FilePreviewModal } from "@/components/ui/file-preview-modal";
import { GRADE_FILTER_OPTIONS, TERM_LABELS } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";

interface UploadedDoc {
  _id: string;
  category: "timetable" | "syllabus" | "datesheet" | "circular";
  title: string;
  grade: string;
  section: string;
  term: string;
  audience: string;
  notes: string;
  fileName: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
  fileUrl: string;
  downloadUrl: string;
}

interface SyllabusRecord {
  _id: string;
  grade: string;
  term: "first_term" | "mid_term" | "final_term";
  subject: string;
  chapterTitle: string;
  topics: string;
  targetDate: string;
  status: "pending" | "in_progress" | "completed";
  assignedTeacher: string;
}

interface CampusDocumentsPanelProps {
  portalLabel?: string;
  defaultGradeFilter?: string;
}

const CATEGORY_BADGES = {
  timetable: {
    label: "Timetable",
    cls: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
  },
  syllabus: {
    label: "Syllabus",
    cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  },
  datesheet: {
    label: "Exam Date Sheet",
    cls: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
  },
  circular: {
    label: "Campus Circular",
    cls: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
  },
} as const;

export function CampusDocumentsPanel({
  portalLabel = "Academic Schedules, Syllabus & Date Sheets",
  defaultGradeFilter = "ALL",
}: CampusDocumentsPanelProps) {
  const [categoryTab, setCategoryTab] = useState<
    "all" | "timetable" | "syllabus" | "datesheet" | "circular"
  >("all");
  const [gradeFilter, setGradeFilter] = useState(defaultGradeFilter);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [syllabus, setSyllabus] = useState<SyllabusRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<UploadedDoc | null>(null);

  const loadAll = useCallback(async (showToast = false) => {
    setIsLoading(true);
    try {
      const [docsRes, sylRes] = await Promise.all([
        fetch("/api/documents", { cache: "no-store" }),
        fetch("/api/coordinator/syllabus", { cache: "no-store" }),
      ]);

      const [docsData, sylData] = await Promise.all([
        docsRes.json().catch(() => null),
        sylRes.json().catch(() => null),
      ]);

      if (docsRes.ok && Array.isArray(docsData?.documents)) {
        setDocuments(docsData.documents);
      }
      if (sylRes.ok && Array.isArray(sylData?.items)) {
        setSyllabus(sylData.items);
      }
      if (showToast) {
        toast.success("Latest schedules, syllabus & date sheets loaded.");
      }
    } catch {
      toast.error("Could not refresh campus schedules right now.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll(false);
  }, [loadAll]);

  const matchesGrade = useCallback(
    (itemGrade: string) => {
      if (gradeFilter === "ALL") return true;
      if (!itemGrade || itemGrade === "All Classes") return true;
      return itemGrade.toLowerCase() === gradeFilter.toLowerCase();
    },
    [gradeFilter]
  );

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchCat = categoryTab === "all" || doc.category === categoryTab;
      return matchCat && matchesGrade(doc.grade);
    });
  }, [documents, categoryTab, matchesGrade]);

  const filteredSyllabus = useMemo(() => {
    if (categoryTab !== "all" && categoryTab !== "syllabus") return [];
    return syllabus.filter((s) => matchesGrade(s.grade));
  }, [syllabus, categoryTab, matchesGrade]);

  const hasAnyContent = filteredDocs.length > 0 || filteredSyllabus.length > 0;

  return (
    <div className="space-y-5">
      {/* Header & Filters */}
      <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
              <FolderOpen className="h-5 w-5 text-primary shrink-0" />
              <span>{portalLabel}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              View &amp; download official PDF/Image Timetables, Term Syllabi, Exam Date Sheets, and circulars published by your Academic Coordinator.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="w-40">
              <CustomSelect
                value={gradeFilter}
                onChange={setGradeFilter}
                options={GRADE_FILTER_OPTIONS}
                size="sm"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadAll(true)}
              disabled={isLoading}
              className="h-8.5 text-xs"
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Category Filter Tabs (Zero Horizontal Scrollbar) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-3 border-t">
          {(
            [
              { key: "all", label: "All Updates", icon: FolderOpen },
              { key: "timetable", label: "Timetable", icon: Clock },
              { key: "syllabus", label: "Syllabus", icon: BookOpen },
              { key: "datesheet", label: "Date Sheets", icon: FileText },
              { key: "circular", label: "Circulars", icon: Megaphone },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = categoryTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategoryTab(tab.key)}
                className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${active
                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent"
                  }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border bg-card py-14 text-center text-xs text-muted-foreground">
          Loading latest timetables, syllabi, and exam date sheets...
        </div>
      ) : !hasAnyContent ? (
        <div className="rounded-2xl border border-dashed bg-card py-14 px-4 text-center space-y-2">
          <Bell className="h-9 w-9 mx-auto text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">
            No Published Schedules or Documents Found
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            As soon as your Academic Coordinator uploads a PDF/Image Timetable, Term Syllabus, or Exam Date Sheet, it will appear right here with instant notification.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 1. Uploaded PDF & Image Files */}
          {filteredDocs.length > 0 && (
            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2 pb-2 border-b">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  Official Uploaded Files — PDF &amp; Images ({filteredDocs.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredDocs.map((doc) => {
                  const badge =
                    CATEGORY_BADGES[doc.category] || CATEGORY_BADGES.circular;
                  const isPdf = doc.mimeType === "application/pdf";

                  return (
                    <div
                      key={doc._id}
                      className="rounded-xl border bg-muted/15 overflow-hidden flex flex-col justify-between transition-all hover:border-primary/40"
                    >
                      {/* Thumbnail / File Type Header */}
                      <div
                        onClick={() => setPreviewDoc(doc)}
                        className="relative h-36 bg-muted/40 border-b flex items-center justify-center cursor-pointer group overflow-hidden"
                      >
                        {isPdf ? (
                          <div className="flex flex-col items-center gap-2 text-center p-4">
                            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <FileText className="h-6 w-6" />
                            </div>
                            <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[220px]">
                              {doc.fileName}
                            </span>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={doc.fileUrl}
                            alt={doc.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        )}
                        <span
                          className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-xs ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background/90 text-foreground border">
                          {isPdf ? "PDF" : "IMAGE"}
                        </span>
                      </div>

                      <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2">
                            {doc.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                              {doc.grade}
                            </span>
                            {doc.section && doc.section !== "All Sections" && (
                              <span className="px-2 py-0.5 rounded bg-muted text-foreground font-medium">
                                Sec {doc.section}
                              </span>
                            )}
                            {doc.term && TERM_LABELS[doc.term] && (
                              <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium">
                                {TERM_LABELS[doc.term]}
                              </span>
                            )}
                            <span>{formatFileSize(doc.fileSize)}</span>
                          </div>
                          {doc.notes && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 pt-0.5">
                              {doc.notes}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewDoc(doc)}
                            className="h-8 text-xs"
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Preview
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 text-xs"
                            asChild
                          >
                            <a
                              href={doc.downloadUrl}
                              download={doc.fileName || "document"}
                            >
                              <Download className="mr-1.5 h-3.5 w-3.5" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Digital Term Syllabus */}
          {filteredSyllabus.length > 0 && (
            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 pb-2 border-b">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                Term Syllabus Schedule ({filteredSyllabus.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredSyllabus.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-xl border bg-muted/15 p-3.5 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {item.grade}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300">
                          {TERM_LABELS[item.term] || item.term}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : item.status === "in_progress"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {item.status === "completed"
                          ? "Completed"
                          : item.status === "in_progress"
                            ? "In Progress"
                            : "Scheduled"}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-foreground">
                      {item.subject}: {item.chapterTitle}
                    </p>
                    {item.topics && (
                      <p className="text-xs text-muted-foreground">
                        {item.topics}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span>Teacher: {item.assignedTeacher}</span>
                      {item.targetDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Target: {item.targetDate}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <FilePreviewModal
        file={
          previewDoc
            ? {
              title: previewDoc.title,
              fileName: previewDoc.fileName,
              subtitle: `${previewDoc.fileName} • ${previewDoc.grade}${previewDoc.section && previewDoc.section !== "All Sections"
                ? ` • Sec ${previewDoc.section}`
                : ""
                }`,
              mimeType: previewDoc.mimeType,
              fileUrl: previewDoc.fileUrl,
              downloadUrl: previewDoc.downloadUrl,
            }
            : null
        }
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
