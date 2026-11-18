"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Send,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  FilePreviewModal,
  PreviewableFile,
} from "@/components/ui/file-preview-modal";
import { NotificationItem } from "./notifications/types";
import { BroadcastNotificationModal } from "./notifications/broadcast-modal";
import { NotificationDetailModal } from "./notifications/notification-detail-modal";
import { AllFilesModal } from "./notifications/all-files-modal";
import { NotificationFeedList } from "./notifications/notification-feed-list";

interface NotificationBellProps {
  userRole: string | null;
}

export function NotificationBell({ userRole }: NotificationBellProps) {
  const canBroadcast = userRole === "admin" || userRole === "coordinator";

  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [nowMs, setNowMs] = useState(0);

  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);
  const [showAllFilesModal, setShowAllFilesModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(
          typeof data.unreadCount === "number" ? data.unreadCount : 0
        );
      }
      setNowMs(Date.now());
    } catch {
      // Silent fallback on transient network hiccup
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setNowMs(Date.now());
    fetchNotifications(true);

    const handleRefresh = () => fetchNotifications(true);
    window.addEventListener("campusflow_notifications_refresh", handleRefresh);
    window.addEventListener("focus", handleRefresh);
    const interval = window.setInterval(() => fetchNotifications(true), 30000);

    return () => {
      window.removeEventListener(
        "campusflow_notifications_refresh",
        handleRefresh
      );
      window.removeEventListener("focus", handleRefresh);
      window.clearInterval(interval);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Ignore transient error
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch {
      // Ignore transient error
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const res = await fetch(
        `/api/notifications?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        toast.error("Could not delete notification.");
        return;
      }
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id);
      });
      toast.success("Notification removed.");
    } catch {
      toast.error("Unable to delete notification.");
    }
  };

  const openFilePreview = (item: NotificationItem) => {
    if (!item.fileUrl) return;
    setPreviewFile({
      title: item.title,
      fileName: item.fileName,
      subtitle: `${item.fileName} • ${item.grade}`,
      mimeType: item.mimeType,
      fileUrl: item.fileUrl,
      downloadUrl: item.downloadUrl,
    });
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) markRead(item._id);
    setIsOpen(false);
    setSelectedNotification({ ...item, isRead: true });
  };

  const visibleItems =
    filterMode === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const attachedFilesCount = notifications.filter((n) =>
    Boolean(n.fileUrl)
  ).length;

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {canBroadcast && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => {
              setIsOpen(false);
              setShowBroadcastModal(true);
            }}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold border-primary/35 text-primary hover:bg-primary/10 hover:text-primary"
            title="Send notification to Parents, Students, or Campus"
          >
            <Send className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden md:inline">Send Notification</span>
          </Button>
        )}

        <div ref={containerRef} className="relative">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => {
              const next = !isOpen;
              setIsOpen(next);
              if (next) fetchNotifications(false);
            }}
            aria-label="Open notifications"
            aria-expanded={isOpen}
            className={`relative transition-colors ${
              isOpen ? "border-primary bg-primary/5 text-primary" : ""
            }`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-xs ring-2 ring-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {isOpen && (
            <div
              role="dialog"
              aria-label="Campus Notifications"
              className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full sm:mt-2 z-50 w-[min(410px,calc(100vw-1.5rem))] rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-border/70 bg-muted/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-foreground leading-tight">
                      {userRole === "admin"
                        ? "Campus Activity & Notifications"
                        : "Campus Notifications"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {unreadCount > 0
                        ? `${unreadCount} unread ${unreadCount === 1 ? "update" : "updates"}`
                        : "You are all caught up"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {canBroadcast && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setShowBroadcastModal(true);
                      }}
                      className="h-7 px-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold flex items-center gap-1 hover:opacity-90 transition-opacity"
                      title="Compose new notification"
                    >
                      <Send className="h-3 w-3" />
                      <span>New</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fetchNotifications(false)}
                    className="h-7 w-7 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                    title="Refresh notifications"
                    aria-label="Refresh notifications"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                    />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="h-7 px-2 rounded-lg hover:bg-accent text-[11px] font-semibold text-primary flex items-center gap-1 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter & Dynamic View All Files Bar */}
              <div className="px-3 py-2 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 bg-background/60">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFilterMode("all")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      filterMode === "all"
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode("unread")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      filterMode === "unread"
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowAllFilesModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors shrink-0 ml-auto"
                >
                  <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    View All Files
                    {attachedFilesCount > 0 ? ` (${attachedFilesCount})` : ""}
                  </span>
                </button>
              </div>

              <NotificationFeedList
                items={visibleItems}
                isLoading={isLoading}
                filterMode={filterMode}
                canBroadcast={canBroadcast}
                nowMs={nowMs}
                onItemClick={handleNotificationClick}
                onDelete={handleDeleteNotification}
                onPreviewFile={(item) => {
                  if (!item.isRead) markRead(item._id);
                  setIsOpen(false);
                  openFilePreview(item);
                }}
                onMarkRead={markRead}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modular Single-Responsibility Modals */}
      <BroadcastNotificationModal
        open={showBroadcastModal && canBroadcast}
        userRole={userRole}
        onClose={() => setShowBroadcastModal(false)}
        onSent={() => fetchNotifications(true)}
      />

      <NotificationDetailModal
        notification={selectedNotification}
        userRole={userRole}
        canBroadcast={canBroadcast}
        nowMs={nowMs}
        onClose={() => setSelectedNotification(null)}
        onDelete={handleDeleteNotification}
        onOpenFullPreview={(item) => {
          setSelectedNotification(null);
          openFilePreview(item);
        }}
      />

      <AllFilesModal
        open={showAllFilesModal}
        userRole={userRole}
        onClose={() => setShowAllFilesModal(false)}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
}
