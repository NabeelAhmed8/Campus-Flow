"use client";

import { FileText, Image as ImageIcon, Eye, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/format";

export interface UploadedDocumentRow {
  _id: string;
  category: string;
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

interface UploadedFilesListProps {
  docs: UploadedDocumentRow[];
  isLoading: boolean;
  onPreview: (doc: UploadedDocumentRow) => void;
  onDelete: (id: string) => void;
}

export function UploadedFilesList({
  docs,
  isLoading,
  onPreview,
  onDelete,
}: UploadedFilesListProps) {
  return (
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
                    {isPdf ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-bold text-sm text-foreground truncate">{doc.title}</p>
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
                      <span>• {formatFileSize(doc.fileSize)}</span>
                    </div>
                    {doc.notes && (
                      <p className="text-[11px] text-muted-foreground truncate">{doc.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onPreview(doc)}
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
                    onClick={() => onDelete(doc._id)}
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
  );
}
