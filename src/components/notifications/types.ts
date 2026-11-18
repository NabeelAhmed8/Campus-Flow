import {
  Clock,
  BookOpen,
  FileText,
  Megaphone,
  AlertTriangle,
  CreditCard,
} from "lucide-react";

export type NotificationCategoryKey =
  | "timetable"
  | "syllabus"
  | "datesheet"
  | "circular"
  | "announcement"
  | "urgent"
  | "billing";

export interface NotificationItem {
  _id: string;
  category: NotificationCategoryKey;
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

export const NOTIFICATION_CATEGORY_META = {
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
