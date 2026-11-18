import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAssignmentSubmission {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber: string;
  status: "submitted";
  submittedAt: Date;
  note?: string;
}

export interface IAssignment extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  description: string;
  grade: string;
  section: string;
  dueDate: string; // YYYY-MM-DD
  points: number;
  teacherId: mongoose.Types.ObjectId;
  teacherName: string;
  submissions: IAssignmentSubmission[];
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    status: { type: String, enum: ["submitted"], default: "submitted" },
    submittedAt: { type: Date, default: Date.now },
    note: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const AssignmentSchema = new Schema<IAssignment>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    grade: { type: String, required: true, trim: true },
    section: { type: String, default: "All", trim: true },
    dueDate: { type: String, required: true, trim: true },
    points: { type: Number, default: 25, min: 1 },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherName: { type: String, default: "Faculty Instructor", trim: true },
    submissions: { type: [SubmissionSchema], default: [] },
  },
  { timestamps: true }
);

AssignmentSchema.index({ schoolId: 1, grade: 1, createdAt: -1 });

export const Assignment: Model<IAssignment> =
  mongoose.models.Assignment ||
  mongoose.model<IAssignment>("Assignment", AssignmentSchema);
