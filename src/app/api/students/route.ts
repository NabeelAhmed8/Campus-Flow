import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Student } from "@/models/Student";
import { Fee } from "@/models/Fee";
import { School } from "@/models/School";
import { buildTeacherClassFilter, requireSchoolAuth } from "@/lib/auth";
import crypto from "node:crypto";

export async function GET(req: Request) {
  const auth = await requireSchoolAuth(req, ["admin", "teacher", "student", "parent"], {
    emptyPayload: { success: true, students: [] },
  });
  if (auth.response) return auth.response;

  const { session, schoolObjId } = auth;

  try {
    await connectDB();

    // Students see only themselves; Parents see ALL of their own linked children
    if (session.role === "student" || session.role === "parent") {
      const validIds = (session.linkedStudentIds || [])
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (validIds.length === 0) {
        return NextResponse.json({ success: true, students: [] });
      }

      const linked = await Student.find({
        _id: { $in: session.role === "student" ? [validIds[0]] : validIds },
        schoolId: schoolObjId,
      }).sort({ createdAt: 1 });
      return NextResponse.json({ success: true, students: linked || [] });
    }

    // Recovery for any untagged students/fees saved before schema reload in single-school dev DB
    if (session.role === "admin") {
      const schoolCount = await School.countDocuments();
      if (schoolCount === 1) {
        const orphanFilter = {
          $or: [{ schoolId: { $exists: false } }, { schoolId: null }],
        };
        await Promise.all([
          Student.updateMany(orphanFilter, { $set: { schoolId: schoolObjId } }),
          Fee.updateMany(orphanFilter, { $set: { schoolId: schoolObjId } }),
        ]);
      }
    }

    // Teachers see ONLY students belonging to their Admin-assigned Class + Section(s)
    if (session.role === "teacher") {
      const classFilters = buildTeacherClassFilter(session.assignedClasses);
      if (classFilters.length === 0) {
        return NextResponse.json({
          success: true,
          students: [],
          assignedClasses: [],
        });
      }
      const students = await Student.find({
        schoolId: schoolObjId,
        $or: classFilters,
      }).sort({ createdAt: -1 });
      return NextResponse.json({
        success: true,
        students: students || [],
        assignedClasses: session.assignedClasses || [],
      });
    }

    // Admins see ALL students belonging to their own school
    const students = await Student.find({ schoolId: schoolObjId }).sort({
      createdAt: -1,
    });
    return NextResponse.json({ success: true, students: students || [] });
  } catch (error) {
    console.error("[STUDENTS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to retrieve student records." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireSchoolAuth(req, ["admin"], {
    errorStatus: 400,
    errorMessage: "School workspace is not initialized. Please sign in again.",
  });
  if (auth.response) return auth.response;

  const { session } = auth;

  try {
    await connectDB();
    const body = await req.json();
    const { name, grade, section, guardianName, guardianPhone, monthlyFee } =
      body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Student name is required." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim().slice(0, 100);
    const parsedFee =
      monthlyFee !== undefined && monthlyFee !== "" ? Number(monthlyFee) : 0;

    if (!Number.isFinite(parsedFee) || parsedFee <= 0 || parsedFee > 500000) {
      return NextResponse.json(
        {
          error:
            "Monthly tuition fee must be a valid amount between 1 and 500,000 PKR.",
        },
        { status: 400 }
      );
    }

    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
    const count = await Student.countDocuments({ schoolId: schoolObjId });
    const uniqueSuffix = crypto.randomBytes(2).toString("hex").toUpperCase();
    const rollNumber = `CF-${100 + count + 1}-${uniqueSuffix}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(
      count + 1
    ).padStart(3, "0")}-${uniqueSuffix}`;

    const newStudent = await Student.create({
      schoolId: schoolObjId,
      name: trimmedName,
      rollNumber,
      grade:
        typeof grade === "string" && grade.trim()
          ? grade.trim().slice(0, 30)
          : "Grade 9",
      section:
        typeof section === "string" && section.trim()
          ? section.trim().slice(0, 40)
          : "A",
      guardianName:
        typeof guardianName === "string" && guardianName.trim()
          ? guardianName.trim().slice(0, 100)
          : "Guardian",
      guardianEmail: `${rollNumber.toLowerCase()}@campusflow.edu`,
      guardianPhone:
        typeof guardianPhone === "string" && guardianPhone.trim()
          ? guardianPhone.trim().slice(0, 30)
          : "+92 300 0000000",
      status: "active",
      monthlyFee: Math.round(parsedFee),
    });

    // Auto-generate initial fee voucher scoped to this school
    const currentMonth = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date());

    await Fee.create({
      schoolId: schoolObjId,
      studentId: newStudent._id,
      studentName: newStudent.name,
      rollNumber: newStudent.rollNumber,
      grade: `${newStudent.grade} - ${newStudent.section}`,
      amount: newStudent.monthlyFee,
      month: currentMonth,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: "pending",
      invoiceNumber,
    });

    return NextResponse.json(
      { success: true, student: newStudent },
      { status: 201 }
    );
  } catch (error) {
    console.error("[STUDENTS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to enroll student. Please try again." },
      { status: 500 }
    );
  }
}
