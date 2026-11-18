import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Fee } from "@/models/Fee";
import { Student } from "@/models/Student";
import { requireSchoolAuth } from "@/lib/auth";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export async function GET(req: Request) {
  const auth = await requireSchoolAuth(req, ["admin"], {
    emptyPayload: {
      success: true,
      stats: { totalCollected: 0, totalPending: 0, recoveryRate: 0, studentCount: 0 },
      revenueTrend: [],
    },
  });
  if (auth.response) return auth.response;

  const { schoolObjId } = auth;

  try {
    await connectDB();

    const [fees, studentCount] = await Promise.all([
      Fee.find({ schoolId: schoolObjId }),
      Student.countDocuments({ schoolId: schoolObjId, status: "active" }),
    ]);

    const totalCollected = fees
      .filter((f) => f.status === "paid")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const totalPending = fees
      .filter((f) => f.status !== "paid")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const totalBilling = totalCollected + totalPending;
    const recoveryRate =
      totalBilling > 0 ? Math.round((totalCollected / totalBilling) * 100) : 0;

    // Dynamically calculate revenue trend for the last 6 calendar months
    const now = new Date();
    const revenueTrend = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const monthLabel = MONTH_NAMES[mIdx];

      const monthFees = fees.filter((f) => {
        const dateToCheck = f.paidDate
          ? new Date(f.paidDate)
          : new Date(f.createdAt || f.dueDate);
        return dateToCheck.getMonth() === mIdx && dateToCheck.getFullYear() === yr;
      });

      const collected = monthFees
        .filter((f) => f.status === "paid")
        .reduce((sum, f) => sum + (f.amount || 0), 0);

      const target = monthFees.reduce((sum, f) => sum + (f.amount || 0), 0);

      revenueTrend.push({
        month: monthLabel,
        collected,
        target,
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalCollected,
        totalPending,
        recoveryRate,
        studentCount,
      },
      revenueTrend,
    });
  } catch (error) {
    console.error("[ANALYTICS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to calculate institutional analytics." },
      { status: 500 }
    );
  }
}
