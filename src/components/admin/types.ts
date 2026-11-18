export type AdminTab = "students" | "billing" | "faculty" | "overview" | "subscription";

export interface AdminFee {
  id: string;
  mongoId: string;
  studentName: string;
  rollNumber: string;
  grade: string;
  amount: number;
  month: string;
  dueDate: string;
  status: string;
  paymentMethod: string;
  transactionRef: string;
}

export interface AdminStudent {
  id: string;
  name: string;
  rollNumber: string;
  grade: string;
  section: string;
  guardian: string;
  phone: string;
  status: string;
  monthlyFee: number;
  createdAt: string;
}

export interface AdminTeacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  role: "teacher" | "coordinator";
  assignedClasses?: Array<{ grade: string; section: string }>;
}

export interface RevenuePoint {
  month: string;
  collected: number;
  target: number;
}

export interface ClassSectionCombo {
  grade: string;
  section: string;
  count: number;
}

export interface NewStudentDraft {
  name: string;
  grade: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  monthlyFee: number;
}
