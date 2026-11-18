import { NextResponse } from "next/server";

/**
 * Direct unverified registration is disabled.
 * All new accounts must complete email verification via:
 * 1. POST /api/auth/send-verification
 * 2. POST /api/auth/verify-signup
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Email verification is required to register a new account. Please request a verification code first.",
    },
    { status: 403 }
  );
}
