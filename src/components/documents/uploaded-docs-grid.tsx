"use client";

import { FileText, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TERM_LABELS } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";
import type { UploadedDoc } from "@/lib/domain-types";

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

interface UploadedDocsGridProps {
  documents: UploadedDoc[];
  onPreview: (doc: UploadedDoc) => void;
}

export function UploadedDocsGrid({ documents, onPreview }: UploadedDocsGridProps) {
  if (documents.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-2 pb-2 border-b">
        <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          Official Uploaded Files — PDF &amp; Images ({documents.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {documents.map((doc) => {
          const badge = CATEGORY_BADGES[doc.category] || CATEGORY_BADGES.circular;
          const isPdf = doc.mimeType === "application/pdf";

          return (
            <div
              key={doc._id}
              className="rounded-xl border bg-muted/15 overflow-hidden flex flex-col justify-between transition-all hover:border-primary/40"
            >
              <div
                onClick={() => onPreview(doc)}
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
                    onClick={() => onPreview(doc)}
                    className="h-8 text-xs"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Preview
                  </Button>
                  <Button type="button" size="sm" className="h-8 text-xs" asChild>
                    <a href={doc.downloadUrl} download={doc.fileName || "document"}>
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
  );
}
