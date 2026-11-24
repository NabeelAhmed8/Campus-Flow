import { NextResponse } from "next/server";
import { generateLessonPlanAI } from "@/lib/gemini";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin", "teacher"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { topic, grade, duration, subject } = body ?? {};

    if (
      typeof topic !== "string" ||
      typeof grade !== "string" ||
      !topic.trim() ||
      !grade.trim()
    ) {
      return NextResponse.json(
        { error: "Topic and Grade are required fields." },
        { status: 400 }
      );
    }

    const result = await generateLessonPlanAI({
      topic: topic.trim().slice(0, 200),
      grade: grade.trim().slice(0, 40),
      duration:
        typeof duration === "string" && duration.trim()
          ? duration.trim().slice(0, 40)
          : "45 Minutes",
      subject:
        typeof subject === "string" && subject.trim()
          ? subject.trim().slice(0, 80)
          : "General",
    });

    return NextResponse.json({
      success: true,
      plan: result,
      model: result.modelUsed,
    });
  } catch (error) {
    console.error("[AI_LESSON_PLAN_ERROR]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to generate lesson plan. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
