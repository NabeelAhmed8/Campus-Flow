import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { TeacherAttendance } from "@/models/TeacherAttendance";
import { User } from "@/models/User";
import { isValidDateString, requireSchoolAuth } from "@/lib/auth";

const VALID_STATUSES = ["present", "absent", "late", "leave"] as const;

export async function GET(req: Request) {
  const auth = await requireSchoolAuth(req, ["admin", "coordinator"], {
    emptyPayload: { success: true, records: [] },
  });
  if (auth.response) return auth.response;

  const { schoolObjId } = auth;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    const query: Record<string, unknown> = { schoolId: schoolObjId };
    if (date) {
      if (!isValidDateString(date)) {
        return NextResponse.json(
          { error: "Invalid date format. Expected YYYY-MM-DD." },
          { status: 400 }
        );
      }
      query.date = date;
    }

    const records = await TeacherAttendance.find(query)
      .sort({ teacherName: 1, date: -1 })
      .lean();

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error("[TEACHER_ATTENDANCE_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load faculty attendance records." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireSchoolAuth(req, ["admin", "coordinator"]);
  if (auth.response) return auth.response;

  const { session, schoolObjId } = auth;

  try {
    await connectDB();
    const body = await req.json();
    const { date, records } = body ?? {};

    if (
      typeof date !== "string" ||
      !isValidDateString(date) ||
      !Array.isArray(records) ||
      records.length === 0
    ) {
      return NextResponse.json(
        { error: "Valid date (YYYY-MM-DD) and faculty attendance records are required." },
        { status: 400 }
      );
    }

    let savedCount = 0;

    for (const item of records) {
      if (
        !item ||
        typeof item.teacherId !== "string" ||
        !mongoose.Types.ObjectId.isValid(item.teacherId) ||
        typeof item.status !== "string" ||
        !(VALID_STATUSES as readonly string[]).includes(item.status)
      ) {
        continue;
      }

      const teacher = await User.findOne({
        _id: new mongoose.Types.ObjectId(item.teacherId),
        schoolId: schoolObjId,
        role: { $in: ["teacher", "coordinator"] },
      }).lean();

      if (!teacher) continue;

      await TeacherAttendance.findOneAndUpdate(
        {
          teacherId: new mongoose.Types.ObjectId(item.teacherId),
          date,
        },
        {
          $set: {
            schoolId: schoolObjId,
            teacherId: new mongoose.Types.ObjectId(item.teacherId),
            teacherName: teacher.name,
            teacherEmail: teacher.email,
            subject: teacher.extraField || "General Faculty",
            date,
            status: item.status,
            substituteTeacher:
              typeof item.substituteTeacher === "string"
                ? item.substituteTeacher.trim().slice(0, 100)
                : "",
            remarks:
              typeof item.remarks === "string"
                ? item.remarks.trim().slice(0, 200)
                : "",
            markedBy: session.name || "Academic Coordinator",
          },
        },
        { upsert: true, new: true }
      );

      savedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Faculty attendance for ${savedCount} staff ${
        savedCount === 1 ? "member" : "members"
      } recorded for ${date}.`,
      count: savedCount,
    });
  } catch (error) {
    console.error("[TEACHER_ATTENDANCE_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to save faculty attendance records." },
      { status: 500 }
    );
  }
}
