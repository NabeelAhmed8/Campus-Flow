import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttendance extends Document {
  schoolId?: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber: string;
  grade: string;
  section: string;
  date: string; // ISO date string format: YYYY-MM-DD
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
  teacherName: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", index: true },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    grade: { type: String, required: true },
    section: { type: String, default: "A" },
    date: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present",
      required: true,
    },
    remarks: { type: String, default: "" },
    teacherName: { type: String, default: "Faculty Educator" },
  },
  { timestamps: true }
);

// Prevent duplicate attendance records for the same student on the same date
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

if (mongoose.models.Attendance && !mongoose.models.Attendance.schema.path("schoolId")) {
  mongoose.deleteModel("Attendance");
}

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema);
