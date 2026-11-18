import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PaymentOrder } from "@/models/PaymentOrder";
import {
  getSafepayConfig,
  resolveAppOrigin,
  verifySafepayCallbackSignature,
} from "@/lib/safepay";
import { fulfillPaidSubscriptionOrder } from "@/lib/subscription";

async function handleCallback(
  req: Request,
  fields: {
    orderId: string;
    tracker: string;
    sig: string | null;
    reference: string;
    isCanceled: boolean;
  }
) {
  const origin = resolveAppOrigin(req);
  const { orderId, tracker, sig, reference, isCanceled } = fields;

  try {
    await connectDB();

    if (isCanceled) {
      if (orderId) {
        await PaymentOrder.updateOne(
          { orderId, status: "pending" },
          { $set: { status: "canceled" } }
        );
      }
      return NextResponse.redirect(
        `${origin}/admin?tab=subscription&payment=canceled`,
        303
      );
    }

    const cfg = getSafepayConfig();

    // Verify cryptographic Safepay callback signature (HMAC-SHA256(V1_SECRET, tracker))
    if (cfg.v1Secret) {
      const validSig = verifySafepayCallbackSignature(tracker, sig);
      if (!validSig) {
        console.warn(
          "[SAFEPAY_CALLBACK] Signature mismatch or missing; deferring fulfillment to signed webhook.",
          { hasTracker: Boolean(tracker), hasSig: Boolean(sig), orderId }
        );
        return NextResponse.redirect(
          `${origin}/admin?tab=subscription&payment=pending`,
          303
        );
      }
    } else if (!tracker && !orderId) {
      return NextResponse.redirect(
        `${origin}/admin?tab=subscription&payment=failed`,
        303
      );
    }

    const result = await fulfillPaidSubscriptionOrder({
      orderId,
      tracker,
      safepayReference: reference || tracker,
    });

    if (!result.fulfilled) {
      return NextResponse.redirect(
        `${origin}/admin?tab=subscription&payment=pending`,
        303
      );
    }

    return NextResponse.redirect(
      `${origin}/admin?tab=subscription&payment=success&order=${encodeURIComponent(
        result.orderId || orderId
      )}`,
      303
    );
  } catch (error) {
    console.error("[SAFEPAY_CALLBACK_ERROR]", error);
    return NextResponse.redirect(
      `${origin}/admin?tab=subscription&payment=error`,
      303
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return handleCallback(req, {
    orderId: (searchParams.get("order_id") || "").trim(),
    tracker: (
      searchParams.get("tracker") ||
      searchParams.get("beacon") ||
      ""
    ).trim(),
    sig: searchParams.get("sig"),
    reference: (searchParams.get("reference") || "").trim(),
    isCanceled: searchParams.get("cancel") === "1",
  });
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const contentType = req.headers.get("content-type") || "";

  let bodyFields: Record<string, string> = {};
  try {
    if (contentType.includes("application/json")) {
      const json = await req.json();
      if (json && typeof json === "object") {
        for (const [k, v] of Object.entries(json)) {
          bodyFields[k] = String(v ?? "");
        }
      }
    } else {
      const form = await req.formData();
      form.forEach((value, key) => {
        bodyFields[key] = String(value);
      });
    }
  } catch {
    // Fall back to query parameters only
  }

  return handleCallback(req, {
    orderId: (
      bodyFields.order_id ||
      searchParams.get("order_id") ||
      ""
    ).trim(),
    tracker: (
      bodyFields.tracker ||
      bodyFields.beacon ||
      searchParams.get("tracker") ||
      searchParams.get("beacon") ||
      ""
    ).trim(),
    sig: bodyFields.sig || searchParams.get("sig"),
    reference: (
      bodyFields.reference ||
      searchParams.get("reference") ||
      ""
    ).trim(),
    isCanceled:
      bodyFields.cancel === "1" || searchParams.get("cancel") === "1",
  });
}
