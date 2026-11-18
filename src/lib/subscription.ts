import mongoose from "mongoose";
import {
  ISchoolSubscription,
  School,
  SubscriptionPlanId,
  SubscriptionStatus,
} from "@/models/School";
import { createCampusNotification } from "@/lib/notifications";
import { sendSubscriptionEmail } from "@/lib/mailer";
import {
  DAY_MS,
  HOUR_MS,
  TRIAL_DURATION_DAYS,
  GRACE_PERIOD_HOURS,
  RENEWAL_REMINDER_WINDOW_DAYS,
  MONTHLY_CYCLE_DAYS,
  SUBSCRIPTION_PLANS,
  getPlanById,
  buildInitialTrialSubscription,
  type SaaSPlanConfig,
} from "@/lib/subscription-plans";
import {
  formatDateShort,
  resolveSchoolAdminContact,
  fulfillPaidSubscriptionOrder,
} from "@/lib/subscription-fulfillment";

export {
  TRIAL_DURATION_DAYS,
  GRACE_PERIOD_HOURS,
  RENEWAL_REMINDER_WINDOW_DAYS,
  MONTHLY_CYCLE_DAYS,
  SUBSCRIPTION_PLANS,
  getPlanById,
  buildInitialTrialSubscription,
  fulfillPaidSubscriptionOrder,
};
export type { SaaSPlanConfig };

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

/**
 * Evaluates a school's live SaaS subscription state:
 * - Auto-provisions 14-day free trial if missing on legacy schools
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

  const periodEndMs = new Date(sub.currentPeriodEnd).getTime();
  const expectedGraceMs = periodEndMs + GRACE_PERIOD_HOURS * HOUR_MS;
  if (!sub.graceEndsAt || new Date(sub.graceEndsAt).getTime() < expectedGraceMs) {
    sub.graceEndsAt = new Date(expectedGraceMs);
    dirty = true;
  }

  const nowMs = now.getTime();
  const updatedPeriodEndMs = new Date(sub.currentPeriodEnd).getTime();
  const updatedGraceEndMs = new Date(sub.graceEndsAt).getTime();

  let computedStatus: SubscriptionStatus = sub.status;
  let isLocked = false;
  let isGracePeriod = false;
  let daysRemaining = 0;
  let hoursRemainingInGrace = 0;

  if (nowMs <= updatedPeriodEndMs) {
    daysRemaining = Math.max(1, Math.ceil((updatedPeriodEndMs - nowMs) / DAY_MS));
    computedStatus =
      sub.planId === "trial"
        ? "trialing"
        : sub.cancelAtPeriodEnd
          ? "canceled"
          : "active";
  } else if (nowMs <= updatedGraceEndMs) {
    isGracePeriod = true;
    daysRemaining = 0;
    hoursRemainingInGrace = Math.max(1, Math.ceil((updatedGraceEndMs - nowMs) / HOUR_MS));
    computedStatus = "grace_period";
  } else {
    isLocked = true;
    daysRemaining = 0;
    hoursRemainingInGrace = 0;
    computedStatus = "expired";
  }

  if (sub.status !== computedStatus) {
    sub.status = computedStatus;
    dirty = true;
  }

  const periodKey = new Date(sub.currentPeriodEnd).toISOString().slice(0, 10);
  if (nowMs <= updatedPeriodEndMs && daysRemaining <= RENEWAL_REMINDER_WINDOW_DAYS) {
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
          ? `14-Day Free Trial Ends in ${daysRemaining} ${daysRemaining === 1 ? "Day" : "Days"}`
          : `Subscription Renewal Due in ${daysRemaining} ${daysRemaining === 1 ? "Day" : "Days"}`,
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
    (!isLocked && daysRemaining > 0 && daysRemaining <= RENEWAL_REMINDER_WINDOW_DAYS);

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
