import crypto from "node:crypto";

export type SafepayEnvironment = "sandbox" | "production";

export interface SafepayConfig {
  configured: boolean;
  environment: SafepayEnvironment;
  apiKey: string;
  v1Secret: string;
  webhookSecret: string;
  apiBaseUrl: string;
  checkoutBaseUrl: string;
}

export function getSafepayConfig(): SafepayConfig {
  const rawKey = (process.env.SAFEPAY_API_KEY || "").trim();
  const rawV1Secret = (process.env.SAFEPAY_V1_SECRET || "").trim();
  const rawWebhookSecret = (process.env.SAFEPAY_WEBHOOK_SECRET || "").trim();
  const envRaw = (process.env.SAFEPAY_ENV || "production").trim().toLowerCase();
  const environment: SafepayEnvironment =
    envRaw === "sandbox" ? "sandbox" : "production";

  const isPlaceholder =
    !rawKey ||
    rawKey.includes("your_safepay") ||
    rawKey.includes("sec_xxxx");

  const apiBaseUrl =
    environment === "production"
      ? "https://api.getsafepay.com"
      : "https://sandbox.api.getsafepay.com";

  const checkoutBaseUrl =
    environment === "production"
      ? "https://www.getsafepay.com/components"
      : "https://sandbox.api.getsafepay.com/components";

  return {
    configured: !isPlaceholder,
    environment,
    apiKey: rawKey,
    v1Secret: rawV1Secret,
    webhookSecret: rawWebhookSecret,
    apiBaseUrl,
    checkoutBaseUrl,
  };
}

export function resolveAppOrigin(req: Request): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function createSafepayOrderSession(params: {
  amountPkr: number;
  orderId: string;
  redirectUrl: string;
  cancelUrl: string;
}): Promise<{ tracker: string; checkoutUrl: string; environment: SafepayEnvironment }> {
  const cfg = getSafepayConfig();
  if (!cfg.configured) {
    throw new Error(
      "Safepay payment gateway keys are not configured in .env.local."
    );
  }

  const initRes = await fetch(`${cfg.apiBaseUrl}/order/v1/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client: cfg.apiKey,
      amount: params.amountPkr,
      currency: "PKR",
      environment: cfg.environment,
    }),
  });

  const initData = await initRes.json().catch(() => null);
  const tracker: string =
    initData?.data?.token || initData?.token || "";

  if (!initRes.ok || !tracker) {
    console.error("[SAFEPAY_INIT_ERROR]", initRes.status, initData);
    throw new Error(
      initData?.status?.errors?.[0] ||
        initData?.message ||
        "Safepay could not initialize the checkout session. Please verify your SAFEPAY_API_KEY and SAFEPAY_ENV."
    );
  }

  const checkoutParams = new URLSearchParams({
    env: cfg.environment,
    beacon: tracker,
    source: "custom",
    order_id: params.orderId,
    redirect_url: params.redirectUrl,
    cancel_url: params.cancelUrl,
    webhooks: "true",
  });

  return {
    tracker,
    checkoutUrl: `${cfg.checkoutBaseUrl}?${checkoutParams.toString()}`,
    environment: cfg.environment,
  };
}

function timingSafeHexMatch(expectedHex: string, receivedSig: string): boolean {
  const cleanReceived = receivedSig.trim().replace(/^sha256=/i, "").toLowerCase();
  const cleanExpected = expectedHex.trim().toLowerCase();
  if (
    !cleanReceived ||
    !cleanExpected ||
    cleanReceived.length !== cleanExpected.length
  ) {
    return false;
  }
  try {
    const a = Buffer.from(cleanExpected, "hex");
    const b = Buffer.from(cleanReceived, "hex");
    if (a.length === 0 || a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Verifies Safepay webhook `X-SFPY-SIGNATURE` using HMAC-SHA256.
 * Supports both timestamped (`timestamp.rawBody`) and raw-body webhook schemes.
 */
export function verifySafepayWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader?: string | null;
}): boolean {
  const cfg = getSafepayConfig();
  const secret = cfg.webhookSecret;
  if (!secret || !params.signatureHeader) {
    return false;
  }

  const candidates: string[] = [];

  // Format 1: Modern Safepay timestamped payload (`X-SFPY-TIMESTAMP + "." + rawBody`)
  if (params.timestampHeader) {
    candidates.push(
      crypto
        .createHmac("sha256", secret)
        .update(`${params.timestampHeader}.${params.rawBody}`)
        .digest("hex")
    );
  }

  // Format 2: Standard Safepay raw JSON body HMAC-SHA256
  candidates.push(
    crypto.createHmac("sha256", secret).update(params.rawBody).digest("hex")
  );

  // Format 3: Safepay v1 JSON `data` object stringified HMAC-SHA256 (used by Safepay Node SDK)
  try {
    const parsed = JSON.parse(params.rawBody);
    if (parsed && typeof parsed.data === "object" && parsed.data !== null) {
      candidates.push(
        crypto
          .createHmac("sha256", secret)
          .update(JSON.stringify(parsed.data))
          .digest("hex")
      );
    }
  } catch {
    // Non-JSON payload
  }

  return candidates.some((expected) =>
    timingSafeHexMatch(expected, params.signatureHeader || "")
  );
}

/**
 * Verifies Safepay checkout redirect return callback signature (`sig = HMAC-SHA256(V1_SECRET, tracker)`).
 */
export function verifySafepayCallbackSignature(
  tracker: string,
  sig: string | null
): boolean {
  const cfg = getSafepayConfig();
  if (!cfg.v1Secret) {
    return false;
  }
  if (!tracker || !sig) {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", cfg.v1Secret)
    .update(tracker)
    .digest("hex");

  return timingSafeHexMatch(expected, sig);
}
