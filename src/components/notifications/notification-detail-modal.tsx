"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Eye,
  ExternalLink,
  Download,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AUDIENCE_LABELS } from "@/lib/constants";
import { formatFullDateTime, formatRelativeTime } from "@/lib/format";
import { NOTIFICATION_CATEGORY_META, NotificationItem } from "./types";

interface NotificationDetailModalProps {
  notification: NotificationItem | null;
  userRole: string | null;
  canBroadcast: boolean;
  nowMs: number;
  onClose: () => void;
  onDelete: (id: string) => void;
  onOpenFullPreview: (item: NotificationItem) => void;
}

export function NotificationDetailModal({
  notification,
  userRole,
  canBroadcast,
  nowMs,
  onClose,
  onDelete,
  onOpenFullPreview,
}: NotificationDetailModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!notification) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [notification, onClose]);

  if (!notification) return null;

  const meta =
    NOTIFICATION_CATEGORY_META[notification.category] ||
    NOTIFICATION_CATEGORY_META.announcement;
  const DetailIcon = meta.icon;
  const isUrgent =
    notification.priority === "urgent" || notification.category === "urgent";
  const isPdf = notification.mimeType === "application/pdf";

  const navigateToTab = (targetPath: string, tab: string) => {
    onClose();
    window.history.replaceState(null, "", `${targetPath}?tab=${tab}`);
    window.dispatchEvent(
      new CustomEvent("campusflow_tab_change", { detail: { tab, tabKey: tab } })
    );
    router.push(`${targetPath}?tab=${tab}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={notification.title}
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b bg-muted/30 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                isUrgent
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : meta.iconBg
              }`}
            >
              {isUrgent ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <DetailIcon className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isUrgent
                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                      : meta.pill
                  }`}
                >
                  {isUrgent ? "Urgent Alert" : meta.label}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground">
                  {notification.senderRole === "admin"
                    ? "School Admin"
                    : "Academic Coordinator"}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug break-words">
                {notification.title}
              </h2>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 shrink-0"
            aria-label="Close notification details"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-xl border bg-muted/20 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                Sent By
              </span>
              <span className="font-semibold text-foreground mt-0.5 block truncate">
                {notification.createdBy} (
                {notification.senderRole === "admin" ? "Admin" : "Coordinator"})
              </span>
            </div>

            <div className="rounded-xl border bg-muted/20 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                Target Audience
              </span>
              <span className="font-semibold text-foreground mt-0.5 block truncate">
                {AUDIENCE_LABELS[notification.audience] || notification.audience}
              </span>
            </div>

            <div className="rounded-xl border bg-muted/20 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                Applicable Class &amp; Section
              </span>
              <span className="font-semibold text-foreground mt-0.5 block truncate">
                {notification.grade || "All Classes"}
                {notification.section && notification.section !== "All Sections"
                  ? ` • Section ${notification.section}`
                  : ""}
              </span>
            </div>

            <div className="rounded-xl border bg-muted/20 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                Received
              </span>
              <span className="font-semibold text-foreground mt-0.5 block truncate">
                {formatFullDateTime(notification.createdAt)}
                {nowMs
                  ? ` (${formatRelativeTime(notification.createdAt, nowMs)})`
                  : ""}
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4 space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
              Notification Message
            </span>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line break-words">
              {notification.message}
            </p>
          </div>

          {notification.fileUrl && (
            <div className="rounded-xl border bg-muted/15 p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isPdf ? (
                    <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-foreground truncate">
                    {notification.fileName || "Attached File"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => onOpenFullPreview(notification)}
                    className="h-7 text-[11px]"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Full Screen
                  </Button>
                  <a
                    href={notification.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Tab
                  </a>
                  {notification.downloadUrl && (
                    <a
                      href={notification.downloadUrl}
                      download={notification.fileName || "document"}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-background overflow-hidden">
                {isPdf ? (
                  <iframe
                    src={notification.fileUrl}
                    title={notification.title}
                    className="w-full h-72"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={notification.fileUrl}
                    alt={notification.title}
                    className="w-full max-h-80 object-contain bg-muted/20"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t bg-muted/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canBroadcast && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const id = notification._id;
                  onClose();
                  onDelete(id);
                }}
                className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            )}

            {userRole === "admin" && notification.category === "billing" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigateToTab("/admin", "subscription")}
                className="h-8 text-xs"
              >
                Open Subscription &amp; Plan →
              </Button>
            )}

            {(userRole === "teacher" ||
              userRole === "student" ||
              userRole === "parent") &&
              (notification.fileUrl ||
                notification.category === "timetable" ||
                notification.category === "syllabus" ||
                notification.category === "datesheet") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateToTab(`/${userRole}`, "schedules")}
                  className="h-8 text-xs"
                >
                  Open Schedules &amp; Date Sheets →
                </Button>
              )}
          </div>

          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs px-4 ml-auto"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
