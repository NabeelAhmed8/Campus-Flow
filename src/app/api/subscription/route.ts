import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { School } from "@/models/School";
import { requireAuth } from "@/lib/auth";
import {
  buildInitialTrialSubscription,
  evaluateAndSyncSchoolSubscription,
  getPlanById,
  GRACE_PERIOD_HOURS,
  MONTHLY_CYCLE_DAYS,
  SUBSCRIPTION_PLANS,
} from "@/lib/subscription";
import { createCampusNotification } from "@/lib/notifications";
import { sendSubscriptionEmail } from "@/lib/mailer";
import { getSafepayConfig } from "@/lib/safepay";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function GET(req: Request) {
  const auth = await requireAuth(req, [
    "admin",
    "coordinator",
    "teacher",
    "student",
    "parent",
  ]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({
      success: true,
      subscription: null,
      plans: SUBSCRIPTION_PLANS,
    });
  }

  try {
    await connectDB();
    const summary = await evaluateAndSyncSchoolSubscription(session.schoolId);
    if (!summary) {
      return NextResponse.json({
        success: true,
        subscription: null,
        plans: SUBSCRIPTION_PLANS,
      });
    }

    // Keep private billing history & payment details restricted to School Admin
    if (session.role !== "admin") {
      return NextResponse.json({
        success: true,
        subscription: {
          schoolName: summary.schoolName,
          planId: summary.planId,
          planName: summary.planName,
          status: summary.status,
          isTrial: summary.isTrial,
          isLocked: summary.isLocked,
          isGracePeriod: summary.isGracePeriod,
          showRenewalBanner: false,
          daysRemaining: summary.daysRemaining,
          hoursRemainingInGrace: summary.hoursRemainingInGrace,
          currentPeriodEnd: summary.currentPeriodEnd,
          graceEndsAt: summary.graceEndsAt,
          autoRenew: summary.autoRenew,
          cancelAtPeriodEnd: summary.cancelAtPeriodEnd,
          paymentMethod: null,
          billingHistory: [],
        },
        plans: [],
      });
    }

    const sfCfg = getSafepayConfig();
    return NextResponse.json({
      success: true,
      subscription: summary,
      plans: SUBSCRIPTION_PLANS,
      gateway: {
        provider: "safepay",
        configured: sfCfg.configured,
        environment: sfCfg.environment,
        webhookPath: "/api/webhooks/payment",
      },
    });
  } catch (error) {
    console.error("[SUBSCRIPTION_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to load subscription details." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json(
      { error: "School workspace is not configured." },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const body = await req.json();
    const {
      planId,
      paymentType,
      cardNumber,
      cardBrand,
      paymentReference,
      autoRenew,
    } = body ?? {};

    const plan = getPlanById(String(planId || ""));
    if (!plan) {
      return NextResponse.json(
        { error: "Please choose a valid monthly subscription plan." },
        { status: 400 }
      );
    }

    const school = await School.findById(session.schoolId);
    if (!school) {
      return NextResponse.json(
        { error: "Institutional workspace not found." },
        { status: 404 }
      );
    }

    const now = new Date();
    if (!school.subscription) {
      school.subscription = buildInitialTrialSubscription(now);
    }

    const cleanType: "card" | "bank" | "wallet" =
      paymentType === "bank"
        ? "bank"
        : paymentType === "wallet"
        ? "wallet"
        : "card";

    let last4 = "4242";
    let brand = "Visa";
    let label = "";

    if (cleanType === "card") {
      const digits = String(cardNumber || "").replace(/\D/g, "");
      if (digits.length < 12 || digits.length > 19) {
        return NextResponse.json(
          { error: "Please enter a valid 16-digit debit or credit card number." },
          { status: 400 }
        );
      }
      last4 = digits.slice(-4);
      brand =
        typeof cardBrand === "string" && cardBrand.trim()
          ? cardBrand.trim().slice(0, 24)
          : digits.startsWith("5")
          ? "Mastercard"
          : "Visa";
      label = `${brand} ending in •••• ${last4}`;
    } else if (cleanType === "bank") {
      const ref = String(paymentReference || "").trim().slice(0, 40);
      if (!ref) {
        return NextResponse.json(
          { error: "Please enter your Bank Transfer / Raast transaction reference." },
          { status: 400 }
        );
      }
      last4 = ref.slice(-4);
      brand = "Raast / Bank";
      label = `Bank / Raast (${ref})`;
    } else {
      const ref = String(paymentReference || "").trim().slice(0, 40);
      if (!ref) {
        return NextResponse.json(
          { error: "Please enter your JazzCash / EasyPaisa transaction ID." },
          { status: 400 }
        );
      }
      last4 = ref.slice(-4);
      brand = "JazzCash / EasyPaisa";
      label = `Mobile Wallet (${ref})`;
    }

    const periodStart = now;
    const periodEnd = new Date(now.getTime() + MONTHLY_CYCLE_DAYS * DAY_MS);
    const graceEndsAt = new Date(
      periodEnd.getTime() + GRACE_PERIOD_HOURS * HOUR_MS
    );

    const invoiceId = `INV-${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${Math.floor(10000 + Math.random() * 90000)}`;

    const sub = school.subscription;
    sub.planId = plan.id;
    sub.planName = plan.name;
    sub.pricePkr = plan.pricePkr;
    sub.priceUsd = plan.priceUsd;
    sub.status = "active";
    sub.currentPeriodStart = periodStart;
    sub.currentPeriodEnd = periodEnd;
    sub.graceEndsAt = graceEndsAt;
    sub.autoRenew = autoRenew !== false;
    sub.cancelAtPeriodEnd = false;
    sub.canceledAt = null;
    sub.paymentMethod = {
      type: cleanType,
      brand,
      last4,
      label,
    };
    sub.billingHistory = [
      {
        invoiceId,
        planId: plan.id,
        planName: plan.name,
        amountPkr: plan.pricePkr,
        amountUsd: plan.priceUsd,
        paymentMethod: label,
        status: "paid",
        paidAt: now,
        periodStart,
        periodEnd,
      },
      ...(sub.billingHistory || []),
    ];

    school.markModified("subscription");
    await school.save();

    const amountLabel = `PKR ${plan.pricePkr.toLocaleString()} ($${plan.priceUsd}/mo)`;

    await createCampusNotification({
      schoolId: session.schoolId,
      category: "billing",
      title: `Plan Activated — ${plan.name}`,
      message: `Your monthly ${plan.name} (${amountLabel}) is now active through ${formatDateShort(
        periodEnd
      )}. Auto-Renew is ${sub.autoRenew ? "ON" : "OFF"}. Invoice: ${invoiceId}.`,
      audience: "admin",
      grade: "All Classes",
      priority: "normal",
      createdBy: "CampusFlow Billing",
      senderRole: "admin",
    });

    if (session.email) {
      sendSubscriptionEmail({
        to: session.email,
        name: session.name,
        institution: school.name,
        eventType: "payment_confirmed",
        planName: plan.name,
        periodEndDate: formatDateShort(periodEnd),
        amountLabel,
        invoiceId,
      }).catch(() => null);
    }

    const refreshed = await evaluateAndSyncSchoolSubscription(session.schoolId);

    return NextResponse.json({
      success: true,
      message: `${plan.name} activated successfully! Workspace access is active through ${formatDateShort(
        periodEnd
      )}.`,
      subscription: refreshed,
      invoiceId,
    });
  } catch (error) {
    console.error("[SUBSCRIPTION_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to process subscription payment right now." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json(
      { error: "School workspace is not configured." },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const body = await req.json();
    const { action, autoRenew } = body ?? {};

    const school = await School.findById(session.schoolId);
    if (!school) {
      return NextResponse.json(
        { error: "Institutional workspace not found." },
        { status: 404 }
      );
    }

    if (!school.subscription) {
      school.subscription = buildInitialTrialSubscription();
    }

    const sub = school.subscription;
    let message = "Subscription settings updated.";

    if (action === "toggle_auto_renew") {
      const nextAutoRenew = Boolean(autoRenew);
      sub.autoRenew = nextAutoRenew;
      if (nextAutoRenew && sub.cancelAtPeriodEnd) {
        sub.cancelAtPeriodEnd = false;
        sub.canceledAt = null;
      }
      message = nextAutoRenew
        ? "Auto-Renew enabled. Your monthly plan will renew automatically."
        : "Auto-Renew turned off. You will receive a reminder 3 days before expiry.";
    } else if (action === "cancel") {
      sub.cancelAtPeriodEnd = true;
      sub.autoRenew = false;
      sub.canceledAt = new Date();
      if (sub.planId !== "trial" && sub.status === "active") {
        sub.status = "canceled";
      }
      const endFormatted = formatDateShort(new Date(sub.currentPeriodEnd));
      message = `Subscription canceled. Full access continues until ${endFormatted}. You can resume anytime.`;

      await createCampusNotification({
        schoolId: session.schoolId,
        category: "billing",
        title: "Subscription Cancellation Confirmed",
        message: `Auto-Renew is now OFF for ${sub.planName}. Your institution retains full workspace access through ${endFormatted}.`,
        audience: "admin",
        grade: "All Classes",
        priority: "normal",
        createdBy: "CampusFlow Billing",
        senderRole: "admin",
      });

      if (session.email) {
        sendSubscriptionEmail({
          to: session.email,
          name: session.name,
          institution: school.name,
          eventType: "canceled",
          planName: sub.planName,
          periodEndDate: endFormatted,
        }).catch(() => null);
      }
    } else if (action === "resume") {
      sub.cancelAtPeriodEnd = false;
      sub.canceledAt = null;
      sub.autoRenew = true;
      if (sub.planId !== "trial" && sub.status === "canceled") {
        sub.status = "active";
      }
      message = "Subscription resumed and Auto-Renew re-enabled.";
    } else {
      return NextResponse.json(
        { error: "Unsupported subscription action." },
        { status: 400 }
      );
    }

    school.markModified("subscription");
    await school.save();

    const refreshed = await evaluateAndSyncSchoolSubscription(session.schoolId);
    return NextResponse.json({
      success: true,
      message,
      subscription: refreshed,
    });
  } catch (error) {
    console.error("[SUBSCRIPTION_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to update subscription settings." },
      { status: 500 }
    );
  }
}
