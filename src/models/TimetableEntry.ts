import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITimetableEntry extends Document {
  schoolId: mongoose.Types.ObjectId;
  grade: string;
  section: string;
  day: string;
  period: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherName: string;
  room: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableEntrySchema = new Schema<ITimetableEntry>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    grade: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true, default: "A" },
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true,
    },
    period: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    teacherName: { type: String, required: true, trim: true },
    room: { type: String, default: "Room 101", trim: true },
    createdBy: { type: String, default: "Academic Coordinator", trim: true },
  },
  { timestamps: true }
);

export const TimetableEntry: Model<ITimetableEntry> =
  mongoose.models.TimetableEntry ||
  mongoose.model<ITimetableEntry>("TimetableEntry", TimetableEntrySchema);
