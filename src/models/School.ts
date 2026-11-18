import mongoose, { Schema, Document, Model } from "mongoose";

export type SubscriptionPlanId = "trial" | "starter" | "growth" | "enterprise";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "grace_period"
  | "canceled"
  | "expired";

export interface IBillingHistoryItem {
  invoiceId: string;
  planId: string;
  planName: string;
  amountPkr: number;
  amountUsd: number;
  paymentMethod: string;
  status: "paid" | "auto_renewed";
  paidAt: Date;
  periodStart: Date;
  periodEnd: Date;
}

export interface ISchoolSubscription {
  planId: SubscriptionPlanId;
  planName: string;
  pricePkr: number;
  priceUsd: number;
  status: SubscriptionStatus;
  trialStartsAt: Date;
  trialEndsAt: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  graceEndsAt: Date;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date | null;
  paymentMethod?: {
    type: "card" | "bank" | "wallet";
    brand: string;
    last4: string;
    label: string;
  } | null;
  sentReminders: string[];
  billingHistory: IBillingHistoryItem[];
}

export interface ISchool extends Document {
  name: string;
  code: string;
  ownerId?: mongoose.Types.ObjectId;
  subscription?: ISchoolSubscription;
  createdAt: Date;
  updatedAt: Date;
}

const BillingHistorySchema = new Schema<IBillingHistoryItem>(
  {
    invoiceId: { type: String, required: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    amountPkr: { type: Number, required: true },
    amountUsd: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: {
      type: String,
      enum: ["paid", "auto_renewed"],
      default: "paid",
    },
    paidAt: { type: Date, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
  },
  { _id: false }
);

const SubscriptionSchema = new Schema<ISchoolSubscription>(
  {
    planId: {
      type: String,
      enum: ["trial", "starter", "growth", "enterprise"],
      default: "trial",
    },
    planName: { type: String, default: "14-Day Free Trial" },
    pricePkr: { type: Number, default: 0 },
    priceUsd: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["trialing", "active", "grace_period", "canceled", "expired"],
      default: "trialing",
    },
    trialStartsAt: { type: Date, required: true },
    trialEndsAt: { type: Date, required: true },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    graceEndsAt: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date, default: null },
    paymentMethod: {
      type: {
        type: String,
        enum: ["card", "bank", "wallet"],
      },
      brand: { type: String },
      last4: { type: String },
      label: { type: String },
    },
    sentReminders: { type: [String], default: [] },
    billingHistory: { type: [BillingHistorySchema], default: [] },
  },
  { _id: false }
);

const SchoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    subscription: { type: SubscriptionSchema, required: false },
  },
  { timestamps: true }
);

// Guard against stale Mongoose schema cache during Next.js dev HMR
const existingSchoolModel = mongoose.models.School;
if (existingSchoolModel && !existingSchoolModel.schema.path("subscription")) {
  mongoose.deleteModel("School");
}

export const School: Model<ISchool> =
  mongoose.models.School || mongoose.model<ISchool>("School", SchoolSchema);
