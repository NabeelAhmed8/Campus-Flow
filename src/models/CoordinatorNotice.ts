import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoordinatorNotice extends Document {
  schoolId: mongoose.Types.ObjectId;
  type: "datesheet" | "circular" | "substitution" | "ptm";
  title: string;
  audience: "all" | "teachers" | "parents" | "students";
  grade: string;
  eventDate: string;
  details: string;
  postedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const CoordinatorNoticeSchema = new Schema<ICoordinatorNotice>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    type: {
      type: String,
      enum: ["datesheet", "circular", "substitution", "ptm"],
      default: "circular",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ["all", "teachers", "parents", "students"],
      default: "all",
    },
    grade: { type: String, default: "All Classes", trim: true },
    eventDate: { type: String, default: "", trim: true },
    details: { type: String, required: true, trim: true },
    postedBy: { type: String, default: "Academic Coordinator", trim: true },
  },
  { timestamps: true }
);

export const CoordinatorNotice: Model<ICoordinatorNotice> =
  mongoose.models.CoordinatorNotice ||
  mongoose.model<ICoordinatorNotice>("CoordinatorNotice", CoordinatorNoticeSchema);
