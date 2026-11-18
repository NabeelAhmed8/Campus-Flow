"use client";

import { useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PreviewableFile {
  title: string;
  fileName?: string;
  subtitle?: string;
  mimeType: string;
  fileUrl: string;
  downloadUrl?: string | null;
}

interface FilePreviewModalProps {
  file: PreviewableFile | null;
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  useEffect(() => {
    if (!file) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  const isPdf = file.mimeType === "application/pdf";

  return (
    <div
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={file.title}
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between gap-3 bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            {isPdf ? (
              <FileText className="h-4 w-4 text-rose-500 shrink-0" />
            ) : (
              <ImageIcon className="h-4 w-4 text-primary shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">
                {file.title}
              </h3>
              {(file.subtitle || file.fileName) && (
                <p className="text-[11px] text-muted-foreground truncate">
                  {file.subtitle || file.fileName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open Tab</span>
            </a>
            {file.downloadUrl && (
              <a
                href={file.downloadUrl}
                download={file.fileName || "document"}
                className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-2.5 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-muted/20 p-3 sm:p-4 flex items-center justify-center min-h-[60vh]">
          {isPdf ? (
            <iframe
              src={file.fileUrl}
              title={file.title}
              className="w-full h-[70vh] rounded-xl border bg-background"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.fileUrl}
              alt={file.title}
              className="max-w-full max-h-[72vh] object-contain rounded-xl border shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
