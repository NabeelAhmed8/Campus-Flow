import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/models/Attendance";
import { Student } from "@/models/Student";
import mongoose from "mongoose";
import {
  buildTeacherClassFilter,
  isStudentInTeacherScope,
  isValidDateString,
  requireAuth,
} from "@/lib/auth";

const VALID_ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const;

export async function GET(req: Request) {
  const auth = await requireAuth(req, ["admin", "teacher", "student", "parent"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({
      success: true,
      records: [],
      stats: { total: 0, present: 0, absent: 0, late: 0, excused: 0, attendancePercentage: 100 },
    });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const studentId = searchParams.get("studentId");
    const grade = searchParams.get("grade");

    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
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

    // Students & Parents are strictly locked to their own linked student record(s)
    if (session.role === "student" || session.role === "parent") {
      const allowedIds = (session.linkedStudentIds || []).filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );

      if (allowedIds.length === 0) {
        return NextResponse.json({
          success: true,
          records: [],
          stats: { total: 0, present: 0, absent: 0, late: 0, excused: 0, attendancePercentage: 100 },
        });
      }

      if (session.role === "parent" && studentId) {
        if (!allowedIds.includes(studentId)) {
          return NextResponse.json(
            { error: "Access denied. You may only view attendance for your linked children." },
            { status: 403 }
          );
        }
        query.studentId = new mongoose.Types.ObjectId(studentId);
      } else if (session.role === "student") {
        query.studentId = new mongoose.Types.ObjectId(allowedIds[0]);
      } else {
        query.studentId = {
          $in: allowedIds.map((id) => new mongoose.Types.ObjectId(id)),
        };
      }
    } else if (session.role === "teacher") {
      const classFilters = buildTeacherClassFilter(session.assignedClasses);
      if (classFilters.length === 0) {
        return NextResponse.json({
          success: true,
          records: [],
          stats: { total: 0, present: 0, absent: 0, late: 0, excused: 0, attendancePercentage: 100 },
        });
      }
      query.$or = classFilters;
      if (studentId) {
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
          return NextResponse.json(
            { error: "Invalid student identifier." },
            { status: 400 }
          );
        }
        query.studentId = new mongoose.Types.ObjectId(studentId);
      }
    } else if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return NextResponse.json(
          { error: "Invalid student identifier." },
          { status: 400 }
        );
      }
      query.studentId = new mongoose.Types.ObjectId(studentId);
    }

    if (grade && grade !== "all") query.grade = grade;

    const records = await Attendance.find(query)
      .sort({ rollNumber: 1, createdAt: -1 })
      .lean();

    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;
    const excused = records.filter((r) => r.status === "excused").length;
    const attendancePercentage =
      total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;

    return NextResponse.json({
      success: true,
      records,
      stats: {
        total,
        present,
        absent,
        late,
        excused,
        attendancePercentage,
      },
    });
  } catch (error) {
    console.error("[ATTENDANCE_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to retrieve attendance records." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin", "teacher"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json(
      { error: "School workspace is not configured for this account." },
      { status: 403 }
    );
  }

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
        {
          error:
            "A valid date (YYYY-MM-DD) and at least one attendance record are required.",
        },
        { status: 400 }
      );
    }

    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
    const teacher = session.name || "Faculty Educator";

    let updatedCount = 0;

    for (const item of records) {
      if (
        !item ||
        typeof item.studentId !== "string" ||
        !mongoose.Types.ObjectId.isValid(item.studentId) ||
        typeof item.status !== "string" ||
        !(VALID_ATTENDANCE_STATUSES as readonly string[]).includes(item.status)
      ) {
        continue;
      }

      // Only allow marking attendance for students belonging to the teacher's school & assigned sections
      const student = await Student.findOne({
        _id: new mongoose.Types.ObjectId(item.studentId),
        schoolId: schoolObjId,
      }).lean();
      if (!student) continue;

      if (
        session.role === "teacher" &&
        !isStudentInTeacherScope(student, session.assignedClasses)
      ) {
        continue;
      }

      await Attendance.findOneAndUpdate(
        {
          studentId: new mongoose.Types.ObjectId(item.studentId),
          date,
        },
        {
          $set: {
            schoolId: schoolObjId,
            studentId: new mongoose.Types.ObjectId(item.studentId),
            studentName: student.name,
            rollNumber: student.rollNumber,
            grade: student.grade,
            section: student.section,
            date,
            status: item.status,
            remarks:
              typeof item.remarks === "string"
                ? item.remarks.trim().slice(0, 200)
                : "",
            teacherName: teacher,
          },
        },
        { upsert: true, new: true }
      );

      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Daily attendance for ${updatedCount} students successfully recorded for ${date}.`,
      count: updatedCount,
    });
  } catch (error) {
    console.error("[ATTENDANCE_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to record student attendance." },
      { status: 500 }
    );
  }
}
