import mongoose, { Schema, Document, Model } from "mongoose";

export type FeeStatus = "paid" | "pending" | "overdue" | "pending_verification";

export interface IFee extends Document {
  schoolId?: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber: string;
  grade: string;
  amount: number;
  month: string;
  dueDate: Date;
  paidDate?: Date;
  submittedAt?: Date;
  status: FeeStatus;
  invoiceNumber: string;
  paymentMethod?: string;
  transactionRef?: string;
  depositorName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeeSchema = new Schema<IFee>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    grade: { type: String, required: true },
    amount: { type: Number, required: true },
    month: { type: String, required: true },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: ["paid", "pending", "overdue", "pending_verification"],
      default: "pending",
    },
    invoiceNumber: { type: String, required: true, unique: true },
    paymentMethod: { type: String, default: "" },
    transactionRef: { type: String, default: "" },
    depositorName: { type: String, default: "" },
  },
  { timestamps: true }
);

const existingFeeModel = mongoose.models.Fee;
if (existingFeeModel) {
  const statusPath = existingFeeModel.schema.path("status") as
    | { enumValues?: string[] }
    | undefined;
  const hasPendingVerif = statusPath?.enumValues?.includes("pending_verification");
  if (
    !existingFeeModel.schema.path("schoolId") ||
    !existingFeeModel.schema.path("depositorName") ||
    !hasPendingVerif
  ) {
    mongoose.deleteModel("Fee");
  }
}

export const Fee: Model<IFee> =
  mongoose.models.Fee || mongoose.model<IFee>("Fee", FeeSchema);
