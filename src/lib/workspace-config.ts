import {
  LayoutDashboard,
  ReceiptText,
  BrainCircuit,
  Users,
  Bell,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Award,
  HelpCircle,
  CalendarCheck,
  ShieldCheck,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export interface WorkspaceNavItem {
  name: string;
  href: string;
  tabKey?: string;
  icon: LucideIcon;
  badge?: string;
}

export interface WorkspaceConfig {
  id: "admin" | "coordinator" | "teacher" | "student" | "parent";
  title: string;
  badge: string;
  roleLabel: string;
  description: string;
  landingDescription: string;
  defaultTab: string;
  icon: LucideIcon;
  rootHref: string;
  navItems: WorkspaceNavItem[];
}

export const WORKSPACES: Record<string, WorkspaceConfig> = {
  admin: {
    id: "admin",
    title: "Admin Hub",
    badge: "Admin Workspace",
    roleLabel: "Institutional Admin",
    description: "Campus operations, finances & student records",
    landingDescription: "CampusFlow platform features, modules & solutions",
    defaultTab: "students",
    icon: LayoutDashboard,
    rootHref: "/admin",
    navItems: [
      {
        name: "Enrolled Students Directory",
        href: "/admin?tab=students",
        tabKey: "students",
        icon: Users,
      },
      {
        name: "Fee Billing & Bank Vouchers",
        href: "/admin?tab=billing",
        tabKey: "billing",
        icon: ReceiptText,
      },
      {
        name: "Faculty & Section Assignments",
        href: "/admin?tab=faculty",
        tabKey: "faculty",
        icon: BrainCircuit,
      },
      {
        name: "Financial Analytics & Velocity",
        href: "/admin?tab=overview",
        tabKey: "overview",
        icon: LayoutDashboard,
      },
      {
        name: "Subscription & Plan",
        href: "/admin?tab=subscription",
        tabKey: "subscription",
        icon: CreditCard,
      },
    ],
  },
  coordinator: {
    id: "coordinator",
    title: "Coordinator Desk",
    badge: "Academic Coordinator",
    roleLabel: "Academic Coordinator",
    description: "Faculty attendance, substitutions, timetables & syllabus tracking",
    landingDescription: "Return to main platform & institutional showcase",
    defaultTab: "teacher-attendance",
    icon: ShieldCheck,
    rootHref: "/coordinator",
    navItems: [
      {
        name: "Faculty Attendance & Substitutions",
        href: "/coordinator?tab=teacher-attendance",
        tabKey: "teacher-attendance",
        icon: CalendarCheck,
      },
      {
        name: "Class Timetable Scheduler",
        href: "/coordinator?tab=timetable",
        tabKey: "timetable",
        icon: Clock,
      },
      {
        name: "Term Syllabus Planner",
        href: "/coordinator?tab=syllabus",
        tabKey: "syllabus",
        icon: BookOpen,
      },
      {
        name: "Exam Date Sheet & Circulars",
        href: "/coordinator?tab=notices",
        tabKey: "notices",
        icon: Bell,
      },
    ],
  },
  teacher: {
    id: "teacher",
    title: "Teacher AI Suite",
    badge: "Faculty Workspace",
    roleLabel: "Faculty Educator",
    description: "AI lesson planning, quizzes, grades & attendance",
    landingDescription: "Return to main platform & pedagogical showcase",
    defaultTab: "planner",
    icon: BrainCircuit,
    rootHref: "/teacher",
    navItems: [
      {
        name: "AI Lesson Planner",
        href: "/teacher?tab=planner",
        tabKey: "planner",
        icon: BrainCircuit,
      },
      {
        name: "Formative Quiz Maker",
        href: "/teacher?tab=quiz",
        tabKey: "quiz",
        icon: HelpCircle,
      },
      {
        name: "Class Homework & Tasks",
        href: "/teacher?tab=homework",
        tabKey: "homework",
        icon: BookOpen,
      },
      {
        name: "Student Marks & Feedback",
        href: "/teacher?tab=gradebook",
        tabKey: "gradebook",
        icon: Award,
      },
      {
        name: "Daily Attendance",
        href: "/teacher?tab=attendance",
        tabKey: "attendance",
        icon: CalendarCheck,
      },
      {
        name: "Timetable, Syllabus & Date Sheets",
        href: "/teacher?tab=schedules",
        tabKey: "schedules",
        icon: Calendar,
      },
    ],
  },
  student: {
    id: "student",
    title: "Student Portal",
    badge: "Learner Workspace",
    roleLabel: "Enrolled Student",
    description: "Daily schedules, homework tasks & AI study mentor",
    landingDescription: "Return to main platform & learning solutions",
    defaultTab: "timetable",
    icon: BookOpen,
    rootHref: "/student",
    navItems: [
      {
        name: "Class Timetable",
        href: "/student?tab=timetable",
        tabKey: "timetable",
        icon: Clock,
      },
      {
        name: "Timetable, Syllabus & Date Sheets",
        href: "/student?tab=schedules",
        tabKey: "schedules",
        icon: Calendar,
      },
      {
        name: "Homework & Tasks",
        href: "/student?tab=assignments",
        tabKey: "assignments",
        icon: BookOpen,
      },
      {
        name: "Report Card & Grades",
        href: "/student?tab=grades",
        tabKey: "grades",
        icon: Award,
      },
      {
        name: "Gemini AI Study Coach",
        href: "/student?tab=study-ai",
        tabKey: "study-ai",
        icon: Sparkles,
      },
    ],
  },
  parent: {
    id: "parent",
    title: "Parent Portal",
    badge: "Guardian Workspace",
    roleLabel: "Registered Guardian",
    description: "Ward performance, attendance & fee billing",
    landingDescription: "Return to main platform & institution info",
    defaultTab: "overview",
    icon: Users,
    rootHref: "/parent",
    navItems: [
      {
        name: "Child Academic Standing",
        href: "/parent?tab=overview",
        tabKey: "overview",
        icon: Users,
      },
      {
        name: "Exam Results & Report Card",
        href: "/parent?tab=results",
        tabKey: "results",
        icon: Award,
      },
      {
        name: "Timetable, Syllabus & Date Sheets",
        href: "/parent?tab=schedules",
        tabKey: "schedules",
        icon: Calendar,
      },
      {
        name: "Pakistani Bank Fee Pay",
        href: "/parent?tab=fees",
        tabKey: "fees",
        icon: ReceiptText,
      },
      {
        name: "Teacher Remarks & Feedback",
        href: "/parent?tab=remarks",
        tabKey: "remarks",
        icon: Bell,
      },
      {
        name: "Absence & Leave Notice",
        href: "/parent?tab=leave",
        tabKey: "leave",
        icon: CalendarCheck,
      },
    ],
  },
};

export const STATIC_BREADCRUMBS: Record<string, { label: string; href?: string }[]> = {
  "/admin": [
    { label: "Dashboard", href: "/admin" },
    { label: "Admin Hub" },
  ],
  "/coordinator": [
    { label: "Dashboard", href: "/coordinator" },
    { label: "Coordinator Desk" },
  ],
  "/teacher": [
    { label: "Dashboard", href: "/teacher" },
    { label: "Teacher AI Suite" },
  ],
  "/parent": [
    { label: "Dashboard", href: "/parent" },
    { label: "Parent Guardian Portal" },
  ],
  "/student": [
    { label: "Dashboard", href: "/student" },
    { label: "Student Learning Portal" },
  ],
};
