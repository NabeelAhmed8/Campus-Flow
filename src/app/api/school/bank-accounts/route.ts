import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { School, type ISchoolBankAccount } from "@/models/School";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth(req, ["admin", "parent"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ success: true, bankAccounts: [] });
  }

  try {
    await connectDB();
    const school = await School.findById(session.schoolId).select("bankAccounts name");
    return NextResponse.json({
      success: true,
      bankAccounts: Array.isArray(school?.bankAccounts) ? school.bankAccounts : [],
    });
  } catch (error) {
    console.error("[BANK_ACCOUNTS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to load bank accounts." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ error: "School workspace not configured." }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const rawList: unknown[] = Array.isArray(body?.bankAccounts) ? body.bankAccounts : [];

    type RawBankEntry = {
      id?: unknown;
      bankName?: unknown;
      badge?: unknown;
      accountTitle?: unknown;
      accountNo?: unknown;
      iban?: unknown;
      branch?: unknown;
    };

    const sanitized: ISchoolBankAccount[] = rawList
      .slice(0, 8)
      .filter((item): item is RawBankEntry & { bankName: string; accountTitle: string; accountNo: string } => {
        if (!item || typeof item !== "object") return false;
        const b = item as RawBankEntry;
        return (
          typeof b.bankName === "string" &&
          b.bankName.trim().length > 0 &&
          typeof b.accountTitle === "string" &&
          b.accountTitle.trim().length > 0 &&
          typeof b.accountNo === "string" &&
          b.accountNo.trim().length > 0
        );
      })
      .map((b, idx) => ({
        id:
          typeof b.id === "string" && b.id.trim()
            ? b.id.trim().slice(0, 40)
            : `bank-${Date.now()}-${idx}`,
        bankName: b.bankName.trim().slice(0, 80),
        badge:
          typeof b.badge === "string" && b.badge.trim()
            ? b.badge.trim().slice(0, 40)
            : "Bank Transfer",
        accountTitle: b.accountTitle.trim().slice(0, 100),
        accountNo: b.accountNo.trim().slice(0, 60),
        iban: typeof b.iban === "string" ? b.iban.trim().slice(0, 60) : "",
        branch: typeof b.branch === "string" ? b.branch.trim().slice(0, 120) : "",
      }));

    const school = await School.findByIdAndUpdate(
      session.schoolId,
      { $set: { bankAccounts: sanitized } },
      { new: true }
    );

    if (!school) {
      return NextResponse.json({ error: "School not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      bankAccounts: school.bankAccounts || [],
    });
  } catch (error) {
    console.error("[BANK_ACCOUNTS_PUT_ERROR]", error);
    return NextResponse.json({ error: "Failed to save bank accounts." }, { status: 500 });
  }
}
