import { NextResponse } from "next/server";
import { generateQuizAI } from "@/lib/gemini";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin", "teacher", "student"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { topic, grade, count } = body ?? {};

    if (typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { error: "Topic is required for quiz generation." },
        { status: 400 }
      );
    }

    const rawCount = count !== undefined ? Number(count) : 3;
    const safeCount = Number.isFinite(rawCount)
      ? Math.min(10, Math.max(1, Math.round(rawCount)))
      : 3;

    const { questions, modelUsed } = await generateQuizAI({
      topic: topic.trim().slice(0, 200),
      grade:
        typeof grade === "string" && grade.trim()
          ? grade.trim().slice(0, 40)
          : "Grade 9",
      count: safeCount,
    });

    return NextResponse.json({ success: true, questions, model: modelUsed });
  } catch (error) {
    console.error("[AI_QUIZ_ERROR]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to generate assessment quiz. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
