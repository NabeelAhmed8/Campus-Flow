import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PaymentOrder } from "@/models/PaymentOrder";
import {
  getSafepayConfig,
  verifySafepayWebhookSignature,
} from "@/lib/safepay";
import { fulfillPaidSubscriptionOrder } from "@/lib/subscription";

/**
 * Signed Safepay Webhook Endpoint
 * Configure this URL in your Safepay Merchant Dashboard -> Developers -> Webhooks:
 *   https://your-domain.com/api/webhooks/payment
 */
export async function POST(req: Request) {
  const cfg = getSafepayConfig();
  if (!cfg.webhookSecret) {
    console.error("[SAFEPAY_WEBHOOK] SAFEPAY_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 503 }
    );
  }

  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const signatureHeader =
    req.headers.get("x-sfpy-signature") ||
    req.headers.get("X-SFPY-SIGNATURE");
  const timestampHeader =
    req.headers.get("x-sfpy-timestamp") ||
    req.headers.get("X-SFPY-TIMESTAMP");
  const eventIdHeader =
    req.headers.get("x-sfpy-event-id") ||
    req.headers.get("X-SFPY-EVENT-ID") ||
    "";
  const eventTypeHeader =
    req.headers.get("x-sfpy-event-type") ||
    req.headers.get("X-SFPY-EVENT-TYPE") ||
    "";

  const isAuthentic = verifySafepayWebhookSignature({
    rawBody,
    signatureHeader,
    timestampHeader,
  });

  if (!isAuthentic) {
    console.warn("[SAFEPAY_WEBHOOK] Rejected invalid X-SFPY-SIGNATURE.");
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 }
    );
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload." }, { status: 400 });
  }

  try {
    await connectDB();

    const eventType = String(
      eventTypeHeader || payload?.type || payload?.event || ""
    ).toLowerCase();
    const data = payload?.data || payload || {};
    const notification = data?.notification || data || {};

    const tracker = String(
      notification?.tracker || data?.tracker || data?.token || ""
    ).trim();
    const orderId = String(
      notification?.metadata?.order_id ||
        data?.metadata?.order_id ||
        notification?.order_id ||
        data?.order_id ||
        ""
    ).trim();
    const reference = String(
      notification?.reference || data?.reference || tracker
    ).trim();
    const state = String(
      notification?.state || data?.state || ""
    ).toUpperCase();

    const isSuccessEvent =
      eventType.includes("payment.completed") ||
      eventType.includes("payment.succeeded") ||
      eventType.includes("payment:created") ||
      eventType.includes("payment.paid") ||
      state === "PAID" ||
      state === "TRACKER_ENDED";

    const isFailureEvent =
      eventType.includes("payment.failed") ||
      eventType.includes("payment.canceled") ||
      state === "FAILED" ||
      state === "CANCELED";

    if (isSuccessEvent && (tracker || orderId)) {
      const result = await fulfillPaidSubscriptionOrder({
        orderId,
        tracker,
        safepayReference: reference,
        webhookEventId: eventIdHeader,
      });

      return NextResponse.json({
        received: true,
        fulfilled: result.fulfilled,
        alreadyPaid: result.alreadyPaid,
      });
    }

    if (isFailureEvent && (tracker || orderId)) {
      const orConds: Record<string, unknown>[] = [];
      if (tracker) orConds.push({ tracker });
      if (orderId) orConds.push({ orderId });
      await PaymentOrder.updateOne(
        { $or: orConds, status: "pending" },
        { $set: { status: "failed" } }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[SAFEPAY_WEBHOOK_PROCESS_ERROR]", error);
    return NextResponse.json(
      { error: "Webhook processing error." },
      { status: 500 }
    );
  }
}
