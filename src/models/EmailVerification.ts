import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmailVerification extends Document {
  email: string;
  codeHash: string;
  attempts: number;
  resendCount: number;
  lastSentAt: Date;
  expiresAt: Date;
  pendingUser: {
    name: string;
    passwordHash: string;
    role: "admin" | "teacher" | "student" | "parent";
    institution: string;
    extraField?: string;
    schoolId?: string;
    schoolCode?: string;
    linkedStudentId?: string;
    linkedStudentIds?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmailVerificationSchema = new Schema<IEmailVerification>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 1 },
    lastSentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    pendingUser: {
      name: { type: String, required: true },
      passwordHash: { type: String, required: true },
      role: {
        type: String,
        enum: ["admin", "teacher", "student", "parent"],
        required: true,
      },
      institution: { type: String, required: true },
      extraField: { type: String },
      schoolId: { type: String },
      schoolCode: { type: String },
      linkedStudentId: { type: String },
      linkedStudentIds: [{ type: String }],
    },
  },
  { timestamps: true }
);

// Auto-delete expired verification documents via MongoDB TTL index
EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

if (
  mongoose.models.EmailVerification &&
  (!mongoose.models.EmailVerification.schema.path("pendingUser.schoolId") ||
    !mongoose.models.EmailVerification.schema.path("pendingUser.linkedStudentIds"))
) {
  mongoose.deleteModel("EmailVerification");
}

export const EmailVerification: Model<IEmailVerification> =
  mongoose.models.EmailVerification ||
  mongoose.model<IEmailVerification>("EmailVerification", EmailVerificationSchema);
