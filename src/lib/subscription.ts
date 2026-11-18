import mongoose from "mongoose";
import {
  ISchool,
  ISchoolSubscription,
  School,
  SubscriptionPlanId,
  SubscriptionStatus,
} from "@/models/School";
import { User } from "@/models/User";
import { PaymentOrder } from "@/models/PaymentOrder";
import { createCampusNotification } from "@/lib/notifications";
import { sendSubscriptionEmail } from "@/lib/mailer";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export const TRIAL_DURATION_DAYS = 14;
export const GRACE_PERIOD_HOURS = 24;
export const RENEWAL_REMINDER_WINDOW_DAYS = 3;
export const MONTHLY_CYCLE_DAYS = 30;

export interface SaaSPlanConfig {
  id: Exclude<SubscriptionPlanId, "trial">;
  name: string;
  tagline: string;
  pricePkr: number;
  priceUsd: number;
  studentLimit: string;
  popular?: boolean;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SaaSPlanConfig[] = [
  {
    id: "starter",
    name: "Starter Campus",
    tagline: "Ideal for growing primary & middle schools",
    pricePkr: 4900,
    priceUsd: 19,
    studentLimit: "Up to 250 Students",
    features: [
      "All 5 Portals (Admin, Coordinator, Teacher, Student, Parent)",
      "3-Term Exam Report Cards & Section RBAC",
      "PDF & Image Timetable, Syllabus & Date Sheet Uploads",
      "Pakistani Bank / Raast / JazzCash Fee Vouchers",
    ],
  },
  {
    id: "growth",
    name: "Growth Academy",
    tagline: "Complete AI-powered suite for high schools & colleges",
    pricePkr: 9900,
    priceUsd: 39,
    studentLimit: "Up to 1,000 Students",
    popular: true,
    features: [
      "Everything in Starter Campus",
      "Gemini AI Lesson Planner, Quiz Maker & Study Coach",
      "Faculty Attendance & Substitution Desk",
      "Priority Email + In-App Renewal Alerts & Auto-Renew",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Network",
    tagline: "Unlimited capacity for multi-section school networks",
    pricePkr: 19900,
    priceUsd: 79,
    studentLimit: "Unlimited Students & Sections",
    features: [
      "Everything in Growth Academy",
      "Unlimited Faculty, Coordinators & Enrolled Students",
      "Full Financial Analytics & Audit Transparency",
      "Dedicated Onboarding & Priority SLA Support",
    ],
  },
];

export function getPlanById(planId: string): SaaSPlanConfig | null {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId) || null;
}

export function buildInitialTrialSubscription(now = new Date()): ISchoolSubscription {
  const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * DAY_MS);
  const graceEndsAt = new Date(trialEndsAt.getTime() + GRACE_PERIOD_HOURS * HOUR_MS);

  return {
    planId: "trial",
    planName: "14-Day Free Trial",
    pricePkr: 0,
    priceUsd: 0,
    status: "trialing",
    trialStartsAt: now,
    trialEndsAt,
    currentPeriodStart: now,
    currentPeriodEnd: trialEndsAt,
    graceEndsAt,
    autoRenew: true,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    paymentMethod: null,
    sentReminders: [],
    billingHistory: [],
  };
}

export interface SubscriptionSummaryDTO {
  schoolName: string;
  planId: SubscriptionPlanId;
  planName: string;
  pricePkr: number;
  priceUsd: number;
  status: SubscriptionStatus;
  isTrial: boolean;
  isLocked: boolean;
  isGracePeriod: boolean;
  showRenewalBanner: boolean;
  daysRemaining: number;
  hoursRemainingInGrace: number;
  trialStartsAt: string;
  trialEndsAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  graceEndsAt: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  paymentMethod: ISchoolSubscription["paymentMethod"];
  billingHistory: Array<{
    invoiceId: string;
    planId: string;
    planName: string;
    amountPkr: number;
    amountUsd: number;
    paymentMethod: string;
    status: "paid" | "auto_renewed";
    paidAt: string;
    periodStart: string;
    periodEnd: string;
  }>;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function resolveSchoolAdminContact(school: ISchool) {
  if (school.ownerId) {
    const owner = await User.findById(school.ownerId)
      .select("name email")
      .lean();
    if (owner?.email) return { name: owner.name, email: owner.email };
  }
  const fallbackAdmin = await User.findOne({
    schoolId: school._id,
    role: "admin",
  })
    .select("name email")
    .lean();
  if (fallbackAdmin?.email) {
    return { name: fallbackAdmin.name, email: fallbackAdmin.email };
  }
  return null;
}

/**
 * Evaluates a school's live SaaS subscription state:
 * - Auto-provisions 14-day free trial if missing on legacy schools
 * - Executes automatic monthly renewal if autoRenew is ON and payment method is saved
 * - Sends deduplicated 2–3 day expiry reminders & 24h grace warnings (Email + Admin Notification Panel)
 * - Enforces workspace lockout if 14-day trial (or monthly cycle) + 24h grace period expires unpaid
 */
export async function evaluateAndSyncSchoolSubscription(
  schoolId: string
): Promise<SubscriptionSummaryDTO | null> {
  if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
    return null;
  }

