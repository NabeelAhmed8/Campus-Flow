import crypto from "node:crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getPlanById } from "@/lib/subscription";
import { PaymentOrder } from "@/models/PaymentOrder";
import {
  createSafepayOrderSession,
  getSafepayConfig,
  resolveAppOrigin,
} from "@/lib/safepay";

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

  const cfg = getSafepayConfig();
  if (!cfg.configured) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "Safepay merchant keys are not configured yet. Add SAFEPAY_API_KEY, SAFEPAY_V1_SECRET, and SAFEPAY_WEBHOOK_SECRET in .env.local to accept real PKR payments.",
      },
      { status: 503 }
    );
  }

  try {
    await connectDB();
    const body = await req.json();
    const { planId, autoRenew } = body ?? {};

    const plan = getPlanById(String(planId || ""));
    if (!plan) {
      return NextResponse.json(
        { error: "Please select a valid subscription plan." },
        { status: 400 }
      );
    }

    const now = new Date();
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const orderId = `CF-${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(
      2,
      "0"
    )}-${randomSuffix}`;

    const origin = resolveAppOrigin(req);
    // Keep redirectUrl clean (no query params) because Safepay appends ?tracker=...&sig=...&order_id=...
    const redirectUrl = `${origin}/api/payments/safepay/callback`;
    const cancelUrl = `${origin}/api/payments/safepay/callback?cancel=1&order_id=${encodeURIComponent(
      orderId
    )}`;

    const sfSession = await createSafepayOrderSession({
      amountPkr: plan.pricePkr,
      orderId,
      redirectUrl,
      cancelUrl,
    });

    await PaymentOrder.create({
      orderId,
      tracker: sfSession.tracker,
      schoolId: new mongoose.Types.ObjectId(session.schoolId),
      userId: new mongoose.Types.ObjectId(session.id),
      planId: plan.id,
      planName: plan.name,
      amountPkr: plan.pricePkr,
      amountUsd: plan.priceUsd,
      autoRenew: autoRenew !== false,
      gateway: "safepay",
      environment: sfSession.environment,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      configured: true,
      environment: sfSession.environment,
      orderId,
      tracker: sfSession.tracker,
      checkoutUrl: sfSession.checkoutUrl,
    });
  } catch (error) {
    console.error("[SAFEPAY_CHECKOUT_ERROR]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to initialize Safepay payment session.",
      },
      { status: 502 }
    );
  }
}
