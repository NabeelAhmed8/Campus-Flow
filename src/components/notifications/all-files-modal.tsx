"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampusDocumentsPanel } from "@/components/campus-documents-panel";

interface AllFilesModalProps {
  open: boolean;
  userRole: string | null;
  onClose: () => void;
}

export function AllFilesModal({ open, userRole, onClose }: AllFilesModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="All Campus Files, Timetables, Syllabus & Date Sheets"
        className="w-full max-w-5xl max-h-[92vh] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-5 py-3.5 border-b bg-muted/30 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FolderOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
                All Campus Files &amp; Academic Schedules
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                Live Timetables, Term Syllabi, Exam Date Sheets &amp; Uploaded PDFs / Images
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {(userRole === "teacher" ||
              userRole === "student" ||
              userRole === "parent") && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  onClose();
                  window.history.replaceState(
                    null,
                    "",
                    `/${userRole}?tab=schedules`
                  );
                  window.dispatchEvent(
                    new CustomEvent("campusflow_tab_change", {
                      detail: { tab: "schedules", tabKey: "schedules" },
                    })
                  );
                  router.push(`/${userRole}?tab=schedules`);
                }}
                className="h-8 text-xs"
              >
                Open Full Page →
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              aria-label="Close files modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 bg-background/50">
          <CampusDocumentsPanel portalLabel="Timetable, Syllabus & Exam Date Sheets" />
        </div>
      </div>
    </div>
  );
}