  const school = await School.findById(schoolId);
  if (!school) return null;

  const now = new Date();
  let dirty = false;

  if (!school.subscription || !school.subscription.currentPeriodEnd) {
    school.subscription = buildInitialTrialSubscription(now);
    dirty = true;
  }

  const sub = school.subscription;
  if (!Array.isArray(sub.sentReminders)) {
    sub.sentReminders = [];
  }
  if (!Array.isArray(sub.billingHistory)) {
    sub.billingHistory = [];
  }

  // Ensure graceEndsAt is always at least currentPeriodEnd + 24h
  const periodEndMs = new Date(sub.currentPeriodEnd).getTime();
  const expectedGraceMs = periodEndMs + GRACE_PERIOD_HOURS * HOUR_MS;
  if (
    !sub.graceEndsAt ||
    new Date(sub.graceEndsAt).getTime() < expectedGraceMs
  ) {
    sub.graceEndsAt = new Date(expectedGraceMs);
    dirty = true;
  }

  const nowMs = now.getTime();

  // Note: Paid renewals are ONLY extended upon verified Safepay payment fulfillment
  // (`fulfillPaidSubscriptionOrder` via signed webhook/callback) — never granted free without settlement.
  const updatedPeriodEndMs = new Date(sub.currentPeriodEnd).getTime();
  const updatedGraceEndMs = new Date(sub.graceEndsAt).getTime();

  let computedStatus: SubscriptionStatus = sub.status;
  let isLocked = false;
  let isGracePeriod = false;
  let daysRemaining = 0;
  let hoursRemainingInGrace = 0;

  if (nowMs <= updatedPeriodEndMs) {
    daysRemaining = Math.max(
      1,
      Math.ceil((updatedPeriodEndMs - nowMs) / DAY_MS)
    );
    computedStatus =
      sub.planId === "trial"
        ? "trialing"
        : sub.cancelAtPeriodEnd
        ? "canceled"
        : "active";
  } else if (nowMs <= updatedGraceEndMs) {
    // Inside 24-hour grace window right after trial or monthly subscription ended
    isGracePeriod = true;
    daysRemaining = 0;
    hoursRemainingInGrace = Math.max(
      1,
      Math.ceil((updatedGraceEndMs - nowMs) / HOUR_MS)
    );
    computedStatus = "grace_period";
  } else {
    // 24-hour grace period passed without payment -> Lock Workspace
    isLocked = true;
    daysRemaining = 0;
    hoursRemainingInGrace = 0;
    computedStatus = "expired";
  }

  if (sub.status !== computedStatus) {
    sub.status = computedStatus;
    dirty = true;
  }

  // 2. Automated 2–3 Days Before Expiry Reminder (Email + Admin Notification Panel)
  const periodKey = new Date(sub.currentPeriodEnd).toISOString().slice(0, 10);
  if (
    nowMs <= updatedPeriodEndMs &&
    daysRemaining <= RENEWAL_REMINDER_WINDOW_DAYS
  ) {
    const reminderKey = `renew-3d-${sub.planId}-${periodKey}`;
    if (!sub.sentReminders.includes(reminderKey)) {
      sub.sentReminders.push(reminderKey);
      dirty = true;

      const adminContact = await resolveSchoolAdminContact(school);
      const endFormatted = formatDateShort(new Date(sub.currentPeriodEnd));
      const isTrialPlan = sub.planId === "trial";

      await createCampusNotification({
        schoolId: school._id.toString(),
        category: "billing",
        title: isTrialPlan
          ? `14-Day Free Trial Ends in ${daysRemaining} ${
              daysRemaining === 1 ? "Day" : "Days"
            }`
          : `Subscription Renewal Due in ${daysRemaining} ${
              daysRemaining === 1 ? "Day" : "Days"
            }`,
        message: isTrialPlan
          ? `Your CampusFlow 14-day free trial ends on ${endFormatted}. Subscribe now in Admin Hub → Subscription & Plan to avoid workspace interruption.`
          : sub.autoRenew && !sub.cancelAtPeriodEnd
          ? `Your ${sub.planName} renews automatically on ${endFormatted}. You can review payment method or cancel anytime in Admin Hub → Subscription & Plan.`
          : `Your ${sub.planName} expires on ${endFormatted}. Renew now in Admin Hub → Subscription & Plan to keep your campus portals active.`,
        audience: "admin",
        grade: "All Classes",
        priority: "urgent",
        createdBy: "CampusFlow Billing",
        senderRole: "admin",
      });

      if (adminContact?.email) {
        sendSubscriptionEmail({
          to: adminContact.email,
          name: adminContact.name,
          institution: school.name,
          eventType: "renewal_reminder",
          planName: sub.planName,
          daysRemaining,
          periodEndDate: endFormatted,
        }).catch(() => null);
      }
    }
  }

