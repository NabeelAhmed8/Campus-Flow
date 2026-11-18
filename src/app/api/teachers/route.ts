import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth(req, ["admin", "coordinator"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ success: true, teachers: [] });
  }

  try {
    await connectDB();
    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);

    // Return both regular teachers and promoted coordinators in this school
    const faculty = await User.find({
      role: { $in: ["teacher", "coordinator"] },
      schoolId: schoolObjId,
    })
      .select("_id name email role extraField assignedClasses createdAt")
      .sort({ role: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      teachers: faculty.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        email: t.email,
        role: t.role,
        subject: t.extraField || "General Faculty",
        assignedClasses: Array.isArray(t.assignedClasses) ? t.assignedClasses : [],
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("[TEACHERS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load faculty roster." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json(
      { error: "School workspace is not configured." },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const body = await req.json();
    const { teacherId, assignedClasses, role } = body ?? {};

    if (
      typeof teacherId !== "string" ||
      !mongoose.Types.ObjectId.isValid(teacherId)
    ) {
      return NextResponse.json(
        { error: "Valid teacherId is required." },
        { status: 400 }
      );
    }

    const updateSet: Record<string, unknown> = {};

    // Option 1: Promote Teacher -> Coordinator or Demote Coordinator -> Teacher
    if (role !== undefined) {
      if (role !== "teacher" && role !== "coordinator") {
        return NextResponse.json(
          { error: "Faculty role can only be set to 'teacher' or 'coordinator'." },
          { status: 400 }
        );
      }
      updateSet.role = role;
    }

    // Option 2: Update assigned Class + Section list
    if (Array.isArray(assignedClasses)) {
      const seen = new Set<string>();
      const cleanAssignments: Array<{ grade: string; section: string }> = [];

      for (const item of assignedClasses) {
        if (
          !item ||
          typeof item.grade !== "string" ||
          typeof item.section !== "string"
        ) {
          continue;
        }
        const grade = item.grade.trim().slice(0, 30);
        const section = item.section.trim().slice(0, 40);
        if (!grade || !section) continue;

        const key = `${grade.toLowerCase()}::${section.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        cleanAssignments.push({ grade, section });
      }
      updateSet.assignedClasses = cleanAssignments;
    }

    if (Object.keys(updateSet).length === 0) {
      return NextResponse.json(
        { error: "No valid changes provided." },
        { status: 400 }
      );
    }

    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);

    const updatedTeacher = await User.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(teacherId),
        role: { $in: ["teacher", "coordinator"] },
        schoolId: schoolObjId,
      },
      { $set: updateSet },
      { new: true }
    )
      .select("_id name email role extraField assignedClasses createdAt")
      .lean();

    if (!updatedTeacher) {
      return NextResponse.json(
        { error: "Faculty member not found in your school." },
        { status: 404 }
      );
    }

    const msg =
      role === "coordinator"
        ? `${updatedTeacher.name} has been promoted to Academic Coordinator.`
        : role === "teacher"
          ? `${updatedTeacher.name}'s role has been updated to Faculty Teacher.`
          : `Updated class & section permissions for ${updatedTeacher.name}.`;

    return NextResponse.json({
      success: true,
      message: msg,
      teacher: {
        id: updatedTeacher._id.toString(),
        name: updatedTeacher.name,
        email: updatedTeacher.email,
        role: updatedTeacher.role,
        subject: updatedTeacher.extraField || "General Faculty",
        assignedClasses: updatedTeacher.assignedClasses || [],
        createdAt: updatedTeacher.createdAt,
      },
    });
  } catch (error) {
    console.error("[TEACHERS_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to update faculty member settings." },
      { status: 500 }
    );
  }
}
