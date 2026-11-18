import mongoose, { Schema, Document, Model } from "mongoose";

export type ExamTerm = "first_term" | "mid_term" | "final_term" | "class_test";
export type ExamAttendanceStatus = "present" | "absent";
export type ExamResultStatus = "pass" | "fail" | "absent";

export interface IAcademicRecord {
  id: string;
  term?: ExamTerm;
  subject: string;
  assessment: string;
  examStatus?: ExamAttendanceStatus;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  resultStatus?: ExamResultStatus;
  feedback: string;
  teacherName?: string;
  recordedAt: Date;
}

export interface IAttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
  teacherName?: string;
  recordedAt: Date;
}

export interface IStudent extends Document {
  schoolId?: mongoose.Types.ObjectId;
  name: string;
  rollNumber: string;
  grade: string;
  section: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  status: "active" | "inactive" | "graduated";
  monthlyFee: number;
  academicRecords?: IAcademicRecord[];
  attendanceRecords?: IAttendanceRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", index: true },
    name: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    grade: { type: String, required: true },
    section: { type: String, default: "A" },
    guardianName: { type: String, required: true },
    guardianEmail: { type: String, required: true },
    guardianPhone: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive", "graduated"],
      default: "active",
    },
    monthlyFee: { type: Number, required: true, default: 5000 },
    academicRecords: [
      {
        id: { type: String, required: true },
        term: {
          type: String,
          enum: ["first_term", "mid_term", "final_term", "class_test"],
          default: "first_term",
        },
        subject: { type: String, required: true },
        assessment: { type: String, required: true },
        examStatus: {
          type: String,
          enum: ["present", "absent"],
          default: "present",
        },
        totalMarks: { type: Number, required: true },
        obtainedMarks: { type: Number, required: true },
        percentage: { type: Number, required: true },
        grade: { type: String, required: true },
        resultStatus: {
          type: String,
          enum: ["pass", "fail", "absent"],
          default: "pass",
        },
        feedback: { type: String, required: true },
        teacherName: { type: String, default: "Faculty Instructor" },
        recordedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const existingStudentModel = mongoose.models.Student;
if (
  existingStudentModel &&
  (!existingStudentModel.schema.path("schoolId") ||
    !(existingStudentModel.schema.path("academicRecords") as any)?.schema?.path("examStatus"))
) {
  mongoose.deleteModel("Student");
}

export const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
