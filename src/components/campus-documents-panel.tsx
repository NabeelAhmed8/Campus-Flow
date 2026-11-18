"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Clock,
  BookOpen,
  Bell,
  RefreshCw,
  FolderOpen,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { FilePreviewModal } from "@/components/ui/file-preview-modal";
import { UploadedDocsGrid } from "@/components/documents/uploaded-docs-grid";
import { SyllabusCardsGrid } from "@/components/documents/syllabus-cards-grid";
import { GRADE_FILTER_OPTIONS } from "@/lib/constants";
import type { SyllabusRecord, UploadedDoc } from "@/lib/domain-types";

interface CampusDocumentsPanelProps {
  portalLabel?: string;
  defaultGradeFilter?: string;
}

const CATEGORY_TABS = [
  { key: "all", label: "All Updates", icon: FolderOpen },
  { key: "timetable", label: "Timetable", icon: Clock },
  { key: "syllabus", label: "Syllabus", icon: BookOpen },
  { key: "datesheet", label: "Date Sheets", icon: FileText },
  { key: "circular", label: "Circulars", icon: Megaphone },
] as const;

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

  const filteredDocs = useMemo(
    () =>
      documents.filter((doc) => {
        const matchCat = categoryTab === "all" || doc.category === categoryTab;
        return matchCat && matchesGrade(doc.grade);
      }),
    [documents, categoryTab, matchesGrade]
  );

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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-3 border-t">
          {CATEGORY_TABS.map((tab) => {
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
          <UploadedDocsGrid documents={filteredDocs} onPreview={setPreviewDoc} />
          <SyllabusCardsGrid items={filteredSyllabus} />
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
