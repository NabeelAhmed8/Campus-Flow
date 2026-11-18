import mongoose, { Schema, Document, Model } from "mongoose";

export type DocumentCategory =
  | "timetable"
  | "syllabus"
  | "datesheet"
  | "circular";

export type DocumentAudience = "all" | "teachers" | "parents" | "students";

export interface ICampusDocument extends Document {
  schoolId: mongoose.Types.ObjectId;
  category: DocumentCategory;
  title: string;
  grade: string;
  section: string;
  term: string;
  audience: DocumentAudience;
  notes: string;
  fileName: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  fileSize: number;
  fileData: Buffer;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampusDocumentSchema: Schema<ICampusDocument> = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["timetable", "syllabus", "datesheet", "circular"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    grade: { type: String, default: "All Classes", trim: true },
    section: { type: String, default: "All Sections", trim: true },
    term: { type: String, default: "", trim: true },
    audience: {
      type: String,
      enum: ["all", "teachers", "parents", "students"],
      default: "all",
    },
    notes: { type: String, default: "", trim: true },
    fileName: { type: String, required: true, trim: true },
    mimeType: {
      type: String,
      enum: ["application/pdf", "image/jpeg", "image/png"],
      required: true,
    },
    fileSize: { type: Number, required: true },
    fileData: { type: Buffer, required: true },
    uploadedBy: { type: String, default: "Academic Coordinator", trim: true },
  },
  { timestamps: true }
);

CampusDocumentSchema.index({ schoolId: 1, category: 1, createdAt: -1 });

export const CampusDocument: Model<ICampusDocument> =
  mongoose.models.CampusDocument ||
  mongoose.model<ICampusDocument>("CampusDocument", CampusDocumentSchema);
