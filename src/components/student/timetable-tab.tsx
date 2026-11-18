"use client";

import { useState, useEffect } from "react";
import { Clock, FileText, Eye, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePreviewModal, type PreviewableFile } from "@/components/ui/file-preview-modal";
import { formatFileSize } from "@/lib/format";

interface StudentTimetableTabProps {
  grade: string;
  section: string;
}

export function StudentTimetableTab({ grade, section }: StudentTimetableTabProps) {
  const [loading, setLoading] = useState(true);
  const [timetableDocs, setTimetableDocs] = useState<any[]>([]);
  const [digitalSlots, setDigitalSlots] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const [docsRes, ttRes] = await Promise.all([
        fetch("/api/documents?category=timetable", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
        fetch("/api/coordinator/timetable", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
      ]);

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
        setTimetableDocs(docsRes.documents.filter((d: any) => matchesGrade(d.grade)));
      }
      if (ttRes?.success && Array.isArray(ttRes.entries)) {
        setDigitalSlots(
          ttRes.entries.filter(
            (s: any) =>
              matchesGrade(s.grade) &&
              (!s.section ||
                s.section.toLowerCase() === "all" ||
                s.section.toLowerCase() === (section || "A").toLowerCase())
          )
        );
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
        ) : timetableDocs.length === 0 && digitalSlots.length === 0 ? (
          <div className="p-10 text-center text-xs text-muted-foreground space-y-1.5">
            <Clock className="h-9 w-9 mx-auto text-muted-foreground/35" />
            <p className="font-semibold text-foreground text-sm">No Timetable Published Yet</p>
            <p className="max-w-md mx-auto">
              Once your Academic Coordinator uploads the official PDF/Image timetable for {grade}, it will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-5">
            {/* Uploaded Official Timetable PDF / Image Files */}
            {timetableDocs.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Official Uploaded Timetables ({timetableDocs.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {timetableDocs.map((doc) => {
                    const fileUrl = `/api/documents/${doc.id}/file`;
                    return (
                      <div
                        key={doc.id}
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
                          {doc.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {doc.description}
                            </p>
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
                                downloadUrl: `${fileUrl}?download=1`,
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
                            <a href={`${fileUrl}?download=1`} download={doc.fileName}>
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

            {/* Digital Timetable Slots (if any exist in DB) */}
            {digitalSlots.length > 0 && (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4">Period / Time</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Room</th>
                      <th className="py-3 px-4">Instructor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {digitalSlots.map((slot) => (
                      <tr key={slot._id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">{slot.dayOfWeek}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {slot.period} ({slot.startTime} – {slot.endTime})
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground">{slot.subject}</td>
                        <td className="py-3 px-4 text-muted-foreground">{slot.room || "—"}</td>
                        <td className="py-3 px-4 text-foreground">{slot.teacherName || "Faculty"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
