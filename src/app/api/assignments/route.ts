import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Assignment } from "@/models/Assignment";
import { Student } from "@/models/Student";
import { CampusNotification } from "@/models/CampusNotification";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth(req, ["admin", "coordinator", "teacher", "student", "parent"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ success: true, assignments: [] });
  }

  try {
    await connectDB();
    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get("studentId");

    if (session.role === "student" || session.role === "parent") {
      const validIds = (session.linkedStudentIds || []).filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
      if (validIds.length === 0) {
        return NextResponse.json({ success: true, assignments: [] });
      }
      const targetStudentId =
        studentIdParam && validIds.includes(studentIdParam) ? studentIdParam : validIds[0];
      const student = await Student.findOne({ _id: targetStudentId, schoolId: schoolObjId });
      if (!student) {
        return NextResponse.json({ success: true, assignments: [] });
      }

      const secRegex = new RegExp(
        `^(${(student.section || "A").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|all|all sections)$`,
        "i"
      );
      const raw = await Assignment.find({
        schoolId: schoolObjId,
        grade: student.grade,
        section: secRegex,
      })
        .sort({ createdAt: -1 })
        .limit(100);

      const assignments = raw.map((a) => {
        const sub = a.submissions.find((s) => s.studentId.toString() === student._id.toString());
        return {
          id: a._id.toString(),
          title: a.title,
          subject: a.subject,
          description: a.description,
          grade: a.grade,
          section: a.section,
          dueDate: a.dueDate,
          points: a.points,
          teacher: a.teacherName,
          status: sub ? "submitted" : "pending",
          submittedAt: sub?.submittedAt || null,
          note: sub?.note || "",
        };
      });

      return NextResponse.json({ success: true, assignments });
    }

    // Teacher / Admin / Coordinator view
    const query: Record<string, unknown> = { schoolId: schoolObjId };
    if (session.role === "teacher") {
      const assigned = Array.isArray(session.assignedClasses) ? session.assignedClasses : [];
      if (assigned.length === 0) {
        query.teacherId = new mongoose.Types.ObjectId(session.id);
      } else {
        query.$or = [
          { teacherId: new mongoose.Types.ObjectId(session.id) },
          ...assigned.map((ac) => ({ grade: ac.grade })),
        ];
      }
    }

    const raw = await Assignment.find(query).sort({ createdAt: -1 }).limit(100);
    const assignments = raw.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      subject: a.subject,
      description: a.description,
      grade: a.grade,
      section: a.section,
      dueDate: a.dueDate,
      points: a.points,
      teacher: a.teacherName,
      submissionsCount: a.submissions.length,
      submissions: a.submissions,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error("[ASSIGNMENTS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to load assignments." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin", "teacher"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ error: "School workspace not configured." }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { title, subject, description, grade, section, dueDate, points } = body ?? {};

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Assignment title is required." }, { status: 400 });
    }
    if (typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }
    if (typeof grade !== "string" || !grade.trim()) {
      return NextResponse.json({ error: "Class / Grade is required." }, { status: 400 });
    }
    if (typeof dueDate !== "string" || !dueDate.trim()) {
      return NextResponse.json({ error: "Due date is required." }, { status: 400 });
    }

    const cleanSection =
      typeof section === "string" && section.trim() ? section.trim().slice(0, 30) : "All";

    // Teacher RBAC check
    if (session.role === "teacher") {
      const assigned = Array.isArray(session.assignedClasses) ? session.assignedClasses : [];
      const hasGrade = assigned.some((ac) => ac.grade === grade.trim());
      if (!hasGrade) {
        return NextResponse.json(
          { error: "You can only assign homework to your assigned classes." },
          { status: 403 }
        );
      }
    }

    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
    const created = await Assignment.create({
      schoolId: schoolObjId,
      title: title.trim().slice(0, 160),
      subject: subject.trim().slice(0, 80),
      description: typeof description === "string" ? description.trim().slice(0, 800) : "",
      grade: grade.trim(),
      section: cleanSection,
      dueDate: dueDate.trim(),
      points: Math.min(500, Math.max(1, Number(points) || 25)),
      teacherId: new mongoose.Types.ObjectId(session.id),
      teacherName: session.name || "Faculty Instructor",
      submissions: [],
    });

    await CampusNotification.create({
      schoolId: schoolObjId,
      category: "announcement",
      title: `New Homework (${subject.trim()}): ${title.trim()}`,
      message: `${session.name || "Teacher"} assigned "${title.trim()}" for ${grade.trim()} (${cleanSection === "All" ? "All Sections" : `Section ${cleanSection}`}). Due Date: ${dueDate.trim()}. Max Points: ${created.points}.`,
      audience: "parents_students",
      grade: grade.trim(),
      section: cleanSection === "All" ? "All Sections" : cleanSection,
      priority: "normal",
      createdBy: session.name || "Faculty Instructor",
      senderRole: session.role === "admin" ? "admin" : "coordinator",
    }).catch(() => null);

    return NextResponse.json({ success: true, assignment: created }, { status: 201 });
  } catch (error) {
    console.error("[ASSIGNMENTS_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to create assignment." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(req, ["student"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ error: "School workspace not configured." }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { assignmentId, action, note } = body ?? {};

    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      return NextResponse.json({ error: "Invalid assignment ID." }, { status: 400 });
    }

    const validIds = (session.linkedStudentIds || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    if (validIds.length === 0) {
      return NextResponse.json({ error: "No linked student profile found." }, { status: 403 });
    }

    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
    const [student, assignment] = await Promise.all([
      Student.findOne({ _id: validIds[0], schoolId: schoolObjId }),
      Assignment.findOne({ _id: assignmentId, schoolId: schoolObjId }),
    ]);

    if (!student || !assignment) {
      return NextResponse.json({ error: "Assignment or student record not found." }, { status: 404 });
    }

    const existingIdx = assignment.submissions.findIndex(
      (s) => s.studentId.toString() === student._id.toString()
    );

    let nextStatus: "submitted" | "pending";
    if (action === "unsubmit" || (action !== "submit" && existingIdx !== -1)) {
      if (existingIdx !== -1) {
        assignment.submissions.splice(existingIdx, 1);
      }
      nextStatus = "pending";
    } else {
      if (existingIdx === -1) {
        assignment.submissions.push({
          studentId: student._id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          status: "submitted",
          submittedAt: new Date(),
          note: typeof note === "string" ? note.trim().slice(0, 300) : "",
        });
      }
      nextStatus = "submitted";
    }

    await assignment.save();
    return NextResponse.json({ success: true, status: nextStatus });
  } catch (error) {
    console.error("[ASSIGNMENTS_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Failed to update submission." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(req, ["admin", "teacher"]);
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
      return NextResponse.json({ error: "Invalid assignment ID." }, { status: 400 });
    }

    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
    const filter: Record<string, unknown> = { _id: id, schoolId: schoolObjId };
    if (session.role === "teacher") {
      filter.teacherId = new mongoose.Types.ObjectId(session.id);
    }

    const deleted = await Assignment.findOneAndDelete(filter);
    if (!deleted) {
      return NextResponse.json({ error: "Assignment not found or unauthorized." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ASSIGNMENTS_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to delete assignment." }, { status: 500 });
  }
}
