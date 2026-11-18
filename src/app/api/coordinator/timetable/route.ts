import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { TimetableEntry } from "@/models/TimetableEntry";
import { requireAuth } from "@/lib/auth";
import { createCampusNotification } from "@/lib/notifications";

const VALID_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
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
    return NextResponse.json({ success: true, entries: [] });
  }

  try {
    await connectDB();
    const entries = await TimetableEntry.find({
      schoolId: new mongoose.Types.ObjectId(session.schoolId),
    })
      .sort({ grade: 1, section: 1, startTime: 1 })
      .lean();

    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error("[TIMETABLE_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load timetable entries." },
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
    const {
      grade,
      section,
      day,
      period,
      startTime,
      endTime,
      subject,
      teacherName,
      room,
    } = body ?? {};

    if (
      typeof grade !== "string" ||
      typeof day !== "string" ||
      typeof period !== "string" ||
      typeof startTime !== "string" ||
      typeof endTime !== "string" ||
      typeof subject !== "string" ||
      typeof teacherName !== "string" ||
      !grade.trim() ||
      !subject.trim() ||
      !teacherName.trim()
    ) {
      return NextResponse.json(
        { error: "Class, day, period, timing, subject, and teacher are required." },
        { status: 400 }
      );
    }

    if (!(VALID_DAYS as readonly string[]).includes(day)) {
      return NextResponse.json({ error: "Invalid day selected." }, { status: 400 });
    }

    const entry = await TimetableEntry.create({
      schoolId: new mongoose.Types.ObjectId(session.schoolId),
      grade: grade.trim().slice(0, 30),
      section:
        typeof section === "string" && section.trim()
          ? section.trim().slice(0, 40)
          : "A",
      day,
      period: period.trim().slice(0, 30),
      startTime: startTime.trim().slice(0, 20),
      endTime: endTime.trim().slice(0, 20),
      subject: subject.trim().slice(0, 80),
      teacherName: teacherName.trim().slice(0, 100),
      room:
        typeof room === "string" && room.trim()
          ? room.trim().slice(0, 40)
          : "Room 101",
      createdBy: session.name || "Academic Coordinator",
    });

    await createCampusNotification({
      schoolId: session.schoolId,
      category: "timetable",
      title: `Timetable Updated — ${entry.grade} (Sec ${entry.section})`,
      message: `${entry.day} • ${entry.period} (${entry.startTime}–${entry.endTime}): ${entry.subject} by ${entry.teacherName} in ${entry.room}.`,
      audience: "all",
      grade: entry.grade,
      section: entry.section,
      createdBy: session.name || "Academic Coordinator",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Timetable period scheduled successfully.",
        entry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[TIMETABLE_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to schedule timetable slot." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
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
    const {
      id,
      grade,
      section,
      day,
      period,
      startTime,
      endTime,
      subject,
      teacherName,
      room,
    } = body ?? {};

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid timetable slot ID." },
        { status: 400 }
      );
    }

    if (
      typeof grade !== "string" ||
      typeof day !== "string" ||
      typeof period !== "string" ||
      typeof startTime !== "string" ||
      typeof endTime !== "string" ||
      typeof subject !== "string" ||
      typeof teacherName !== "string" ||
      !grade.trim() ||
      !subject.trim() ||
      !teacherName.trim()
    ) {
      return NextResponse.json(
        { error: "Class, day, period, timing, subject, and teacher are required." },
        { status: 400 }
      );
    }

    if (!(VALID_DAYS as readonly string[]).includes(day)) {
      return NextResponse.json({ error: "Invalid day selected." }, { status: 400 });
    }

    const updated = await TimetableEntry.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        schoolId: new mongoose.Types.ObjectId(session.schoolId),
      },
      {
        $set: {
          grade: grade.trim().slice(0, 30),
          section:
            typeof section === "string" && section.trim()
              ? section.trim().slice(0, 40)
              : "A",
          day: day as (typeof VALID_DAYS)[number],
          period: period.trim().slice(0, 30),
          startTime: startTime.trim().slice(0, 20),
          endTime: endTime.trim().slice(0, 20),
          subject: subject.trim().slice(0, 80),
          teacherName: teacherName.trim().slice(0, 100),
          room:
            typeof room === "string" && room.trim()
              ? room.trim().slice(0, 40)
              : "Room 101",
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Timetable period not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Timetable period updated successfully.",
      entry: updated,
    });
  } catch (error) {
    console.error("[TIMETABLE_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update timetable slot." },
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
      return NextResponse.json({ error: "Invalid timetable slot ID." }, { status: 400 });
    }

    await TimetableEntry.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      schoolId: new mongoose.Types.ObjectId(session.schoolId),
    });

    return NextResponse.json({ success: true, message: "Timetable slot removed." });
  } catch (error) {
    console.error("[TIMETABLE_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to delete timetable slot." }, { status: 500 });
  }
}
