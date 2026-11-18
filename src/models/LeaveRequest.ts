import mongoose, { Schema, Document, Model } from "mongoose";

export type LeaveRequestStatus = "pending" | "approved" | "rejected";

export interface ILeaveRequest extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber: string;
  grade: string;
  section: string;
  parentUserId: mongoose.Types.ObjectId;
  parentName: string;
  reason: string;
  leaveDate: string; // YYYY-MM-DD
  notes: string;
  status: LeaveRequestStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    studentName: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true },
    section: { type: String, default: "A", trim: true },
    parentUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentName: { type: String, default: "Guardian", trim: true },
    reason: { type: String, required: true, trim: true },
    leaveDate: { type: String, required: true, trim: true },
    notes: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: String, default: "", trim: true },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

LeaveRequestSchema.index({ schoolId: 1, createdAt: -1 });

export const LeaveRequest: Model<ILeaveRequest> =
  mongoose.models.LeaveRequest ||
  mongoose.model<ILeaveRequest>("LeaveRequest", LeaveRequestSchema);
