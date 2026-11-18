"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Eye,
  Download,
  Trash2,
  X,
  ExternalLink,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";

type UploadCategory = "timetable" | "syllabus" | "datesheet";

interface UploadedDoc {
  _id: string;
  category: UploadCategory | "circular";
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

const GRADE_OPTIONS = [
  { value: "All Classes", label: "All Classes" },
  { value: "Grade 7", label: "Grade 7" },
  { value: "Grade 8", label: "Grade 8" },
  { value: "Grade 9", label: "Grade 9" },
  { value: "Grade 10", label: "Grade 10" },
  { value: "Grade 11", label: "Grade 11" },
  { value: "Grade 12", label: "Grade 12" },
];

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Campus (Teachers, Students & Parents)" },
  { value: "teachers", label: "Teachers Only" },
  { value: "parents", label: "Parents Only" },
  { value: "students", label: "Students Only" },
];

const TERM_OPTIONS = [
  { value: "", label: "General / All Terms" },
  { value: "first_term", label: "First Term" },
  { value: "mid_term", label: "2nd / Mid-Term" },
  { value: "final_term", label: "Final Term" },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

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
  const [previewDoc, setPreviewDoc] = useState<UploadedDoc | null>(null);

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

      toast.success(
        data.message || "File uploaded and portal notifications sent!"
      );
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
        {/* Upload Form */}
        <form onSubmit={handleUpload} className="lg:col-span-5 space-y-3 text-xs">
          {/* File Picker Drop Zone */}
          <div>
            <label
              htmlFor={`upload-file-${category}`}
              className="block text-[11px] font-semibold mb-1 text-foreground"
            >
              Attach File (PDF, JPG, JPEG, PNG — Max 5 MB)
            </label>
            <input
              ref={fileInputRef}
              id={`upload-file-${category}`}
              name={`file_${category}`}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full rounded-xl border-2 border-dashed p-4 text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                selectedFile
                  ? "border-emerald-500/60 bg-emerald-500/5"
                  : "border-border hover:border-primary/60 hover:bg-muted/30"
              }`}
            >
              {selectedFile ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  <span className="font-semibold text-foreground text-xs truncate max-w-full px-2">
                    {selectedFile.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatBytes(selectedFile.size)} • Click to change file
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-foreground text-xs">
                    Click to select PDF, JPEG, JPG, or PNG
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Instant sync to Teacher, Student &amp; Parent portals
                  </span>
                </>
              )}
            </button>
          </div>

          <div>
            <label
              htmlFor={`upload-title-${category}`}
              className="block text-[11px] font-semibold mb-1"
            >
              Document Title
            </label>
            <input
              id={`upload-title-${category}`}
              name={`title_${category}`}
              type="text"
              autoComplete="off"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={cfg.titlePlaceholder}
              className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`upload-grade-${category}`}
                className="block text-[11px] font-semibold mb-1"
              >
                Class / Grade
              </label>
              <CustomSelect
                id={`upload-grade-${category}`}
                value={grade}
                onChange={setGrade}
                options={GRADE_OPTIONS}
                size="sm"
              />
            </div>

            {cfg.showSection && (
              <div>
                <label
                  htmlFor={`upload-section-${category}`}
                  className="block text-[11px] font-semibold mb-1"
                >
                  Section
                </label>
                <input
                  id={`upload-section-${category}`}
                  name={`section_${category}`}
                  type="text"
                  autoComplete="off"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="All Sections, A, B, Iqbal..."
                  className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {cfg.showTerm && (
              <div>
                <label
                  htmlFor={`upload-term-${category}`}
                  className="block text-[11px] font-semibold mb-1"
                >
                  Academic Term
                </label>
                <CustomSelect
                  id={`upload-term-${category}`}
                  value={term}
                  onChange={setTerm}
                  options={TERM_OPTIONS}
                  size="sm"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label
                htmlFor={`upload-audience-${category}`}
                className="block text-[11px] font-semibold mb-1"
              >
                Notify &amp; Share With
              </label>
              <CustomSelect
                id={`upload-audience-${category}`}
                value={audience}
                onChange={setAudience}
                options={AUDIENCE_OPTIONS}
                size="sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor={`upload-notes-${category}`}
                className="block text-[11px] font-semibold mb-1"
              >
                Short Note (Optional)
              </label>
              <input
                id={`upload-notes-${category}`}
                name={`notes_${category}`}
                type="text"
                autoComplete="off"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Effective from Monday, reporting time 7:50 AM..."
                className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="w-full h-9 text-xs"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {isUploading ? "Uploading & Notifying..." : "Upload File & Notify Portals"}
          </Button>
        </form>

        {/* Uploaded Files List for this Category */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Uploaded Files ({docs.length})
            </h4>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              Loading uploaded files...
            </div>
          ) : docs.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-xl border border-dashed text-xs text-muted-foreground space-y-1">
              <FileText className="h-7 w-7 mx-auto text-muted-foreground/30" />
              <p className="font-semibold text-foreground">No Files Uploaded Yet</p>
              <p>
                Upload a PDF or image on the left to share it instantly with Teachers, Students, and Parents.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {docs.map((doc) => {
                const isPdf = doc.mimeType === "application/pdf";
                return (
                  <div
                    key={doc._id}
                    className="rounded-xl border bg-muted/15 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isPdf
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {isPdf ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-bold text-sm text-foreground truncate">
                          {doc.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                            {doc.grade}
                          </span>
                          {doc.section && doc.section !== "All Sections" && (
                            <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
                              Sec {doc.section}
                            </span>
                          )}
                          <span>{isPdf ? "PDF" : "Image"}</span>
                          <span>• {formatBytes(doc.fileSize)}</span>
                        </div>
                        {doc.notes && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDoc(doc)}
                        className="h-8 px-2.5 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        title="Download file"
                        asChild
                      >
                        <a href={doc.downloadUrl} download={doc.fileName}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc._id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete file"
                        aria-label={`Delete ${doc.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between gap-3 bg-muted/30">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground truncate">
                  {previewDoc.title}
                </h3>
                <p className="text-[11px] text-muted-foreground truncate">
                  {previewDoc.fileName} • {previewDoc.grade}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open Tab</span>
                </a>
                <a
                  href={previewDoc.downloadUrl}
                  download={previewDoc.fileName}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-2.5 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewDoc(null)}
                  className="h-8 w-8 p-0"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-muted/20 p-3 sm:p-4 flex items-center justify-center min-h-[60vh]">
              {previewDoc.mimeType === "application/pdf" ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  className="w-full h-[70vh] rounded-xl border bg-background"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  className="max-w-full max-h-[72vh] object-contain rounded-xl border shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
