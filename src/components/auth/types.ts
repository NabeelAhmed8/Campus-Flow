import { Building, BrainCircuit, BookOpen, Users } from "lucide-react";

export type PortalRole = "admin" | "teacher" | "student" | "parent";
export type SignupStep = "details" | "verify";

export interface RoleOption {
  id: PortalRole;
  title: string;
  badge: string;
  targetPath: string;
  icon: any;
  description: string;
}

export const PORTAL_ROLES: RoleOption[] = [
  {
    id: "admin",
    title: "Admin Hub",
    badge: "Institute Head",
    targetPath: "/admin",
    icon: Building,
    description: "Manage student roster, fee invoicing, and institution settings",
  },
  {
    id: "teacher",
    title: "Teacher Suite",
    badge: "Faculty",
    targetPath: "/teacher",
    icon: BrainCircuit,
    description: "AI lesson planning, question quizzes, and grading rubrics",
  },
  {
    id: "student",
    title: "Student Portal",
    badge: "Learner",
    targetPath: "/student",
    icon: BookOpen,
    description: "Class timetable, homework tracker, report card, and AI tutor",
  },
  {
    id: "parent",
    title: "Parent Portal",
    badge: "Guardian",
    targetPath: "/parent",
    icon: Users,
    description: "Attendance records, Pakistani bank fee payments, and leave notices",
  },
];
