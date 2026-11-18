import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { LeaveRequest } from "@/models/LeaveRequest";
import { Student } from "@/models/Student";
import { CampusNotification } from "@/models/CampusNotification";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth(req, ["admin", "coordinator", "teacher", "parent"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ success: true, leaves: [] });
  }

  try {
    await connectDB();
    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
    const { searchParams } = new URL(req.url);
    const studentIdFilter = searchParams.get("studentId");

    const query: Record<string, unknown> = { schoolId: schoolObjId };

    if (session.role === "parent") {
      const validIds = (session.linkedStudentIds || [])
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (validIds.length === 0) {
        return NextResponse.json({ success: true, leaves: [] });
      }
      if (studentIdFilter && validIds.some((v) => v.toString() === studentIdFilter)) {
        query.studentId = new mongoose.Types.ObjectId(studentIdFilter);
      } else {
        query.studentId = { $in: validIds };
      }
    } else if (session.role === "teacher") {
      const assigned = Array.isArray(session.assignedClasses) ? session.assignedClasses : [];
      if (assigned.length === 0) {
        return NextResponse.json({ success: true, leaves: [] });
      }
      query.$or = assigned.map((ac) => ({
        grade: ac.grade,
        section: new RegExp(`^${ac.section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      }));
    } else if (studentIdFilter && mongoose.Types.ObjectId.isValid(studentIdFilter)) {
      query.studentId = new mongoose.Types.ObjectId(studentIdFilter);
    }

    const leaves = await LeaveRequest.find(query).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json({ success: true, leaves });
  } catch (error) {
    console.error("[LEAVES_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to load leave requests." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["parent"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ error: "School workspace not configured." }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { studentId, reason, leaveDate, notes } = body ?? {};

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: "Valid student selection is required." }, { status: 400 });
    }
    if (typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json({ error: "Please select a leave reason." }, { status: 400 });
    }
    if (typeof leaveDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(leaveDate.trim())) {
      return NextResponse.json({ error: "Please select a valid absence date." }, { status: 400 });
    }

    const allowedIds = session.linkedStudentIds || [];
    if (!allowedIds.includes(studentId)) {
      return NextResponse.json(
        { error: "You can only submit leave requests for your own linked children." },
        { status: 403 }
      );
    }

    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
    const student = await Student.findOne({ _id: studentId, schoolId: schoolObjId });
    if (!student) {
      return NextResponse.json({ error: "Student record not found." }, { status: 404 });
    }

    const created = await LeaveRequest.create({
      schoolId: schoolObjId,
      studentId: student._id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      grade: student.grade,
      section: student.section || "A",
      parentUserId: new mongoose.Types.ObjectId(session.id),
      parentName: session.name || student.guardianName || "Guardian",
      reason: reason.trim().slice(0, 120),
      leaveDate: leaveDate.trim(),
      notes: typeof notes === "string" ? notes.trim().slice(0, 500) : "",
      status: "pending",
    });

    // Notify Teachers & Admin via real Notification Bell
    await CampusNotification.create({
      schoolId: schoolObjId,
      category: "announcement",
      title: `Leave Notice: ${student.name} (${student.grade} - ${student.section})`,
      message: `${session.name || "Parent"} submitted a leave notice for ${student.name} (Roll #${student.rollNumber}) on ${leaveDate.trim()}. Reason: ${reason.trim()}.${notes?.trim() ? ` Note: ${notes.trim()}` : ""}`,
      audience: "teachers",
      grade: student.grade,
      section: student.section || "All Sections",
      priority: "normal",
      createdBy: session.name || "Guardian",
      senderRole: "coordinator",
    }).catch(() => null);

    return NextResponse.json({ success: true, leave: created }, { status: 201 });
  } catch (error) {
    console.error("[LEAVES_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to submit leave notice." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(req, ["admin", "coordinator", "teacher"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ error: "School workspace not configured." }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { id, status } = body ?? {};

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid leave request ID." }, { status: 400 });
    }
    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json({ error: "Status must be approved or rejected." }, { status: 400 });
    }

    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
    const leave = await LeaveRequest.findOne({ _id: id, schoolId: schoolObjId });
    if (!leave) {
      return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
    }

    // Teacher RBAC check
    if (session.role === "teacher") {
      const assigned = Array.isArray(session.assignedClasses) ? session.assignedClasses : [];
      const allowed = assigned.some(
        (ac) =>
          ac.grade === leave.grade &&
          ac.section.trim().toLowerCase() === (leave.section || "A").trim().toLowerCase()
      );
      if (!allowed) {
        return NextResponse.json(
          { error: "Access denied. This student is not in your assigned class/section." },
          { status: 403 }
        );
      }
    }

    leave.status = status;
    leave.reviewedBy = session.name || session.role;
    leave.reviewedAt = new Date();
    await leave.save();

    // Notify Parents via Notification Bell
    await CampusNotification.create({
      schoolId: schoolObjId,
      category: "announcement",
      title: `Leave ${status === "approved" ? "Approved" : "Declined"}: ${leave.studentName}`,
      message: `Your leave notice for ${leave.studentName} on ${leave.leaveDate} (${leave.reason}) has been ${status} by ${session.name || session.role}.`,
      audience: "parents",
      grade: leave.grade,
      section: leave.section || "All Sections",
      priority: "normal",
      createdBy: session.name || session.role,
      senderRole: session.role === "admin" ? "admin" : "coordinator",
    }).catch(() => null);

    return NextResponse.json({ success: true, leave });
  } catch (error) {
    console.error("[LEAVES_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Failed to update leave status." }, { status: 500 });
  }
}
