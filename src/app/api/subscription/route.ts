import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { School } from "@/models/School";
import { requireAuth } from "@/lib/auth";
import {
  buildInitialTrialSubscription,
  evaluateAndSyncSchoolSubscription,
  SUBSCRIPTION_PLANS,
} from "@/lib/subscription";
import { createCampusNotification } from "@/lib/notifications";
import { sendSubscriptionEmail } from "@/lib/mailer";
import { getSafepayConfig } from "@/lib/safepay";

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

  // Direct unverified plan activation is disabled for security.
  // All paid subscriptions must be fulfilled through Safepay Hosted Checkout + signed verification.
  return NextResponse.json(
    {
      error:
        "Direct plan activation is disabled. Please initiate checkout via /api/payments/safepay/checkout.",
    },
    { status: 400 }
  );
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
