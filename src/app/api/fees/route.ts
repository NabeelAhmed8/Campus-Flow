import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Fee } from "@/models/Fee";
import { CampusNotification } from "@/models/CampusNotification";
import { requireSchoolAuth } from "@/lib/auth";

const VALID_FEE_STATUSES = ["paid", "pending", "overdue", "pending_verification"] as const;

export async function GET(req: Request) {
  const auth = await requireSchoolAuth(req, ["admin", "parent"], {
    emptyPayload: { success: true, fees: [] },
  });
  if (auth.response) return auth.response;

  const { session, schoolObjId } = auth;

  try {
    await connectDB();
    const query: Record<string, unknown> = { schoolId: schoolObjId };

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
    return NextResponse.json({ error: "Failed to load fee records." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireSchoolAuth(req, ["admin", "parent"]);
  if (auth.response) return auth.response;

  const { session } = auth;

  try {
    await connectDB();
    const body = await req.json();
    const { id, status, paymentMethod, transactionRef, depositorName } = body ?? {};

    if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid fee record identifier." }, { status: 400 });
    }

    const existingFee = await Fee.findById(id);
    if (!existingFee) {
      return NextResponse.json({ error: "Fee record not found." }, { status: 404 });
    }

    // Multi-tenant isolation guard
    if (existingFee.schoolId?.toString() !== session.schoolId) {
      return NextResponse.json(
        { error: "Access denied. This invoice belongs to another institution." },
        { status: 403 }
      );
    }

    // Tamper Prevention: Once Admin marks a fee PAID, it is permanently immutable
    if (existingFee.status === "paid") {
      return NextResponse.json(
        {
          error:
            "Tamper Prevention: Cleared paid transactions are immutable and cannot be modified.",
        },
        { status: 403 }
      );
    }

    // PARENT FLOW: Submit bank transfer proof -> status becomes `pending_verification` (Admin must verify!)
    if (session.role === "parent") {
      const parentAllowedIds = session.linkedStudentIds || [];
      if (!parentAllowedIds.includes(existingFee.studentId.toString())) {
        return NextResponse.json(
          { error: "Access denied. You may only submit payments for your linked children." },
          { status: 403 }
        );
      }

      if (typeof transactionRef !== "string" || transactionRef.trim().length < 4) {
        return NextResponse.json(
          {
            error:
              "Please enter your real Bank Transaction Reference / Deposit Slip ID (minimum 4 characters) for admin verification.",
          },
          { status: 400 }
        );
      }

      const cleanMethod =
        typeof paymentMethod === "string" && paymentMethod.trim()
          ? paymentMethod.trim().slice(0, 80)
          : "Pakistani Bank Transfer";
      const cleanRef = transactionRef.trim().slice(0, 80);
      const cleanDepositor =
        typeof depositorName === "string" && depositorName.trim()
          ? depositorName.trim().slice(0, 80)
          : session.name || "Guardian";

      const updated = await Fee.findByIdAndUpdate(
        id,
        {
          status: "pending_verification",
          paymentMethod: cleanMethod,
          transactionRef: cleanRef,
          depositorName: cleanDepositor,
          submittedAt: new Date(),
        },
        { new: true }
      );

      // Alert Admin via private Billing Notification Bell
      await CampusNotification.create({
        schoolId: new mongoose.Types.ObjectId(session.schoolId),
        category: "billing",
        title: `Fee Payment Proof Submitted: ${existingFee.studentName}`,
        message: `${cleanDepositor} submitted a bank transfer of Rs. ${existingFee.amount.toLocaleString()} for ${existingFee.studentName} (${existingFee.rollNumber}) via ${cleanMethod}. Ref: ${cleanRef}. Please verify in your bank statement and approve in Fee Billing.`,
        audience: "admin",
        grade: existingFee.grade,
        section: "All Sections",
        priority: "urgent",
        createdBy: cleanDepositor,
        senderRole: "admin",
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        fee: updated,
        message:
          "Payment reference submitted! Your fee will be marked Paid once the school administrator verifies the transfer.",
      });
    }

    // ADMIN FLOW: Approve (`paid`), Reject (`pending`), or Record direct bank payment
    if (!status || !(VALID_FEE_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: "Invalid fee status provided." }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = { status };
    if (status === "paid") {
      updateFields.paidDate = new Date();
    } else if (status === "pending") {
      // Admin rejected an unverified parent submission
      updateFields.paymentMethod = "";
      updateFields.transactionRef = "";
      updateFields.depositorName = "";
      updateFields.submittedAt = undefined;
    }

    if (status === "paid") {
      if (typeof paymentMethod === "string" && paymentMethod.trim()) {
        updateFields.paymentMethod = paymentMethod.trim().slice(0, 80);
      }
      if (typeof transactionRef === "string" && transactionRef.trim()) {
        updateFields.transactionRef = transactionRef.trim().slice(0, 80);
      }
    }

    const updated = await Fee.findByIdAndUpdate(id, updateFields, { new: true });

    // Notify Parent when Admin verifies or rejects a submitted transfer
    if (existingFee.status === "pending_verification") {
      await CampusNotification.create({
        schoolId: new mongoose.Types.ObjectId(session.schoolId),
        category: "announcement",
        title:
          status === "paid"
            ? `Fee Verified & Cleared: ${existingFee.studentName}`
            : `Fee Transfer Could Not Be Verified: ${existingFee.studentName}`,
        message:
          status === "paid"
            ? `Payment of Rs. ${existingFee.amount.toLocaleString()} (${existingFee.month}) has been verified and cleared by ${session.name || "Administration"}. Ref: ${updated?.transactionRef || "Verified"}.`
            : `The submitted transaction reference (${existingFee.transactionRef}) for ${existingFee.studentName} could not be matched. Please re-check your receipt and submit again.`,
        audience: "parents",
        grade: existingFee.grade,
        section: "All Sections",
        priority: status === "paid" ? "normal" : "urgent",
        createdBy: session.name || "School Administration",
        senderRole: "admin",
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, fee: updated });
  } catch (error) {
    console.error("[FEES_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Failed to update fee record." }, { status: 500 });
  }
}
