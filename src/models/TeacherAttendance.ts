import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeacherAttendance extends Document {
  schoolId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  teacherName: string;
  teacherEmail: string;
  subject: string;
  date: string; // YYYY-MM-DD
  status: "present" | "absent" | "late" | "leave";
  substituteTeacher?: string;
  remarks?: string;
  markedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherAttendanceSchema = new Schema<ITeacherAttendance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherName: { type: String, required: true, trim: true },
    teacherEmail: { type: String, required: true, trim: true },
    subject: { type: String, default: "General Faculty", trim: true },
    date: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "leave"],
      default: "present",
      required: true,
    },
    substituteTeacher: { type: String, default: "", trim: true },
    remarks: { type: String, default: "", trim: true },
    markedBy: { type: String, default: "Academic Coordinator", trim: true },
  },
  { timestamps: true }
);

TeacherAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });

export const TeacherAttendance: Model<ITeacherAttendance> =
  mongoose.models.TeacherAttendance ||
  mongoose.model<ITeacherAttendance>("TeacherAttendance", TeacherAttendanceSchema);
