import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISyllabusItem extends Document {
  schoolId: mongoose.Types.ObjectId;
  grade: string;
  term: "first_term" | "mid_term" | "final_term";
  subject: string;
  chapterTitle: string;
  topics: string;
  targetDate: string;
  status: "pending" | "in_progress" | "completed";
  assignedTeacher: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const SyllabusItemSchema = new Schema<ISyllabusItem>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    grade: { type: String, required: true, trim: true },
    term: {
      type: String,
      enum: ["first_term", "mid_term", "final_term"],
      default: "first_term",
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    chapterTitle: { type: String, required: true, trim: true },
    topics: { type: String, default: "", trim: true },
    targetDate: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    assignedTeacher: { type: String, default: "Subject Teacher", trim: true },
    createdBy: { type: String, default: "Academic Coordinator", trim: true },
  },
  { timestamps: true }
);

export const SyllabusItem: Model<ISyllabusItem> =
  mongoose.models.SyllabusItem ||
  mongoose.model<ISyllabusItem>("SyllabusItem", SyllabusItemSchema);
