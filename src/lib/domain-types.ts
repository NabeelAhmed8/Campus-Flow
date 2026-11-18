export interface AcademicRecordItem {
  id?: string;
  _id?: string;
  subject: string;
  term?: string;
  assessment?: string;
  examTitle?: string;
  examStatus?: "present" | "absent" | string;
  obtainedMarks?: number;
  marksObtained?: number;
  totalMarks?: number;
  percentage?: number;
  resultStatus?: "pass" | "fail" | "absent" | string;
  grade?: string;
  feedback?: string;
  remarks?: string;
  teacherName?: string;
  recordedAt?: string;
  date?: string;
  createdAt?: string;
}

export interface StudentDomainRecord {
  _id: string;
  name: string;
  rollNumber: string;
  grade: string;
  section: string;
  guardianName?: string;
  guardian?: string;
  parentEmail?: string;
  monthlyFee?: number;
  feeStatus?: string;
  feeAmount?: number;
  attendanceSummary?: string;
  academicRecords?: AcademicRecordItem[];
  createdAt?: string;
}

export interface FeeDomainRecord {
  _id: string;
  studentId?: string;
  studentName?: string;
  rollNumber: string;
  invoiceNumber?: string;
  grade?: string;
  section?: string;
  month?: string;
  amount?: number;
  dueDate?: string;
  status?: "paid" | "pending" | "overdue" | "pending_verification" | string;
  paymentMethod?: string;
  transactionRef?: string;
  transactionId?: string;
  paidAt?: string;
}

export interface AttendanceStatsRecord {
  present: number;
  absent: number;
  late: number;
  total?: number;
  totalDays?: number;
  attendancePercentage?: number;
  percentage?: number;
}

export interface AttendanceRowRecord {
  studentId?: string;
  student?: string;
  status: "present" | "absent" | "late" | string;
  remarks?: string;
}

export interface GradebookEntryRecord {
  id?: string;
  _id?: string;
  studentId?: string;
  studentName: string;
  rollNumber: string;
  grade: string;
  section?: string;
  classSection?: string;
  subject: string;
  term?: string;
  assessment?: string;
  examTitle?: string;
  examStatus?: "present" | "absent" | string;
  obtainedMarks?: number;
  marksObtained?: number;
  totalMarks?: number;
  percentage?: number;
  resultStatus?: "pass" | "fail" | "absent" | string;
  letterGrade?: string;
  gradeLetter?: string;
  feedback?: string;
  remarks?: string;
  teacherName?: string;
  recordedAt?: string;
  date?: string;
}

export interface UploadedDoc {
  id?: string;
  _id: string;
  category: "timetable" | "syllabus" | "datesheet" | "circular";
  title: string;
  description?: string;
  notes: string;
  grade: string;
  section: string;
  subject?: string;
  term: string;
  audience: string;
  fileName: string;
  fileType?: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  fileSize: number;
  fileUrl: string;
  downloadUrl: string;
  uploadedBy: string;
  createdAt: string;
}

export interface SyllabusRecord {
  _id: string;
  grade: string;
  subject: string;
  term: "first_term" | "mid_term" | "final_term";
  chapterTitle: string;
  topics: string;
  targetDate: string;
  status: "pending" | "in_progress" | "completed";
  assignedTeacher: string;
  notes?: string;
  createdAt?: string;
}

export interface BroadcastNotificationItem {
  id?: string;
  _id?: string;
  title: string;
  message: string;
  category: string;
  senderName?: string;
  senderRole?: string;
  createdAt: string;
}

export interface AssignmentSubmissionItem {
  studentId?: string;
  studentName: string;
  rollNumber: string;
  responseText?: string;
  submittedAt: string;
}
