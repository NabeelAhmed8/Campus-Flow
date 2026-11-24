import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  isPlaceholderSecret,
  verifySafepayCallbackSignature,
  verifySafepayWebhookSignature,
} from "../src/lib/safepay.ts";
import { DEFAULT_GEMINI_MODEL_CHAIN } from "../src/lib/gemini.ts";

test("Safepay isPlaceholderSecret correctly detects dummy and empty keys", () => {
  assert.equal(isPlaceholderSecret(""), true);
  assert.equal(isPlaceholderSecret(undefined), true);
  assert.equal(isPlaceholderSecret("sec_your_safepay_api_key"), true);
  assert.equal(isPlaceholderSecret("your_safepay_v1_secret"), true);
  assert.equal(isPlaceholderSecret("change_me"), true);
  assert.equal(isPlaceholderSecret("sec_live_998822aabbcc"), false);
});

test("verifySafepayCallbackSignature validates redirect return signature", () => {
  process.env.SAFEPAY_V1_SECRET = "test_v1_secret_4455";
  const tracker = "track_123456789";
  const expectedSig = crypto
    .createHmac("sha256", "test_v1_secret_4455")
    .update(tracker)
    .digest("hex");

  assert.equal(verifySafepayCallbackSignature(tracker, expectedSig), true);
  assert.equal(verifySafepayCallbackSignature(tracker, "wrong_sig"), false);
  assert.equal(verifySafepayCallbackSignature("", expectedSig), false);
  assert.equal(verifySafepayCallbackSignature(tracker, null), false);
});

test("verifySafepayWebhookSignature validates HMAC-SHA256 webhooks", () => {
  process.env.SAFEPAY_WEBHOOK_SECRET = "test_webhook_sec_1122";
  const rawBody = JSON.stringify({
    event: "payment.completed",
    data: { token: "track_9988", amount: 4999 },
  });

  const validSig = crypto
    .createHmac("sha256", "test_webhook_sec_1122")
    .update(rawBody)
    .digest("hex");

  assert.equal(
    verifySafepayWebhookSignature({ rawBody, signatureHeader: validSig }),
    true
  );
  assert.equal(
    verifySafepayWebhookSignature({
      rawBody: rawBody + "tampered",
      signatureHeader: validSig,
    }),
    false
  );
  assert.equal(
    verifySafepayWebhookSignature({ rawBody, signatureHeader: null }),
    false
  );
});

test("DEFAULT_GEMINI_MODEL_CHAIN contains 7 multi-model failover candidates in order", () => {
  assert.equal(DEFAULT_GEMINI_MODEL_CHAIN.length, 7);
  assert.equal(DEFAULT_GEMINI_MODEL_CHAIN[0], "gemini-3-flash-preview");
  assert.equal(DEFAULT_GEMINI_MODEL_CHAIN[1], "gemini-3.1-flash-lite-preview");
  assert.ok(DEFAULT_GEMINI_MODEL_CHAIN.includes("gemini-3.1-pro-preview"));
});
