import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Fee } from "@/models/Fee";
import { requireAuth } from "@/lib/auth";

const VALID_FEE_STATUSES = ["paid", "pending", "overdue"] as const;

export async function GET(req: Request) {
  const auth = await requireAuth(req, ["admin", "parent"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ success: true, fees: [] });
  }

  try {
    await connectDB();
    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);

    const query: Record<string, unknown> = { schoolId: schoolObjId };

    // Parents can ONLY view fees for their own linked children
    if (session.role === "parent") {
      const validIds = (session.linkedStudentIds || [])
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (validIds.length === 0) {
        return NextResponse.json({ success: true, fees: [] });
      }
      query.studentId = { $in: validIds };
    }

    const fees = await Fee.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, fees: fees || [] });
  } catch (error) {
    console.error("[FEES_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load fee records." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(req, ["admin", "parent"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json(
      { error: "School workspace is not configured for this account." },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const body = await req.json();
    const { id, status, paymentMethod, transactionRef } = body ?? {};

    if (!id || typeof id !== "string" || !status || typeof status !== "string") {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid fee record identifier." },
        { status: 400 }
      );
    }

    if (!(VALID_FEE_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json(
        { error: "Invalid fee status provided." },
        { status: 400 }
      );
    }

    // Parents can only settle fees (mark as paid), never change invoices to arbitrary states
    if (session.role === "parent" && status !== "paid") {
      return NextResponse.json(
        { error: "Guardians are only authorized to submit fee payments." },
        { status: 403 }
      );
    }

    const existingFee = await Fee.findById(id);
    if (!existingFee) {
      return NextResponse.json(
        { error: "Fee record not found." },
        { status: 404 }
      );
    }

    // Multi-tenant isolation guard: fee must belong to user's school
    if (existingFee.schoolId?.toString() !== session.schoolId) {
      return NextResponse.json(
        { error: "Access denied. This invoice belongs to another institution." },
        { status: 403 }
      );
    }

    // Parent privacy guard: parent can only pay invoices for their own linked children
    const parentAllowedIds = session.linkedStudentIds || [];
    if (
      session.role === "parent" &&
      !parentAllowedIds.includes(existingFee.studentId.toString())
    ) {
      return NextResponse.json(
        { error: "Access denied. You may only pay invoices for your linked children." },
        { status: 403 }
      );
    }

    // Anti-Corruption / Tamper Guard: Once a fee is cleared & paid, it cannot be reverted
    if (existingFee.status === "paid" && status !== "paid") {
      return NextResponse.json(
        {
          error:
            "Tamper Prevention: Cleared paid transactions are immutable and cannot be reverted to pending.",
        },
        { status: 403 }
      );
    }

    const updateFields: Record<string, unknown> = {
      status,
      paidDate: status === "paid" ? existingFee.paidDate || new Date() : undefined,
    };

    if (typeof paymentMethod === "string" && paymentMethod.trim()) {
      updateFields.paymentMethod = paymentMethod.trim().slice(0, 80);
    }
    if (typeof transactionRef === "string" && transactionRef.trim()) {
      updateFields.transactionRef = transactionRef.trim().slice(0, 80);
    }

    const updated = await Fee.findByIdAndUpdate(id, updateFields, { new: true });

    return NextResponse.json({ success: true, fee: updated });
  } catch (error) {
    console.error("[FEES_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update fee record." },
      { status: 500 }
    );
  }
}
