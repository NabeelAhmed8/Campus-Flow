import mongoose, { Schema, Document, Model } from "mongoose";

export type PaymentOrderStatus = "pending" | "paid" | "failed" | "canceled";

export interface IPaymentOrder extends Document {
  orderId: string;
  tracker: string;
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  planId: "starter" | "growth" | "enterprise";
  planName: string;
  amountPkr: number;
  amountUsd: number;
  autoRenew: boolean;
  gateway: "safepay";
  environment: "sandbox" | "production";
  status: PaymentOrderStatus;
  safepayReference: string;
  webhookEventId: string;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentOrderSchema = new Schema<IPaymentOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    tracker: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: String,
      enum: ["starter", "growth", "enterprise"],
      required: true,
    },
    planName: { type: String, required: true, trim: true },
    amountPkr: { type: Number, required: true },
    amountUsd: { type: Number, required: true },
    autoRenew: { type: Boolean, default: true },
    gateway: {
      type: String,
      enum: ["safepay"],
      default: "safepay",
    },
    environment: {
      type: String,
      enum: ["sandbox", "production"],
      default: "sandbox",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "canceled"],
      default: "pending",
      index: true,
    },
    safepayReference: { type: String, default: "", trim: true },
    webhookEventId: { type: String, default: "", trim: true },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PaymentOrder: Model<IPaymentOrder> =
  mongoose.models.PaymentOrder ||
  mongoose.model<IPaymentOrder>("PaymentOrder", PaymentOrderSchema);
