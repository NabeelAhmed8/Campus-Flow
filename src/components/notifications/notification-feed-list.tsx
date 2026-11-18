"use client";

import {
  Bell,
  FileText,
  Image as ImageIcon,
  Eye,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { AUDIENCE_LABELS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import { NOTIFICATION_CATEGORY_META, type NotificationItem } from "./types";

interface NotificationFeedListProps {
  items: NotificationItem[];
  isLoading: boolean;
  filterMode: "all" | "unread";
  canBroadcast: boolean;
  nowMs: number;
  onItemClick: (item: NotificationItem) => void;
  onDelete: (id: string) => void;
  onPreviewFile: (item: NotificationItem) => void;
  onMarkRead: (id: string) => void;
}

export function NotificationFeedList({
  items,
  isLoading,
  filterMode,
  canBroadcast,
  nowMs,
  onItemClick,
  onDelete,
  onPreviewFile,
  onMarkRead,
}: NotificationFeedListProps) {
  return (
    <div className="max-h-[min(430px,62vh)] overflow-y-auto divide-y divide-border/50">
      {isLoading && items.length === 0 ? (
        <div className="py-10 text-center text-xs text-muted-foreground">
          Checking campus updates...
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 px-6 text-center space-y-1.5">
          <Bell className="h-8 w-8 mx-auto text-muted-foreground/30" />
          <p className="text-xs font-semibold text-foreground">
            {filterMode === "unread" ? "No Unread Notifications" : "No Campus Updates Yet"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Official announcements, timetables, syllabi, and exam date sheets will appear right here.
          </p>
        </div>
      ) : (
        items.map((item) => {
          const meta =
            NOTIFICATION_CATEGORY_META[item.category] ||
            NOTIFICATION_CATEGORY_META.announcement;
          const CatIcon = meta.icon;
          const isPdf = item.mimeType === "application/pdf";
          const isUrgent = item.priority === "urgent" || item.category === "urgent";

          return (
            <div
              key={item._id}
              role="button"
              tabIndex={0}
              onClick={() => onItemClick(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onItemClick(item);
                }
              }}
              className={`p-3.5 cursor-pointer transition-colors hover:bg-accent/60 focus:outline-none focus:bg-accent/60 ${
                !item.isRead ? "bg-primary/[0.04]" : ""
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isUrgent
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : meta.iconBg
                  }`}
                >
                  {isUrgent ? <AlertTriangle className="h-4 w-4" /> : <CatIcon className="h-4 w-4" />}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-foreground leading-snug break-words">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary mt-0.5" title="Unread" />
                      )}
                      {canBroadcast && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item._id);
                          }}
                          className="text-muted-foreground/70 hover:text-destructive p-0.5 rounded transition-colors"
                          title="Delete notification"
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed break-words line-clamp-2">
                    {item.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                        isUrgent
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                          : meta.pill
                      }`}
                    >
                      {isUrgent ? "Urgent" : meta.label}
                    </span>

                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-foreground">
                      {item.senderRole === "admin" ? "Admin" : "Coordinator"} • {item.createdBy}
                    </span>

                    {canBroadcast && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300">
                        To: {AUDIENCE_LABELS[item.audience] || item.audience}
                      </span>
                    )}

                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {formatRelativeTime(item.createdAt, nowMs)}
                    </span>
                  </div>

                  {item.fileUrl && (
                    <div
                      className="flex flex-wrap items-center gap-1.5 pt-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onPreviewFile(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        {isPdf ? <FileText className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                        <Eye className="h-3 w-3" />
                        Preview {isPdf ? "PDF" : "Image"}
                      </button>

                      {item.downloadUrl && (
                        <a
                          href={item.downloadUrl}
                          download={item.fileName || "document"}
                          onClick={() => {
                            if (!item.isRead) onMarkRead(item._id);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
