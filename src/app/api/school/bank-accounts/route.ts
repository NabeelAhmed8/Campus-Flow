import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { School, type ISchoolBankAccount } from "@/models/School";
import { requireSchoolAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireSchoolAuth(req, ["admin", "parent"], {
    emptyPayload: { success: true, bankAccounts: [] },
  });
  if (auth.response) return auth.response;

  const { schoolId } = auth;

  try {
    await connectDB();
    const school = await School.findById(schoolId).select("bankAccounts name");
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
  const auth = await requireSchoolAuth(req, ["admin"]);
  if (auth.response) return auth.response;

  const { schoolId } = auth;

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
      schoolId,
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
