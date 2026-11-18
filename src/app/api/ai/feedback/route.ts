import { NextResponse } from "next/server";
import { generateStudentFeedbackAI } from "@/lib/gemini";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin", "teacher"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { studentName, subject, assessment, obtainedMarks, totalMarks, examStatus } = body ?? {};

    if (typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }

    const total = Number(totalMarks) > 0 ? Number(totalMarks) : 100;
    const obtained = examStatus === "absent" ? 0 : Math.max(0, Number(obtainedMarks) || 0);

    const feedback = await generateStudentFeedbackAI({
      studentName: typeof studentName === "string" ? studentName.trim().slice(0, 80) : undefined,
      subject: subject.trim().slice(0, 80),
      assessment: typeof assessment === "string" ? assessment.trim().slice(0, 100) : undefined,
      obtainedMarks: obtained,
      totalMarks: total,
      examStatus: examStatus === "absent" ? "absent" : "present",
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("[AI_FEEDBACK_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to generate AI feedback. Please try again." },
      { status: 500 }
    );
  }
}
