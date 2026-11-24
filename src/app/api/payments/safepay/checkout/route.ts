import crypto from "node:crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireSchoolAuth } from "@/lib/auth";
import { getPlanById } from "@/lib/subscription";
import { PaymentOrder } from "@/models/PaymentOrder";
import {
  createSafepayOrderSession,
  getSafepayConfig,
  resolveAppOrigin,
} from "@/lib/safepay";

export async function POST(req: Request) {
  const auth = await requireSchoolAuth(req, ["admin"]);
  if (auth.response) return auth.response;

  const { session, schoolObjId } = auth;

  const cfg = getSafepayConfig();
  if (!cfg.configured) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "Safepay gateway keys are not configured yet. Add SAFEPAY_API_KEY, SAFEPAY_V1_SECRET, and SAFEPAY_WEBHOOK_SECRET in .env.local to enable JazzCash, Easypaisa, and Card payments.",
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
        { error: "Please select a valid monthly subscription plan." },
        { status: 400 }
      );
    }

    const orderId = `CF-SP-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase()}`;

    const origin = resolveAppOrigin(req);
    const redirectUrl = `${origin}/api/payments/safepay/callback?order=${encodeURIComponent(
      orderId
    )}`;
    const cancelUrl = `${origin}/admin?tab=subscription&payment=canceled&order=${encodeURIComponent(
      orderId
    )}`;

    const { tracker, checkoutUrl, environment } =
      await createSafepayOrderSession({
        amountPkr: plan.pricePkr,
        orderId,
        redirectUrl,
        cancelUrl,
      });

    await PaymentOrder.create({
      orderId,
      tracker,
      checkoutId: tracker,
      schoolId: schoolObjId,
      userId: new mongoose.Types.ObjectId(session.id),
      planId: plan.id,
      planName: plan.name,
      amountPkr: plan.pricePkr,
      amountUsd: plan.priceUsd,
      autoRenew: autoRenew !== false,
      gateway: "safepay",
      environment,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      orderId,
      tracker,
      checkoutUrl,
      environment,
    });
  } catch (error) {
    console.error("[SAFEPAY_CHECKOUT_ERROR]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to initialize Safepay checkout session.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
