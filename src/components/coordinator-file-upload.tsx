"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, Bell } from "lucide-react";
import { toast } from "sonner";
import { FilePreviewModal } from "@/components/ui/file-preview-modal";
import {
  UploadedFilesList,
  type UploadedDocumentRow,
} from "@/components/coordinator/uploaded-files-list";
import { UploadFormPanel } from "@/components/coordinator/upload-form-panel";
import type { UploadedDoc } from "@/lib/domain-types";

type UploadCategory = "timetable" | "syllabus" | "datesheet";

interface CoordinatorFileUploadProps {
  category: UploadCategory;
}

const CATEGORY_CONFIG: Record<
  UploadCategory,
  {
    heading: string;
    subtitle: string;
    titlePlaceholder: string;
    showSection: boolean;
    showTerm: boolean;
  }
> = {
  timetable: {
    heading: "Upload Class Timetable (PDF / JPG / PNG)",
    subtitle:
      "Skip manual typing — upload a timetable PDF or image and instantly sync & notify Teachers, Students, and Parents.",
    titlePlaceholder: "e.g. Grade 10 Weekly Timetable (Mon–Sat)",
    showSection: true,
    showTerm: false,
  },
  syllabus: {
    heading: "Upload Term Syllabus (PDF / JPG / PNG)",
    subtitle:
      "Upload First Term, Mid-Term, or Final Term syllabus PDF/image — automatically visible in Teacher, Student, and Parent portals.",
    titlePlaceholder: "e.g. First Term Complete Syllabus — Grade 9",
    showSection: false,
    showTerm: true,
  },
  datesheet: {
    heading: "Upload Exam Date Sheet (PDF / JPG / PNG)",
    subtitle:
      "Upload the official exam date sheet PDF or photo and notify all Teachers, Students, and Parents immediately.",
    titlePlaceholder: "e.g. Final Term Examination Date Sheet 2026",
    showSection: false,
    showTerm: true,
  },
};

export function CoordinatorFileUpload({ category }: CoordinatorFileUploadProps) {
  const cfg = CATEGORY_CONFIG[category];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState("All Classes");
  const [section, setSection] = useState("All Sections");
  const [term, setTerm] = useState("");
  const [audience, setAudience] = useState("all");
  const [notes, setNotes] = useState("");
  const [previewDoc, setPreviewDoc] = useState<UploadedDocumentRow | null>(null);

  const loadDocs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents?category=${category}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.documents)) {
        setDocs(data.documents);
      }
    } catch {
      // Ignore silent fetch error
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const okExt =
      lower.endsWith(".pdf") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png");
    if (!okExt) {
      toast.error("Only PDF, JPG, JPEG, and PNG files are supported.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    if (!title.trim()) {
      const base = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
      setTitle(base);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please choose a PDF, JPG, JPEG, or PNG file first.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", category);
      formData.append("title", title.trim() || selectedFile.name);
      formData.append("grade", grade);
      formData.append("section", cfg.showSection ? section.trim() || "All Sections" : "All Sections");
      formData.append("term", cfg.showTerm ? term : "");
      formData.append("audience", audience);
      formData.append("notes", notes.trim());

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Unable to upload file.");
        return;
      }

      toast.success(data.message || "File uploaded and portal notifications sent!");
      setSelectedFile(null);
      setTitle("");
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      window.dispatchEvent(new Event("campusflow_notifications_refresh"));
      await loadDocs();
    } catch {
      toast.error("Network error while uploading document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to remove uploaded file.");
        return;
      }
      setDocs((prev) => prev.filter((d) => d._id !== id));
      window.dispatchEvent(new Event("campusflow_notifications_refresh"));
      toast.success("Uploaded file deleted.");
    } catch {
      toast.error("Unable to delete document.");
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
            <Upload className="h-4 w-4 text-primary shrink-0" />
            <span>{cfg.heading}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{cfg.subtitle}</p>
        </div>
        <span className="inline-flex items-center gap-1 self-start sm:self-auto text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          <Bell className="h-3 w-3" />
          Auto-Notifies All Portals
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <UploadFormPanel
          category={category}
          titlePlaceholder={cfg.titlePlaceholder}
          showSection={cfg.showSection}
          showTerm={cfg.showTerm}
          fileInputRef={fileInputRef}
          selectedFile={selectedFile}
          title={title}
          grade={grade}
          section={section}
          term={term}
          audience={audience}
          notes={notes}
          isUploading={isUploading}
          onFileChange={handleFileChange}
          onTitleChange={setTitle}
          onGradeChange={setGrade}
          onSectionChange={setSection}
          onTermChange={setTerm}
          onAudienceChange={setAudience}
          onNotesChange={setNotes}
          onSubmit={handleUpload}
        />

        <UploadedFilesList
          docs={docs}
          isLoading={isLoading}
          onPreview={(doc: UploadedDocumentRow) => setPreviewDoc(doc)}
          onDelete={handleDelete}
        />
      </div>

      <FilePreviewModal
        file={
          previewDoc
            ? {
                title: previewDoc.title,
                fileName: previewDoc.fileName,
                subtitle: `${previewDoc.fileName} • ${previewDoc.grade}`,
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
