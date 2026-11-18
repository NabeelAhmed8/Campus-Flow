"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  CheckCheck,
  RefreshCw,
  X,
  ExternalLink,
  Megaphone,
  Send,
  AlertTriangle,
  ShieldCheck,
  Trash2,
  FolderOpen,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { CampusDocumentsPanel } from "@/components/campus-documents-panel";

interface NotificationItem {
  _id: string;
  category:
    | "timetable"
    | "syllabus"
    | "datesheet"
    | "circular"
    | "announcement"
    | "urgent"
    | "billing";
  title: string;
  message: string;
  audience: string;
  grade: string;
  section: string;
  priority: "normal" | "urgent";
  documentId: string | null;
  fileName: string;
  mimeType: string;
  fileUrl: string | null;
  downloadUrl: string | null;
  createdBy: string;
  senderRole: "admin" | "coordinator";
  createdAt: string;
  isRead: boolean;
}

interface NotificationBellProps {
  userRole: string | null;
}

const CATEGORY_META = {
  timetable: {
    label: "Timetable",
    icon: Clock,
    pill: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
    iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  syllabus: {
    label: "Syllabus",
    icon: BookOpen,
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  datesheet: {
    label: "Date Sheet",
    icon: FileText,
    pill: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  circular: {
    label: "Circular",
    icon: Megaphone,
    pill: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    pill: "bg-primary/10 text-primary border-primary/25",
    iconBg: "bg-primary/10 text-primary",
  },
  urgent: {
    label: "Urgent Alert",
    icon: AlertTriangle,
    pill: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  billing: {
    label: "Subscription",
    icon: CreditCard,
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
} as const;

const AUDIENCE_LABELS: Record<string, string> = {
  all: "All Campus",
  admin: "Admin Only",
  parents_students: "Parents & Students",
  parents: "Parents",
  students: "Students",
  teachers: "Teachers",
};

const BROADCAST_AUDIENCE_OPTIONS = [
  {
    value: "parents_students",
    label: "Parents & Students",
    sublabel: "Visible to Parents, Students & Admin",
  },
  {
    value: "all",
    label: "All Campus (Everyone)",
    sublabel: "Parents, Students, Teachers & Admin",
  },
  {
    value: "parents",
    label: "Parents Only",
    sublabel: "Guardians & Admin oversight",
  },
  {
    value: "students",
    label: "Students Only",
    sublabel: "Students & Admin oversight",
  },
  {
    value: "teachers",
    label: "Teachers & Faculty",
    sublabel: "Faculty & Admin oversight",
  },
];

const BROADCAST_CATEGORY_OPTIONS = [
  { value: "announcement", label: "General Announcement" },
  { value: "urgent", label: "Urgent Alert / Holiday Notice" },
  { value: "circular", label: "Official Campus Circular" },
  { value: "datesheet", label: "Exam / Assessment Update" },
  { value: "timetable", label: "Timetable Notice" },
  { value: "syllabus", label: "Syllabus Update" },
];

const BROADCAST_GRADE_OPTIONS = [
  { value: "All Classes", label: "All Classes" },
  { value: "Grade 7", label: "Grade 7" },
  { value: "Grade 8", label: "Grade 8" },
  { value: "Grade 9", label: "Grade 9" },
  { value: "Grade 10", label: "Grade 10" },
  { value: "Grade 11", label: "Grade 11" },
  { value: "Grade 12", label: "Grade 12" },
];

function formatRelativeTime(isoDate: string, nowMs: number): string {
  if (!isoDate || !nowMs) return "";
  const createdMs = new Date(isoDate).getTime();
  if (Number.isNaN(createdMs)) return "";
  const diffSec = Math.max(0, Math.floor((nowMs - createdMs) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return isoDate.slice(0, 10);
}

function formatFullDateTime(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate.slice(0, 10);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell({ userRole }: NotificationBellProps) {
  const router = useRouter();
  const canBroadcast = userRole === "admin" || userRole === "coordinator";

  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [nowMs, setNowMs] = useState(0);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [previewItem, setPreviewItem] = useState<NotificationItem | null>(null);
  const [showAllFilesModal, setShowAllFilesModal] = useState(false);

  // Broadcast Modal State (Admin & Coordinator)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [bcAudience, setBcAudience] = useState("parents_students");
  const [bcCategory, setBcCategory] = useState("announcement");
  const [bcGrade, setBcGrade] = useState("All Classes");
  const [bcPriority, setBcPriority] = useState<"normal" | "urgent">("normal");
  const [bcTitle, setBcTitle] = useState("");
  const [bcMessage, setBcMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

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

    const handleRefreshEvent = () => fetchNotifications(true);
    const handleFocus = () => fetchNotifications(true);

    window.addEventListener(
      "campusflow_notifications_refresh",
      handleRefreshEvent
    );
    window.addEventListener("focus", handleFocus);
    const interval = window.setInterval(() => fetchNotifications(true), 30000);

    return () => {
      window.removeEventListener(
        "campusflow_notifications_refresh",
        handleRefreshEvent
      );
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Close dropdown on outside click or Escape
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
      if (e.key === "Escape") {
        setIsOpen(false);
      }
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

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcTitle.trim() || !bcMessage.trim()) {
      toast.error("Please enter both a headline and message.");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bcTitle.trim(),
          message: bcMessage.trim(),
          audience: bcAudience,
          category: bcCategory,
          grade: bcGrade,
          priority: bcCategory === "urgent" ? "urgent" : bcPriority,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send notification.");
        return;
      }

      toast.success(data.message || "Notification sent successfully.");
      setBcTitle("");
      setBcMessage("");
      setBcPriority("normal");
      setShowBroadcastModal(false);
      await fetchNotifications(true);
    } catch {
      toast.error("Network error while sending notification.");
    } finally {
      setIsSending(false);
    }
  };

  // Close active modal on Escape key
  useEffect(() => {
    if (
      !selectedNotification &&
      !previewItem &&
      !showBroadcastModal &&
      !showAllFilesModal
    ) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewItem) setPreviewItem(null);
        else if (selectedNotification) setSelectedNotification(null);
        else if (showAllFilesModal) setShowAllFilesModal(false);
        else if (showBroadcastModal) setShowBroadcastModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedNotification,
    previewItem,
    showBroadcastModal,
    showAllFilesModal,
  ]);

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markRead(item._id);
    }
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
        {/* Quick Send Notification Button for Admin & Coordinator */}
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

        {/* Notification Bell Trigger + Dropdown */}
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

          {/* Responsive Themed Notification Popover */}
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

              {/* Responsive Filter & Dynamic View All Files Bar */}
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

              {/* Notifications Feed */}
              <div className="max-h-[min(430px,62vh)] overflow-y-auto divide-y divide-border/50">
                {isLoading && notifications.length === 0 ? (
                  <div className="py-10 text-center text-xs text-muted-foreground">
                    Checking campus updates...
                  </div>
                ) : visibleItems.length === 0 ? (
                  <div className="py-10 px-6 text-center space-y-1.5">
                    <Bell className="h-8 w-8 mx-auto text-muted-foreground/30" />
                    <p className="text-xs font-semibold text-foreground">
                      {filterMode === "unread"
                        ? "No Unread Notifications"
                        : "No Campus Updates Yet"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {userRole === "admin"
                        ? "Every notification, timetable, syllabus, or date sheet sent by your Academic Coordinator or Admin will appear here for full visibility."
                        : "Official announcements, timetables, syllabi, and exam date sheets from Administration & Academic Coordinator will appear right here."}
                    </p>
                  </div>
                ) : (
                  visibleItems.map((item) => {
                    const meta =
                      CATEGORY_META[item.category] ||
                      CATEGORY_META.announcement;
                    const CatIcon = meta.icon;
                    const isPdf = item.mimeType === "application/pdf";
                    const isUrgent =
                      item.priority === "urgent" || item.category === "urgent";

                    return (
                      <div
                        key={item._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNotificationClick(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleNotificationClick(item);
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
                            {isUrgent ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : (
                              <CatIcon className="h-4 w-4" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-foreground leading-snug break-words">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-1 shrink-0">
                                {!item.isRead && (
                                  <span
                                    className="h-2 w-2 rounded-full bg-primary mt-0.5"
                                    title="Unread"
                                  />
                                )}
                                {canBroadcast && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNotification(item._id);
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

                            {/* Metadata: Category, Sender, Audience (Admin Oversight), Class, Time */}
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
                                {item.senderRole === "admin"
                                  ? "Admin"
                                  : "Coordinator"}{" "}
                                • {item.createdBy}
                              </span>

                              {canBroadcast && (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300">
                                  To: {AUDIENCE_LABELS[item.audience] || item.audience}
                                </span>
                              )}

                              {item.grade && item.grade !== "All Classes" && (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                  {item.grade}
                                </span>
                              )}

                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {formatRelativeTime(item.createdAt, nowMs)}
                              </span>
                            </div>

                            {/* Direct Attachment Actions */}
                            {item.fileUrl && (
                              <div
                                className="flex flex-wrap items-center gap-1.5 pt-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!item.isRead) markRead(item._id);
                                    setIsOpen(false);
                                    setPreviewItem(item);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                                >
                                  {isPdf ? (
                                    <FileText className="h-3 w-3" />
                                  ) : (
                                    <ImageIcon className="h-3 w-3" />
                                  )}
                                  <Eye className="h-3 w-3" />
                                  Preview {isPdf ? "PDF" : "Image"}
                                </button>

                                {item.downloadUrl && (
                                  <a
                                    href={item.downloadUrl}
                                    download={item.fileName || "document"}
                                    onClick={() => {
                                      if (!item.isRead) markRead(item._id);
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
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Notification Composer Modal (Admin & Coordinator) */}
      {showBroadcastModal && canBroadcast && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setShowBroadcastModal(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Send Campus Notification
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Deliver instant portal alerts to Parents, Students, or Faculty.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowBroadcastModal(false)}
                className="h-8 w-8 p-0"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {userRole === "coordinator" && (
              <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 px-3 py-2 text-[11px] text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Admin Oversight Active:</strong>{" "}
                  Every notification sent from the Coordinator Desk is also automatically delivered to the School Admin.
                </span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label
                  htmlFor="bc-audience"
                  className="block text-[11px] font-semibold mb-1"
                >
                  Target Audience
                </label>
                <CustomSelect
                  id="bc-audience"
                  value={bcAudience}
                  onChange={setBcAudience}
                  options={BROADCAST_AUDIENCE_OPTIONS}
                  size="sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="bc-category"
                    className="block text-[11px] font-semibold mb-1"
                  >
                    Category
                  </label>
                  <CustomSelect
                    id="bc-category"
                    value={bcCategory}
                    onChange={(val) => {
                      setBcCategory(val);
                      if (val === "urgent") setBcPriority("urgent");
                    }}
                    options={BROADCAST_CATEGORY_OPTIONS}
                    size="sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bc-grade"
                    className="block text-[11px] font-semibold mb-1"
                  >
                    Applicable Class
                  </label>
                  <CustomSelect
                    id="bc-grade"
                    value={bcGrade}
                    onChange={setBcGrade}
                    options={BROADCAST_GRADE_OPTIONS}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-semibold mb-1">
                  Priority Level
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBcPriority("normal")}
                    className={`h-8.5 rounded-lg border text-xs font-semibold transition-all ${
                      bcPriority === "normal"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Normal Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => setBcPriority("urgent")}
                    className={`h-8.5 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      bcPriority === "urgent"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Urgent Alert
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="bc-title"
                  className="block text-[11px] font-semibold mb-1"
                >
                  Notification Headline
                </label>
                <input
                  id="bc-title"
                  name="broadcastTitle"
                  type="text"
                  autoComplete="off"
                  required
                  maxLength={140}
                  value={bcTitle}
                  onChange={(e) => setBcTitle(e.target.value)}
                  placeholder="e.g. Tomorrow Holiday Notice / PTM Reminder / Fee Due Date"
                  className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="bc-message"
                  className="block text-[11px] font-semibold mb-1"
                >
                  Message Details
                </label>
                <textarea
                  id="bc-message"
                  name="broadcastMessage"
                  rows={4}
                  required
                  maxLength={600}
                  value={bcMessage}
                  onChange={(e) => setBcMessage(e.target.value)}
                  placeholder="Write the complete notification message for parents, students, or teachers..."
                  className="w-full rounded-lg border bg-background p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                  {bcMessage.length}/600
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBroadcastModal(false)}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSending}
                  className="h-9 text-xs px-4"
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {isSending ? "Sending..." : "Send Notification Now"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Notification Details Popup Modal */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedNotification(null)}
        >
          {(() => {
            const detailMeta =
              CATEGORY_META[selectedNotification.category] ||
              CATEGORY_META.announcement;
            const DetailIcon = detailMeta.icon;
            const isDetailUrgent =
              selectedNotification.priority === "urgent" ||
              selectedNotification.category === "urgent";
            const isDetailPdf =
              selectedNotification.mimeType === "application/pdf";

            return (
              <div
                role="dialog"
                aria-modal="true"
                aria-label={selectedNotification.title}
                className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="px-5 py-4 border-b bg-muted/30 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isDetailUrgent
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : detailMeta.iconBg
                      }`}
                    >
                      {isDetailUrgent ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <DetailIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isDetailUrgent
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                              : detailMeta.pill
                          }`}
                        >
                          {isDetailUrgent ? "Urgent Alert" : detailMeta.label}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground">
                          {selectedNotification.senderRole === "admin"
                            ? "School Admin"
                            : "Academic Coordinator"}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug break-words">
                        {selectedNotification.title}
                      </h2>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNotification(null)}
                    className="h-8 w-8 p-0 shrink-0"
                    aria-label="Close notification details"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-5 overflow-y-auto space-y-4">
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-xl border bg-muted/20 px-3.5 py-2.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                        Sent By
                      </span>
                      <span className="font-semibold text-foreground mt-0.5 block truncate">
                        {selectedNotification.createdBy} (
                        {selectedNotification.senderRole === "admin"
                          ? "Admin"
                          : "Coordinator"}
                        )
                      </span>
                    </div>

                    <div className="rounded-xl border bg-muted/20 px-3.5 py-2.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                        Target Audience
                      </span>
                      <span className="font-semibold text-foreground mt-0.5 block truncate">
                        {AUDIENCE_LABELS[selectedNotification.audience] ||
                          selectedNotification.audience}
                      </span>
                    </div>

                    <div className="rounded-xl border bg-muted/20 px-3.5 py-2.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                        Applicable Class &amp; Section
                      </span>
                      <span className="font-semibold text-foreground mt-0.5 block truncate">
                        {selectedNotification.grade || "All Classes"}
                        {selectedNotification.section &&
                        selectedNotification.section !== "All Sections"
                          ? ` • Section ${selectedNotification.section}`
                          : ""}
                      </span>
                    </div>

                    <div className="rounded-xl border bg-muted/20 px-3.5 py-2.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                        Received
                      </span>
                      <span className="font-semibold text-foreground mt-0.5 block truncate">
                        {formatFullDateTime(selectedNotification.createdAt)}
                        {nowMs
                          ? ` (${formatRelativeTime(
                              selectedNotification.createdAt,
                              nowMs
                            )})`
                          : ""}
                      </span>
                    </div>
                  </div>

                  {/* Full Message Card */}
                  <div className="rounded-xl border bg-background p-4 space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                      Notification Message
                    </span>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line break-words">
                      {selectedNotification.message}
                    </p>
                  </div>

                  {/* Attached PDF / Image Inline Preview */}
                  {selectedNotification.fileUrl && (
                    <div className="rounded-xl border bg-muted/15 p-3.5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {isDetailPdf ? (
                            <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-foreground truncate">
                            {selectedNotification.fileName || "Attached File"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setPreviewItem(selectedNotification);
                              setSelectedNotification(null);
                            }}
                            className="h-7 text-[11px]"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Full Screen
                          </Button>
                          <a
                            href={selectedNotification.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold hover:bg-muted transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open Tab
                          </a>
                          {selectedNotification.downloadUrl && (
                            <a
                              href={selectedNotification.downloadUrl}
                              download={
                                selectedNotification.fileName || "document"
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-semibold hover:opacity-90 transition-opacity"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg border bg-background overflow-hidden">
                        {isDetailPdf ? (
                          <iframe
                            src={selectedNotification.fileUrl}
                            title={selectedNotification.title}
                            className="w-full h-72"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedNotification.fileUrl}
                            alt={selectedNotification.title}
                            className="w-full max-h-80 object-contain bg-muted/20"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-5 py-3 border-t bg-muted/20 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {canBroadcast && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const targetId = selectedNotification._id;
                          setSelectedNotification(null);
                          handleDeleteNotification(targetId);
                        }}
                        className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    )}

                    {userRole === "admin" &&
                      selectedNotification.category === "billing" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedNotification(null);
                            window.history.replaceState(
                              null,
                              "",
                              "/admin?tab=subscription"
                            );
                            window.dispatchEvent(
                              new CustomEvent("campusflow_tab_change", {
                                detail: {
                                  tab: "subscription",
                                  tabKey: "subscription",
                                },
                              })
                            );
                            router.push("/admin?tab=subscription");
                          }}
                          className="h-8 text-xs"
                        >
                          Open Subscription &amp; Plan →
                        </Button>
                      )}

                    {(userRole === "teacher" ||
                      userRole === "student" ||
                      userRole === "parent") &&
                      (selectedNotification.fileUrl ||
                        selectedNotification.category === "timetable" ||
                        selectedNotification.category === "syllabus" ||
                        selectedNotification.category === "datesheet") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedNotification(null);
                            window.dispatchEvent(
                              new CustomEvent("campusflow_tab_change", {
                                detail: {
                                  tab: "schedules",
                                  tabKey: "schedules",
                                },
                              })
                            );
                            router.push(`/${userRole}?tab=schedules`);
                          }}
                          className="h-8 text-xs"
                        >
                          Open Schedules &amp; Date Sheets →
                        </Button>
                      )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setSelectedNotification(null)}
                    className="h-8 text-xs px-4 ml-auto"
                  >
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Dynamic Responsive All Campus Files & Schedules Modal */}
      {showAllFilesModal && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5"
          onClick={() => setShowAllFilesModal(false)}
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
                      setShowAllFilesModal(false);
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
                  onClick={() => setShowAllFilesModal(false)}
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
      )}

      {/* Inline Themed File Preview Modal (PDF & Image) */}
      {previewItem && previewItem.fileUrl && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between gap-3 bg-muted/30">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground truncate">
                  {previewItem.title}
                </h3>
                <p className="text-[11px] text-muted-foreground truncate">
                  {previewItem.fileName} • {previewItem.grade}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={previewItem.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open Tab</span>
                </a>
                {previewItem.downloadUrl && (
                  <a
                    href={previewItem.downloadUrl}
                    download={previewItem.fileName || "document"}
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
                  onClick={() => setPreviewItem(null)}
                  className="h-8 w-8 p-0"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-muted/20 p-3 sm:p-4 flex items-center justify-center min-h-[60vh]">
              {previewItem.mimeType === "application/pdf" ? (
                <iframe
                  src={previewItem.fileUrl}
                  title={previewItem.title}
                  className="w-full h-[70vh] rounded-xl border bg-background"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewItem.fileUrl}
                  alt={previewItem.title}
                  className="max-w-full max-h-[72vh] object-contain rounded-xl border shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
