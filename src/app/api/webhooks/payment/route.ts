import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  getSafepayConfig,
  verifySafepayWebhookSignature,
} from "@/lib/safepay";
import { fulfillPaidSubscriptionOrder } from "@/lib/subscription-fulfillment";

export async function POST(req: Request) {
  const sfpyCfg = getSafepayConfig();
  if (!sfpyCfg.webhookSecret) {
    return NextResponse.json(
      { error: "Safepay webhook secret is not configured on this server." },
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
    req.headers.get("x-safepay-signature") ||
    req.headers.get("x-signature");

  const timestampHeader = req.headers.get("x-sfpy-timestamp");

  if (!verifySafepayWebhookSignature({ rawBody, signatureHeader, timestampHeader })) {
    return NextResponse.json(
      { error: "Invalid Safepay webhook signature." },
      { status: 401 }
    );
  }

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload." }, { status: 400 });
  }

  try {
    await connectDB();
    const event = String(parsed.event || parsed.type || "").toLowerCase();
    const data = (parsed.data || {}) as Record<string, unknown>;
    const tracker = String(data.token || data.tracker || data.beacon || "").trim();
    const orderId = String(data.order_id || parsed.order_id || "").trim();
    const reference = String(data.reference || "").trim();

    if (
      event === "payment.completed" ||
      event === "order.completed" ||
      event === "order.paid"
    ) {
      const result = await fulfillPaidSubscriptionOrder({
        orderId: orderId || undefined,
        tracker: tracker || undefined,
        safepayReference: reference || undefined,
        webhookEventId: String(parsed.id || parsed.notification_id || ""),
      });
      return NextResponse.json({ received: true, gateway: "safepay", event, ...result });
    }

    return NextResponse.json({ received: true, gateway: "safepay", event, ignored: true });
  } catch (err) {
    console.error("[SAFEPAY_WEBHOOK_ERROR]", err);
    return NextResponse.json(
      { error: "Safepay webhook processing error." },
      { status: 500 }
    );
  }
}
