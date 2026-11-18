import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationCategory =
  | "timetable"
  | "syllabus"
  | "datesheet"
  | "circular"
  | "announcement"
  | "urgent"
  | "billing";

export type NotificationAudience =
  | "all"
  | "admin"
  | "parents_students"
  | "teachers"
  | "parents"
  | "students";

export interface ICampusNotification extends Document {
  schoolId: mongoose.Types.ObjectId;
  category: NotificationCategory;
  title: string;
  message: string;
  audience: NotificationAudience;
  grade: string;
  section: string;
  priority: "normal" | "urgent";
  documentId?: mongoose.Types.ObjectId;
  fileName?: string;
  mimeType?: string;
  createdBy: string;
  senderRole: "admin" | "coordinator";
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CampusNotificationSchema: Schema<ICampusNotification> = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "timetable",
        "syllabus",
        "datesheet",
        "circular",
        "announcement",
        "urgent",
        "billing",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ["all", "admin", "parents_students", "teachers", "parents", "students"],
      default: "all",
    },
    grade: { type: String, default: "All Classes", trim: true },
    section: { type: String, default: "All Sections", trim: true },
    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "CampusDocument",
      required: false,
    },
    fileName: { type: String, default: "", trim: true },
    mimeType: { type: String, default: "", trim: true },
    createdBy: { type: String, default: "Academic Coordinator", trim: true },
    senderRole: {
      type: String,
      enum: ["admin", "coordinator"],
      default: "coordinator",
    },
    readBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

CampusNotificationSchema.index({ schoolId: 1, createdAt: -1 });

// Guard against stale Mongoose schema cache during dev HMR
const existingModel = mongoose.models.CampusNotification;
if (existingModel) {
  const audiencePath = existingModel.schema.path("audience") as
    | { enumValues?: string[] }
    | undefined;
  const hasSenderRole = Boolean(existingModel.schema.path("senderRole"));
  if (
    !hasSenderRole ||
    !audiencePath?.enumValues?.includes("parents_students") ||
    !audiencePath?.enumValues?.includes("admin")
  ) {
    mongoose.deleteModel("CampusNotification");
  }
}

export const CampusNotification: Model<ICampusNotification> =
  mongoose.models.CampusNotification ||
  mongoose.model<ICampusNotification>(
    "CampusNotification",
    CampusNotificationSchema
  );
