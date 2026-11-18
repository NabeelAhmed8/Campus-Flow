"use client";

import { useState, useEffect } from "react";
import { Clock, FileText, Eye, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePreviewModal, type PreviewableFile } from "@/components/ui/file-preview-modal";
import { formatFileSize } from "@/lib/format";
import type { UploadedDoc } from "@/lib/domain-types";

interface StudentTimetableTabProps {
  grade: string;
  section: string;
}

export function StudentTimetableTab({ grade, section }: StudentTimetableTabProps) {
  const [loading, setLoading] = useState(true);
  const [timetableDocs, setTimetableDocs] = useState<UploadedDoc[]>([]);
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const docsRes = await fetch("/api/documents?category=timetable", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => null);

      const matchesGrade = (g: string) => {
        const clean = (g || "").trim().toLowerCase();
        return (
          !clean ||
          clean === "all classes" ||
          clean === "all" ||
          clean === (grade || "").trim().toLowerCase()
        );
      };

      if (docsRes?.success && Array.isArray(docsRes.documents)) {
        const docs = docsRes.documents as UploadedDoc[];
        setTimetableDocs(docs.filter((d) => matchesGrade(d.grade)));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [grade, section]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold tracking-tight text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Official Class Schedule &amp; Timetable
            </h3>
            <p className="text-xs text-muted-foreground">
              Live timetable published by your Academic Coordinator for {grade} - Section {section}
            </p>
          </div>
          <Button variant="outline" size="xs" onClick={fetchTimetable} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-muted-foreground">
            <RefreshCw className="h-6 w-6 mx-auto text-primary animate-spin mb-2" />
            Loading class timetable...
          </div>
        ) : timetableDocs.length === 0 ? (
          <div className="p-10 text-center text-xs text-muted-foreground space-y-1.5">
            <Clock className="h-9 w-9 mx-auto text-muted-foreground/35" />
            <p className="font-semibold text-foreground text-sm">No Timetable Published Yet</p>
            <p className="max-w-md mx-auto">
              Once your Academic Coordinator uploads the official PDF/Image timetable for {grade}, it will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Official Uploaded Timetables ({timetableDocs.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {timetableDocs.map((doc) => {
                const fileUrl = doc.fileUrl || `/api/documents/${doc._id || doc.id}/file`;
                const downloadUrl = doc.downloadUrl || `${fileUrl}?download=1`;
                return (
                  <div
                    key={doc._id || doc.id}
                    className="rounded-xl border bg-muted/15 p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-semibold text-sm text-foreground truncate">
                            {doc.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                          {doc.grade}
                        </span>
                      </div>
                      {doc.notes && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{doc.notes}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {doc.fileName} • {formatFileSize(doc.fileSize)} • By {doc.uploadedBy}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="xs"
                        className="flex-1"
                        onClick={() =>
                          setPreviewFile({
                            fileUrl,
                            downloadUrl,
                            title: doc.title,
                            fileName: doc.fileName,
                            mimeType: doc.mimeType,
                          })
                        }
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View Timetable
                      </Button>
                      <Button size="xs" variant="outline" asChild>
                        <a href={downloadUrl} download={doc.fileName}>
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
