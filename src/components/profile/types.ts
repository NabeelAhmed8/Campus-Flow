export type ProfileRole = "admin" | "coordinator" | "teacher" | "student" | "parent";

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: ProfileRole;
  institution: string;
  extraField: string;
  schoolCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileRoleMeta {
  label: string;
  workspaceTitle: string;
  workspaceHref: string;
  badgeClass: string;
  extraLabel: string;
  extraPlaceholder: string;
  permissions: string[];
}

export const PROFILE_ROLE_META: Record<ProfileRole, ProfileRoleMeta> = {
  admin: {
    label: "Institute Administrator",
    workspaceTitle: "Admin Hub",
    workspaceHref: "/admin",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    extraLabel: "Designation / Office Title",
    extraPlaceholder: "e.g. Principal, Academic Director, Registrar",
    permissions: [
      "Enroll & manage master student roster",
      "Collect & audit tuition fee ledgers",
      "Assign faculty roles & class sections",
      "Access institutional financial analytics",
    ],
  },
  coordinator: {
    label: "Academic Coordinator",
    workspaceTitle: "Coordinator Desk",
    workspaceHref: "/coordinator",
    badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    extraLabel: "Assigned Wing / Department",
    extraPlaceholder: "e.g. Senior Wing Coordinator (Grades 9–12)",
    permissions: [
      "Mark daily faculty attendance & arrange substitutions",
      "Schedule master class & section timetables",
      "Plan & track term syllabus completion",
      "Publish exam date sheets & campus circulars",
    ],
  },
  teacher: {
    label: "Faculty Educator",
    workspaceTitle: "Teacher Suite",
    workspaceHref: "/teacher",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    extraLabel: "Department / Primary Subject",
    extraPlaceholder: "e.g. Mathematics & Physics Department",
    permissions: [
      "Mark & update daily student attendance",
      "Record academic marks & formative feedback",
      "Generate AI lesson plans & assessments",
      "Monitor class rosters & student progress",
    ],
  },
  student: {
    label: "Enrolled Student",
    workspaceTitle: "Student Portal",
    workspaceHref: "/student",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    extraLabel: "Grade / Class & Roll Number",
    extraPlaceholder: "e.g. Grade 10 - Section A (CF-2026-088)",
    permissions: [
      "View class timetable & subject schedule",
      "Track homework & assignment deadlines",
      "Inspect official report card & teacher remarks",
      "Generate personalized AI study quizzes",
    ],
  },
  parent: {
    label: "Verified Guardian / Parent",
    workspaceTitle: "Parent Portal",
    workspaceHref: "/parent",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    extraLabel: "Enrolled Ward / Child's Name",
    extraPlaceholder: "e.g. Hamza Tariq (Grade 10)",
    permissions: [
      "Monitor child's real-time attendance records",
      "Pay monthly tuition fees via Pakistani bank channels",
      "Read official teacher evaluation remarks",
      "Submit formal student leave notices",
    ],
  },
};
