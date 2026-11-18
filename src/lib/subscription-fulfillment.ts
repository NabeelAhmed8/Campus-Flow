import { ISchool, School } from "@/models/School";
import { User } from "@/models/User";
import { PaymentOrder } from "@/models/PaymentOrder";
import { createCampusNotification } from "@/lib/notifications";
import { sendSubscriptionEmail } from "@/lib/mailer";
import {
  DAY_MS,
  HOUR_MS,
  GRACE_PERIOD_HOURS,
  MONTHLY_CYCLE_DAYS,
  getPlanById,
  buildInitialTrialSubscription,
} from "@/lib/subscription-plans";

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function resolveSchoolAdminContact(school: ISchool) {
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
 * Idempotently fulfills a verified Safepay payment order (called by both the
 * signed Safepay webhook `/api/webhooks/payment` and the verified redirect callback).
 */
export async function fulfillPaidSubscriptionOrder(params: {
  orderId?: string;
  tracker?: string;
  safepayReference?: string;
  webhookEventId?: string;
}): Promise<{
  fulfilled: boolean;
  alreadyPaid: boolean;
  schoolId?: string;
  orderId?: string;
}> {
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
