import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import {
  CampusNotification,
  NotificationAudience,
  NotificationCategory,
} from "@/models/CampusNotification";
import { requireAuth } from "@/lib/auth";
import {
  createCampusNotification,
  getAllowedAudiencesForRole,
} from "@/lib/notifications";

const VALID_CATEGORIES = [
  "announcement",
  "urgent",
  "datesheet",
  "timetable",
  "syllabus",
  "circular",
] as const;

const VALID_AUDIENCES = [
  "all",
  "parents_students",
  "parents",
  "students",
  "teachers",
] as const;

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
    return NextResponse.json({
      success: true,
      notifications: [],
      unreadCount: 0,
    });
  }

  try {
    await connectDB();
    const query: Record<string, unknown> = {
      schoolId: new mongoose.Types.ObjectId(session.schoolId),
    };

    const allowedAudiences = getAllowedAudiencesForRole(session.role);
    if (allowedAudiences) {
      query.audience = { $in: allowedAudiences };
    }

    const items = await CampusNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    let unreadCount = 0;
    const formatted = items.map((item) => {
      const isRead = Array.isArray(item.readBy)
        ? item.readBy.includes(session.id)
        : false;
      if (!isRead) unreadCount++;
      const docId = item.documentId ? item.documentId.toString() : null;
      return {
        _id: item._id.toString(),
        category: item.category,
        title: item.title,
        message: item.message,
        audience: item.audience,
        grade: item.grade,
        section: item.section,
        priority: item.priority || "normal",
        documentId: docId,
        fileName: item.fileName || "",
        mimeType: item.mimeType || "",
        fileUrl: docId ? `/api/documents/${docId}/file` : null,
        downloadUrl: docId ? `/api/documents/${docId}/file?download=1` : null,
        createdBy: item.createdBy || "Academic Coordinator",
        senderRole: item.senderRole || "coordinator",
        createdAt: item.createdAt,
        isRead,
      };
    });

    return NextResponse.json({
      success: true,
      notifications: formatted,
      unreadCount,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to load notifications." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin", "coordinator"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json(
      { error: "School workspace is not configured." },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const body = await req.json();
    const { title, message, audience, category, grade, priority } = body ?? {};

    if (
      typeof title !== "string" ||
      typeof message !== "string" ||
      !title.trim() ||
      !message.trim()
    ) {
      return NextResponse.json(
        { error: "Notification title and message are required." },
        { status: 400 }
      );
    }

    const cleanCategory: NotificationCategory = (
      VALID_CATEGORIES as readonly string[]
    ).includes(String(category))
      ? (category as NotificationCategory)
      : "announcement";

    const cleanAudience: NotificationAudience = (
      VALID_AUDIENCES as readonly string[]
    ).includes(String(audience))
      ? (audience as NotificationAudience)
      : "parents_students";

    const cleanPriority: "normal" | "urgent" =
      priority === "urgent" || cleanCategory === "urgent" ? "urgent" : "normal";

    const senderRole: "admin" | "coordinator" =
      session.role === "admin" ? "admin" : "coordinator";

    const created = await createCampusNotification({
      schoolId: session.schoolId,
      category: cleanCategory,
      title: title.trim(),
      message: message.trim(),
      audience: cleanAudience,
      grade:
        typeof grade === "string" && grade.trim()
          ? grade.trim().slice(0, 40)
          : "All Classes",
      priority: cleanPriority,
      createdBy:
        session.name ||
        (senderRole === "admin" ? "School Administrator" : "Academic Coordinator"),
      senderRole,
      senderUserId: session.id,
    });

    if (!created) {
      return NextResponse.json(
        { error: "Could not dispatch notification right now." },
        { status: 500 }
      );
    }

    const audienceText =
      cleanAudience === "all"
        ? "All Campus portals (including Admin)"
        : cleanAudience === "parents_students"
        ? senderRole === "coordinator"
          ? "Parents, Students & Admin"
          : "Parents & Students"
        : cleanAudience === "parents"
        ? senderRole === "coordinator"
          ? "Parents & Admin"
          : "Parents"
        : cleanAudience === "students"
        ? senderRole === "coordinator"
          ? "Students & Admin"
          : "Students"
        : senderRole === "coordinator"
        ? "Teachers & Admin"
        : "Teachers";

    return NextResponse.json(
      {
        success: true,
        message: `Notification sent to ${audienceText}.`,
        notification: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[NOTIFICATIONS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to send notification." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
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
    return NextResponse.json({ success: true });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { id, markAllRead } = body ?? {};
    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);

    if (markAllRead) {
      const query: Record<string, unknown> = { schoolId: schoolObjId };
      const allowedAudiences = getAllowedAudiencesForRole(session.role);
      if (allowedAudiences) {
        query.audience = { $in: allowedAudiences };
      }

      await CampusNotification.updateMany(query, {
        $addToSet: { readBy: session.id },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read.",
      });
    }

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Valid notification ID is required." },
        { status: 400 }
      );
    }

    await CampusNotification.updateOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        schoolId: schoolObjId,
      },
      { $addToSet: { readBy: session.id } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NOTIFICATIONS_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to update notification status." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(req, ["admin", "coordinator"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json(
      { error: "School workspace is not configured." },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid notification ID." },
        { status: 400 }
      );
    }

    const deleteFilter: Record<string, unknown> = {
      _id: new mongoose.Types.ObjectId(id),
      schoolId: new mongoose.Types.ObjectId(session.schoolId),
    };
    if (session.role === "coordinator") {
      deleteFilter.audience = { $ne: "admin" };
      deleteFilter.category = { $ne: "billing" };
    }

    await CampusNotification.deleteOne(deleteFilter);

    return NextResponse.json({
      success: true,
      message: "Notification removed.",
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to delete notification." },
      { status: 500 }
    );
  }
}