  // 3. Automated 24-Hour Grace Period Urgent Warning (Email + Admin Notification Panel)
  if (isGracePeriod) {
    const graceKey = `grace-24h-${sub.planId}-${periodKey}`;
    if (!sub.sentReminders.includes(graceKey)) {
      sub.sentReminders.push(graceKey);
      dirty = true;

      const adminContact = await resolveSchoolAdminContact(school);
      await createCampusNotification({
        schoolId: school._id.toString(),
        category: "billing",
        title: "24-Hour Grace Period Active — Action Required",
        message: `Your ${sub.planName} has ended. Complete your subscription payment within ${hoursRemainingInGrace} hours to keep your school workspace active.`,
        audience: "admin",
        grade: "All Classes",
        priority: "urgent",
        createdBy: "CampusFlow Billing",
        senderRole: "admin",
      });

      if (adminContact?.email) {
        sendSubscriptionEmail({
          to: adminContact.email,
          name: adminContact.name,
          institution: school.name,
          eventType: "grace_warning",
          planName: sub.planName,
          periodEndDate: formatDateShort(new Date(sub.graceEndsAt)),
        }).catch(() => null);
      }
    }
  }

  if (dirty) {
    school.markModified("subscription");
    await school.save();
  }

  const showRenewalBanner =
    isGracePeriod ||
    (!isLocked &&
      daysRemaining > 0 &&
      daysRemaining <= RENEWAL_REMINDER_WINDOW_DAYS);

  return {
    schoolName: school.name,
    planId: sub.planId,
    planName: sub.planName,
    pricePkr: sub.pricePkr,
    priceUsd: sub.priceUsd,
    status: computedStatus,
    isTrial: sub.planId === "trial",
    isLocked,
    isGracePeriod,
    showRenewalBanner,
    daysRemaining,
    hoursRemainingInGrace,
    trialStartsAt: new Date(sub.trialStartsAt).toISOString(),
    trialEndsAt: new Date(sub.trialEndsAt).toISOString(),
    currentPeriodStart: new Date(sub.currentPeriodStart).toISOString(),
    currentPeriodEnd: new Date(sub.currentPeriodEnd).toISOString(),
    graceEndsAt: new Date(sub.graceEndsAt).toISOString(),
    autoRenew: Boolean(sub.autoRenew),
    cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd),
    paymentMethod: sub.paymentMethod || null,
    billingHistory: (sub.billingHistory || []).map((h) => ({
      invoiceId: h.invoiceId,
      planId: h.planId,
      planName: h.planName,
      amountPkr: h.amountPkr,
      amountUsd: h.amountUsd,
      paymentMethod: h.paymentMethod,
      status: h.status,
      paidAt: new Date(h.paidAt).toISOString(),
      periodStart: new Date(h.periodStart).toISOString(),
      periodEnd: new Date(h.periodEnd).toISOString(),
    })),
  };
}

/**
 * Idempotently fulfills a verified Safepay payment order (called by both the
 * signed Safepay webhook `/api/webhooks/payment` and the verified redirect callback).
 */
