import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { CoordinatorNotice } from "@/models/CoordinatorNotice";
import { requireAuth } from "@/lib/auth";
import { createCampusNotification } from "@/lib/notifications";

const VALID_TYPES = ["datesheet", "circular", "substitution", "ptm"] as const;
const VALID_AUDIENCES = ["all", "teachers", "parents", "students"] as const;

export async function GET(req: Request) {
  const auth = await requireAuth(req, [
    "admin",
    "coordinator",
    "teacher",
    "student",
    "parent",
  ]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ success: true, notices: [] });
  }

  try {
    await connectDB();
    const notices = await CoordinatorNotice.find({
      schoolId: new mongoose.Types.ObjectId(session.schoolId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, notices });
  } catch (error) {
    console.error("[NOTICES_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load campus notices." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin", "coordinator"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ error: "School workspace not configured." }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { type, title, audience, grade, eventDate, details } = body ?? {};

    if (
      typeof title !== "string" ||
      typeof details !== "string" ||
      !title.trim() ||
      !details.trim()
    ) {
      return NextResponse.json(
        { error: "Title and circular details are required." },
        { status: 400 }
      );
    }

    const cleanType: (typeof VALID_TYPES)[number] =
      typeof type === "string" && (VALID_TYPES as readonly string[]).includes(type)
        ? (type as (typeof VALID_TYPES)[number])
        : "circular";
    const cleanAudience: (typeof VALID_AUDIENCES)[number] =
      typeof audience === "string" &&
      (VALID_AUDIENCES as readonly string[]).includes(audience)
        ? (audience as (typeof VALID_AUDIENCES)[number])
        : "all";

    const notice = await CoordinatorNotice.create({
      schoolId: new mongoose.Types.ObjectId(session.schoolId),
      type: cleanType,
      title: title.trim().slice(0, 140),
      audience: cleanAudience,
      grade:
        typeof grade === "string" && grade.trim()
          ? grade.trim().slice(0, 40)
          : "All Classes",
      eventDate:
        typeof eventDate === "string" ? eventDate.trim().slice(0, 30) : "",
      details: details.trim().slice(0, 1200),
      postedBy: session.name || "Academic Coordinator",
    });

    await createCampusNotification({
      schoolId: session.schoolId,
      category: cleanType === "datesheet" ? "datesheet" : "circular",
      title: notice.title,
      message: `${notice.grade}${
        notice.eventDate ? ` • Date: ${notice.eventDate}` : ""
      } — ${notice.details.slice(0, 140)}`,
      audience: cleanAudience,
      grade: notice.grade,
      createdBy: session.name || "Academic Coordinator",
    });

    return NextResponse.json(
      { success: true, message: "Notice published successfully.", notice },
      { status: 201 }
    );
  } catch (error) {
    console.error("[NOTICES_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to publish campus notice." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(req, ["admin", "coordinator"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ error: "School workspace not configured." }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { id, type, title, audience, grade, eventDate, details } = body ?? {};

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid notice ID." }, { status: 400 });
    }

    if (
      typeof title !== "string" ||
      typeof details !== "string" ||
      !title.trim() ||
      !details.trim()
    ) {
      return NextResponse.json(
        { error: "Title and circular details are required." },
        { status: 400 }
      );
    }

    const cleanType: (typeof VALID_TYPES)[number] =
      typeof type === "string" && (VALID_TYPES as readonly string[]).includes(type)
        ? (type as (typeof VALID_TYPES)[number])
        : "circular";
    const cleanAudience: (typeof VALID_AUDIENCES)[number] =
      typeof audience === "string" &&
      (VALID_AUDIENCES as readonly string[]).includes(audience)
        ? (audience as (typeof VALID_AUDIENCES)[number])
        : "all";

    const updated = await CoordinatorNotice.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        schoolId: new mongoose.Types.ObjectId(session.schoolId),
      },
      {
        $set: {
          type: cleanType,
          title: title.trim().slice(0, 140),
          audience: cleanAudience,
          grade:
            typeof grade === "string" && grade.trim()
              ? grade.trim().slice(0, 40)
              : "All Classes",
          eventDate:
            typeof eventDate === "string" ? eventDate.trim().slice(0, 30) : "",
          details: details.trim().slice(0, 1200),
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Notice not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Circular updated successfully.",
      notice: updated,
    });
  } catch (error) {
    console.error("[NOTICES_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update campus notice." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(req, ["admin", "coordinator"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ error: "School workspace not configured." }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid notice ID." }, { status: 400 });
    }

    await CoordinatorNotice.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      schoolId: new mongoose.Types.ObjectId(session.schoolId),
    });

    return NextResponse.json({ success: true, message: "Notice deleted." });
  } catch (error) {
    console.error("[NOTICES_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to delete notice." }, { status: 500 });
  }
}
