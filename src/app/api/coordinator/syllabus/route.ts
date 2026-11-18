import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { SyllabusItem } from "@/models/SyllabusItem";
import { requireSchoolAuth } from "@/lib/auth";
import { createCampusNotification } from "@/lib/notifications";

const VALID_TERMS = ["first_term", "mid_term", "final_term"] as const;
const VALID_STATUSES = ["pending", "in_progress", "completed"] as const;

export async function GET(req: Request) {
  const auth = await requireSchoolAuth(
    req,
    ["admin", "coordinator", "teacher", "student", "parent"],
    { emptyPayload: { success: true, items: [] } }
  );
  if (auth.response) return auth.response;

  const { schoolObjId } = auth;

  try {
    await connectDB();
    const items = await SyllabusItem.find({ schoolId: schoolObjId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("[SYLLABUS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load syllabus items." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireSchoolAuth(req, ["admin", "coordinator"]);
  if (auth.response) return auth.response;

  const { session, schoolId, schoolObjId } = auth;

  try {
    await connectDB();
    const body = await req.json();
    const {
      grade,
      term,
      subject,
      chapterTitle,
      topics,
      targetDate,
      assignedTeacher,
    } = body ?? {};

    if (
      typeof grade !== "string" ||
      typeof subject !== "string" ||
      typeof chapterTitle !== "string" ||
      !grade.trim() ||
      !subject.trim() ||
      !chapterTitle.trim()
    ) {
      return NextResponse.json(
        { error: "Class, subject, and chapter title are required." },
        { status: 400 }
      );
    }

    const cleanTerm: (typeof VALID_TERMS)[number] =
      typeof term === "string" && (VALID_TERMS as readonly string[]).includes(term)
        ? (term as (typeof VALID_TERMS)[number])
        : "first_term";

    const item = await SyllabusItem.create({
      schoolId: schoolObjId,
      grade: grade.trim().slice(0, 30),
      term: cleanTerm,
      subject: subject.trim().slice(0, 80),
      chapterTitle: chapterTitle.trim().slice(0, 140),
      topics:
        typeof topics === "string" ? topics.trim().slice(0, 400) : "",
      targetDate:
        typeof targetDate === "string" ? targetDate.trim().slice(0, 30) : "",
      status: "pending",
      assignedTeacher:
        typeof assignedTeacher === "string" && assignedTeacher.trim()
          ? assignedTeacher.trim().slice(0, 100)
          : "Subject Teacher",
      createdBy: session.name || "Academic Coordinator",
    });

    const termLabel =
      cleanTerm === "first_term"
        ? "First Term"
        : cleanTerm === "mid_term"
          ? "2nd / Mid-Term"
          : "Final Term";

    await createCampusNotification({
      schoolId,
      category: "syllabus",
      title: `Syllabus Scheduled — ${item.grade} (${item.subject})`,
      message: `${termLabel}: ${item.chapterTitle}${item.targetDate ? ` • Target: ${item.targetDate}` : ""
        }.`,
      audience: "all",
      grade: item.grade,
      createdBy: session.name || "Academic Coordinator",
      senderRole: session.role === "admin" ? "admin" : "coordinator",
      senderUserId: session.id,
    });

    return NextResponse.json(
      { success: true, message: "Syllabus unit scheduled successfully.", item },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SYLLABUS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to save syllabus item." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await requireSchoolAuth(req, ["admin", "coordinator"]);
  if (auth.response) return auth.response;

  const { schoolObjId } = auth;

  try {
    await connectDB();
    const body = await req.json();
    const {
      id,
      status,
      grade,
      term,
      subject,
      chapterTitle,
      topics,
      targetDate,
      assignedTeacher,
    } = body ?? {};

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid syllabus ID is required." }, { status: 400 });
    }

    const updateSet: Record<string, unknown> = {};

    if (status !== undefined) {
      if (
        typeof status !== "string" ||
        !(VALID_STATUSES as readonly string[]).includes(status)
      ) {
        return NextResponse.json({ error: "Invalid syllabus status." }, { status: 400 });
      }
      updateSet.status = status as (typeof VALID_STATUSES)[number];
    }

    if (grade !== undefined) {
      if (typeof grade !== "string" || !grade.trim()) {
        return NextResponse.json({ error: "Class / grade cannot be empty." }, { status: 400 });
      }
      updateSet.grade = grade.trim().slice(0, 30);
    }

    if (term !== undefined) {
      if (
        typeof term !== "string" ||
        !(VALID_TERMS as readonly string[]).includes(term)
      ) {
        return NextResponse.json({ error: "Invalid academic term selected." }, { status: 400 });
      }
      updateSet.term = term as (typeof VALID_TERMS)[number];
    }

    if (subject !== undefined) {
      if (typeof subject !== "string" || !subject.trim()) {
        return NextResponse.json({ error: "Subject cannot be empty." }, { status: 400 });
      }
      updateSet.subject = subject.trim().slice(0, 80);
    }

    if (chapterTitle !== undefined) {
      if (typeof chapterTitle !== "string" || !chapterTitle.trim()) {
        return NextResponse.json({ error: "Chapter / unit title cannot be empty." }, { status: 400 });
      }
      updateSet.chapterTitle = chapterTitle.trim().slice(0, 140);
    }

    if (topics !== undefined && typeof topics === "string") {
      updateSet.topics = topics.trim().slice(0, 400);
    }

    if (targetDate !== undefined && typeof targetDate === "string") {
      updateSet.targetDate = targetDate.trim().slice(0, 30);
    }

    if (assignedTeacher !== undefined && typeof assignedTeacher === "string") {
      updateSet.assignedTeacher = assignedTeacher.trim()
        ? assignedTeacher.trim().slice(0, 100)
        : "Subject Teacher";
    }

    if (Object.keys(updateSet).length === 0) {
      return NextResponse.json({ error: "No valid changes provided." }, { status: 400 });
    }

    const updated = await SyllabusItem.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        schoolId: schoolObjId,
      },
      { $set: updateSet },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Syllabus item not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Syllabus unit updated successfully.",
      item: updated,
    });
  } catch (error) {
    console.error("[SYLLABUS_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Failed to update syllabus item." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireSchoolAuth(req, ["admin", "coordinator"]);
  if (auth.response) return auth.response;

  const { schoolObjId } = auth;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid syllabus item ID." }, { status: 400 });
    }

    await SyllabusItem.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      schoolId: schoolObjId,
    });

    return NextResponse.json({ success: true, message: "Syllabus item deleted." });
  } catch (error) {
    console.error("[SYLLABUS_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to delete syllabus item." }, { status: 500 });
  }
}
