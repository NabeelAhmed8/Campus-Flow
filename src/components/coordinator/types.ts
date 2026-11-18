export type CoordinatorTab =
  | "teacher-attendance"
  | "timetable"
  | "syllabus"
  | "notices";

export type FacultyStatus = "present" | "absent" | "late" | "leave";
export type SyllabusStatus = "pending" | "in_progress" | "completed";
export type SyllabusTerm = "first_term" | "mid_term" | "final_term";

export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "coordinator";
  subject: string;
  assignedClasses: Array<{ grade: string; section: string }>;
}

export interface AttendanceDraft {
  status: FacultyStatus;
  substituteTeacher: string;
  remarks: string;
  saved?: boolean;
}

export interface SyllabusRecord {
  _id: string;
  grade: string;
  term: SyllabusTerm;
  subject: string;
  chapterTitle: string;
  topics: string;
  targetDate: string;
  status: SyllabusStatus;
  assignedTeacher: string;
}