export async function fulfillPaidSubscriptionOrder(params: {
  orderId?: string;
  tracker?: string;
  safepayReference?: string;
  webhookEventId?: string;
}): Promise<{ fulfilled: boolean; alreadyPaid: boolean; schoolId?: string; orderId?: string }> {
  const orConditions: Record<string, unknown>[] = [];
  if (params.tracker?.trim()) {
    orConditions.push({ tracker: params.tracker.trim() });
  }
  if (params.orderId?.trim()) {
    orConditions.push({ orderId: params.orderId.trim() });
  }
  if (orConditions.length === 0) {
    return { fulfilled: false, alreadyPaid: false };
  }

  const existing = await PaymentOrder.findOne({ $or: orConditions });
  if (!existing) {
    return { fulfilled: false, alreadyPaid: false };
  }

  if (existing.status === "paid") {
    return {
      fulfilled: true,
      alreadyPaid: true,
      schoolId: existing.schoolId.toString(),
      orderId: existing.orderId,
    };
  }

  const now = new Date();
  // Atomic status transition prevents duplicate invoices if webhook + redirect fire simultaneously
  const claimed = await PaymentOrder.findOneAndUpdate(
    { _id: existing._id, status: { $ne: "paid" } },
    {
      $set: {
        status: "paid",
        paidAt: now,
        ...(params.safepayReference
          ? { safepayReference: params.safepayReference.slice(0, 120) }
          : {}),
        ...(params.webhookEventId
          ? { webhookEventId: params.webhookEventId.slice(0, 120) }
          : {}),
      },
    },
    { new: true }
  );

  if (!claimed) {
    return {
      fulfilled: true,
      alreadyPaid: true,
      schoolId: existing.schoolId.toString(),
      orderId: existing.orderId,
    };
  }

  const school = await School.findById(claimed.schoolId);
  if (!school) {
    return { fulfilled: false, alreadyPaid: false };
  }

  if (!school.subscription) {
    school.subscription = buildInitialTrialSubscription(now);
  }

  const plan = getPlanById(claimed.planId);
  const periodStart = now;
  const periodEnd = new Date(now.getTime() + MONTHLY_CYCLE_DAYS * DAY_MS);
  const graceEndsAt = new Date(
    periodEnd.getTime() + GRACE_PERIOD_HOURS * HOUR_MS
  );
  const refTail = (
    claimed.safepayReference ||
    claimed.tracker ||
    claimed.orderId
  )
    .slice(-6)
    .toUpperCase();
  const paymentLabel = `Safepay (${
    claimed.environment === "production" ? "Live" : "Sandbox"
  } • ${refTail})`;

  const sub = school.subscription;
  sub.planId = claimed.planId;
  sub.planName = plan?.name || claimed.planName;
  sub.pricePkr = plan?.pricePkr ?? claimed.amountPkr;
  sub.priceUsd = plan?.priceUsd ?? claimed.amountUsd;
  sub.status = "active";
  sub.currentPeriodStart = periodStart;
  sub.currentPeriodEnd = periodEnd;
  sub.graceEndsAt = graceEndsAt;
  sub.autoRenew = claimed.autoRenew;
  sub.cancelAtPeriodEnd = false;
  sub.canceledAt = null;
  sub.paymentMethod = {
    type: "card",
    brand: "Safepay",
    last4: refTail.slice(-4),
    label: paymentLabel,
  };
  sub.billingHistory = [
    {
      invoiceId: claimed.orderId,
      planId: sub.planId,
      planName: sub.planName,
      amountPkr: sub.pricePkr,
      amountUsd: sub.priceUsd,
      paymentMethod: paymentLabel,
      status: "paid",
      paidAt: now,
      periodStart,
      periodEnd,
    },
    ...(sub.billingHistory || []),
  ];

  school.markModified("subscription");
  await school.save();

  const amountLabel = `PKR ${sub.pricePkr.toLocaleString()} ($${sub.priceUsd}/mo)`;
  const endFormatted = formatDateShort(periodEnd);

  await createCampusNotification({
    schoolId: school._id.toString(),
    category: "billing",
    title: `Safepay Payment Verified — ${sub.planName}`,
    message: `Your payment (${amountLabel}) was verified via Safepay. Your 30-day cycle is active through ${endFormatted}. Invoice: ${claimed.orderId}.`,
    audience: "admin",
    grade: "All Classes",
    priority: "normal",
    createdBy: "CampusFlow Billing",
    senderRole: "admin",
  });

  const adminContact = await resolveSchoolAdminContact(school);
  if (adminContact?.email) {
    sendSubscriptionEmail({
      to: adminContact.email,
      name: adminContact.name,
      institution: school.name,
      eventType: "payment_confirmed",
      planName: sub.planName,
      periodEndDate: endFormatted,
      amountLabel,
      invoiceId: claimed.orderId,
    }).catch(() => null);
  }

  return {
    fulfilled: true,
    alreadyPaid: false,
    schoolId: school._id.toString(),
    orderId: claimed.orderId,
  };
}
