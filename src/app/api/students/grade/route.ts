import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Student, ExamTerm, ExamAttendanceStatus, ExamResultStatus } from "@/models/Student";
import { buildTeacherClassFilter, isStudentInTeacherScope, requireAuth } from "@/lib/auth";

const VALID_TERMS: readonly ExamTerm[] = [
  "first_term",
  "mid_term",
  "final_term",
  "class_test",
];

const TERM_LABELS: Record<ExamTerm, string> = {
  first_term: "First Term Exam",
  mid_term: "2nd / Mid-Term Exam",
  final_term: "Final Term Exam",
  class_test: "Class Test / Assessment",
};

const PASSING_PERCENTAGE = 40;

export async function GET(req: Request) {
  const auth = await requireAuth(req, ["admin", "teacher", "student", "parent"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ success: true, records: [] });
  }

  try {
    await connectDB();
    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
    const query: Record<string, unknown> = { schoolId: schoolObjId };

    if (session.role === "student" || session.role === "parent") {
      const validIds = (session.linkedStudentIds || [])
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (validIds.length === 0) {
        return NextResponse.json({ success: true, records: [] });
      }
      query._id = {
        $in: session.role === "student" ? [validIds[0]] : validIds,
      };
    }

    if (session.role === "teacher") {
      const classFilters = buildTeacherClassFilter(session.assignedClasses);
      if (classFilters.length === 0) {
        return NextResponse.json({ success: true, records: [] });
      }
      query.$or = classFilters;
    }

    const students: any[] = await Student.find(query).lean().sort({ createdAt: -1 });

    // Flatten records for easy display
    const allRecords: any[] = [];
    students.forEach((st: any) => {
      if (Array.isArray(st.academicRecords)) {
        st.academicRecords.forEach((rec: any) => {
          const examStatus: ExamAttendanceStatus =
            rec.examStatus === "absent" ? "absent" : "present";
          const pct = Number(rec.percentage || 0);
          const resultStatus: ExamResultStatus =
            rec.resultStatus ||
            (examStatus === "absent"
              ? "absent"
              : pct >= PASSING_PERCENTAGE
              ? "pass"
              : "fail");

          allRecords.push({
            ...rec,
            term: rec.term || "first_term",
            examStatus,
            resultStatus,
            studentId: st._id?.toString() || "",
            studentName: st.name,
            rollNumber: st.rollNumber,
            classSection: `${st.grade} - ${st.section}`,
          });
        });
      }
    });

    allRecords.sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );

    return NextResponse.json({ success: true, records: allRecords });
  } catch (error) {
    console.error("[GRADES_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch student grades." },
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
    const {
      studentId,
      term,
      subject,
      assessment,
      examStatus,
      totalMarks,
      obtainedMarks,
      feedback,
      teacherName,
    } = body ?? {};

    if (
      typeof studentId !== "string" ||
      typeof subject !== "string" ||
      !studentId.trim() ||
      !subject.trim() ||
      totalMarks === undefined
    ) {
      return NextResponse.json(
        {
          error: "Student, subject, and total marks are required.",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { error: "Invalid student identifier." },
        { status: 400 }
      );
    }

    const normalizedTerm: ExamTerm =
      typeof term === "string" && (VALID_TERMS as readonly string[]).includes(term)
        ? (term as ExamTerm)
        : "first_term";

    const normalizedExamStatus: ExamAttendanceStatus =
      examStatus === "absent" ? "absent" : "present";

    const total = Number(totalMarks);
    if (!Number.isFinite(total) || total <= 0 || total > 10000) {
      return NextResponse.json(
        { error: "Total marks must be a valid number greater than zero." },
        { status: 400 }
      );
    }

    let obtained = 0;
    let percentage = 0;
    let grade = "AB";
    let resultStatus: ExamResultStatus = "absent";

    if (normalizedExamStatus === "present") {
      if (obtainedMarks === undefined || obtainedMarks === "") {
        return NextResponse.json(
          { error: "Obtained marks are required when the student is present for the exam." },
          { status: 400 }
        );
      }
      obtained = Number(obtainedMarks);
      if (!Number.isFinite(obtained) || obtained < 0 || obtained > total) {
        return NextResponse.json(
          { error: "Obtained marks must be between 0 and total marks." },
          { status: 400 }
        );
      }

      percentage = Math.round((obtained / total) * 100);
      grade =
        percentage >= 90
          ? "A+"
          : percentage >= 80
          ? "A"
          : percentage >= 70
          ? "B+"
          : percentage >= 60
          ? "B"
          : percentage >= 50
          ? "C"
          : percentage >= 40
          ? "D"
          : "F";
      resultStatus = percentage >= PASSING_PERCENTAGE ? "pass" : "fail";
    }

    const cleanAssessment =
      typeof assessment === "string" && assessment.trim()
        ? assessment.trim().slice(0, 120)
        : TERM_LABELS[normalizedTerm];

    const newRecord = {
      id: `GRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      term: normalizedTerm,
      subject: subject.trim().slice(0, 80),
      assessment: cleanAssessment,
      examStatus: normalizedExamStatus,
      totalMarks: total,
      obtainedMarks: obtained,
      percentage,
      grade,
      resultStatus,
      feedback:
        typeof feedback === "string" && feedback.trim()
          ? feedback.trim().slice(0, 600)
          : normalizedExamStatus === "absent"
          ? "Student was absent for this subject examination."
          : resultStatus === "pass"
          ? "Good performance in this examination cycle."
          : "Needs focused improvement to meet the 40% passing standard.",
      teacherName:
        typeof teacherName === "string" && teacherName.trim()
          ? teacherName.trim().slice(0, 100)
          : session.name || "Faculty Instructor",
      recordedAt: new Date(),
    };

    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
    const studentObjId = new mongoose.Types.ObjectId(studentId);

    // Replace existing record for same (term + subject) if updating a term exam, or append new
    const studentDoc = await Student.findOne({
      _id: studentObjId,
      schoolId: schoolObjId,
    });

    if (!studentDoc) {
      return NextResponse.json(
        { error: "Student record not found in your school." },
        { status: 404 }
      );
    }

    // Enforce teacher section-level RBAC on write
    if (
      session.role === "teacher" &&
      !isStudentInTeacherScope(studentDoc, session.assignedClasses)
    ) {
      return NextResponse.json(
        {
          error: `Access denied. You are not assigned to teach ${studentDoc.grade} - Section ${studentDoc.section}.`,
        },
        { status: 403 }
      );
    }

    if (!Array.isArray(studentDoc.academicRecords)) {
      studentDoc.academicRecords = [];
    }

    if (normalizedTerm !== "class_test") {
      const existingIdx = studentDoc.academicRecords.findIndex(
        (r) =>
          (r.term || "first_term") === normalizedTerm &&
          r.subject.toLowerCase() === newRecord.subject.toLowerCase()
      );
      if (existingIdx !== -1) {
        studentDoc.academicRecords[existingIdx] = newRecord;
      } else {
        studentDoc.academicRecords.push(newRecord);
      }
    } else {
      studentDoc.academicRecords.push(newRecord);
    }

    await studentDoc.save();

    return NextResponse.json(
      {
        success: true,
        message:
          normalizedExamStatus === "absent"
            ? `${newRecord.subject} (${TERM_LABELS[normalizedTerm]}) marked as Absent for ${studentDoc.name}.`
            : `${newRecord.subject} (${TERM_LABELS[normalizedTerm]}) marks saved for ${studentDoc.name}.`,
        record: {
          ...newRecord,
          studentId: studentDoc._id.toString(),
          studentName: studentDoc.name,
          rollNumber: studentDoc.rollNumber,
          classSection: `${studentDoc.grade} - ${studentDoc.section}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[GRADES_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to save student grade record." },
      { status: 500 }
    );
  }
}
