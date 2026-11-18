import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Student } from "@/models/Student";
import { User } from "@/models/User";
import { requireSchoolAuth } from "@/lib/auth";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req: Request) {
  const auth = await requireSchoolAuth(req, ["parent"], {
    errorStatus: 400,
    errorMessage: "Your account is not connected to a school workspace.",
  });
  if (auth.response) return auth.response;

  const { session, schoolObjId } = auth;

  try {
    await connectDB();
    const body = await req.json();
    const { rollNumber } = body ?? {};

    if (typeof rollNumber !== "string" || !rollNumber.trim()) {
      return NextResponse.json(
        { error: "Please enter your child's enrolled Student Roll Number." },
        { status: 400 }
      );
    }

    const cleanRoll = rollNumber.trim();

    const matchedStudent = await Student.findOne({
      schoolId: schoolObjId,
      rollNumber: { $regex: new RegExp(`^${escapeRegex(cleanRoll)}$`, "i") },
    }).lean();

    if (!matchedStudent) {
      return NextResponse.json(
        {
          error: `No enrolled student with Roll Number "${cleanRoll}" was found in ${session.institution}. Please verify the roll number with your school administrator.`,
        },
        { status: 404 }
      );
    }

    const existingLinked = session.linkedStudentIds || [];
    if (existingLinked.includes(matchedStudent._id.toString())) {
      return NextResponse.json(
        {
          error: `${matchedStudent.name} (${matchedStudent.rollNumber}) is already linked to your guardian account.`,
        },
        { status: 409 }
      );
    }

    const allIds = Array.from(
      new Set([...existingLinked, matchedStudent._id.toString()])
    ).map((id) => new mongoose.Types.ObjectId(id));

    await User.updateOne(
      { _id: new mongoose.Types.ObjectId(session.id) },
      {
        $set: {
          linkedStudentId: allIds[0],
          linkedStudentIds: allIds,
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: `${matchedStudent.name} (${matchedStudent.rollNumber}) has been linked to your guardian portal.`,
        student: matchedStudent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PARENT_LINK_CHILD_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to link child right now. Please try again." },
      { status: 500 }
    );
  }
}
