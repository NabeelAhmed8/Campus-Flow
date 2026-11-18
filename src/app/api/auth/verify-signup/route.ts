import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { EmailVerification } from "@/models/EmailVerification";
import { createSchoolForAdmin } from "@/lib/school";
import {
  attachSessionCookie,
  createSessionToken,
  isValidEmail,
  isValidRole,
  PortalRole,
  verifyOtpCode,
} from "@/lib/auth";

const ROLE_DASHBOARDS: Record<PortalRole, string> = {
  admin: "/admin",
  coordinator: "/coordinator",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

const MAX_VERIFICATION_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, code } = body ?? {};

    if (
      typeof email !== "string" ||
      typeof code !== "string" ||
      !email.trim() ||
      !code.trim()
    ) {
      return NextResponse.json(
        { error: "Email address and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = code.replace(/\s+/g, "").trim();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json(
        { error: "Verification code must be a 6-digit number." },
        { status: 400 }
      );
    }

    const verification = await EmailVerification.findOne({
      email: normalizedEmail,
    });

    if (!verification) {
      return NextResponse.json(
        {
          error:
            "Verification session expired or not found. Please request a new verification code.",
        },
        { status: 404 }
      );
    }

    if (new Date(verification.expiresAt).getTime() <= Date.now()) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 410 }
      );
    }

    if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return NextResponse.json(
        {
          error:
            "Too many incorrect verification attempts. Please request a new verification code.",
        },
        { status: 429 }
      );
    }

    const isMatch = verifyOtpCode(
      normalizedEmail,
      cleanCode,
      verification.codeHash
    );

    if (!isMatch) {
      const nextAttempts = verification.attempts + 1;
      const remaining = MAX_VERIFICATION_ATTEMPTS - nextAttempts;

      if (remaining <= 0) {
        await EmailVerification.deleteOne({ _id: verification._id });
        return NextResponse.json(
          {
            error:
              "Maximum verification attempts reached. Please request a new code.",
          },
          { status: 429 }
        );
      }

      verification.attempts = nextAttempts;
      await verification.save();

      return NextResponse.json(
        {
          error: `Invalid verification code. You have ${remaining} ${
            remaining === 1 ? "attempt" : "attempts"
          } remaining.`,
        },
        { status: 400 }
      );
    }

    // Re-check uniqueness before creating account
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    const pending = verification.pendingUser;
    if (!pending || !isValidRole(pending.role)) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return NextResponse.json(
        { error: "Invalid registration session. Please start signup again." },
        { status: 400 }
      );
    }

    const linkedIdsObj = Array.isArray(pending.linkedStudentIds)
      ? pending.linkedStudentIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id))
      : pending.linkedStudentId &&
        mongoose.Types.ObjectId.isValid(pending.linkedStudentId)
      ? [new mongoose.Types.ObjectId(pending.linkedStudentId)]
      : [];

    // Create verified user account
    const user = await User.create({
      name: pending.name,
      email: normalizedEmail,
      password: pending.passwordHash,
      role: pending.role,
      institution: pending.institution || "St. Jude Collegiate Academy",
      extraField: pending.extraField,
      schoolId:
        pending.schoolId && mongoose.Types.ObjectId.isValid(pending.schoolId)
          ? new mongoose.Types.ObjectId(pending.schoolId)
          : undefined,
      schoolCode: pending.schoolCode,
      linkedStudentId: linkedIdsObj[0],
      linkedStudentIds: linkedIdsObj,
    });

    // If Admin signup, provision a dedicated School tenant + unique School Join Code
    let schoolIdStr = user.schoolId?.toString();
    let schoolCodeStr = user.schoolCode;

    if (pending.role === "admin") {
      const createdSchool = await createSchoolForAdmin({
        institutionName: user.institution || "St. Jude Collegiate Academy",
        ownerId: user._id as mongoose.Types.ObjectId,
      });
      user.schoolId = createdSchool.schoolId;
      user.schoolCode = createdSchool.schoolCode;
      await user.save();
      schoolIdStr = createdSchool.schoolId.toString();
      schoolCodeStr = createdSchool.schoolCode;
    }

    // Consume single-use verification token immediately
    await EmailVerification.deleteOne({ _id: verification._id });

    const sessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: pending.role,
      institution: user.institution || "St. Jude Collegiate Academy",
      schoolId: schoolIdStr,
      schoolCode: schoolCodeStr,
      linkedStudentId: user.linkedStudentId?.toString(),
    };

    const token = await createSessionToken(sessionUser);
    const redirectPath = ROLE_DASHBOARDS[pending.role];

    const response = NextResponse.json(
      {
        success: true,
        message: "Email verified and account created successfully.",
        redirectPath,
        user: {
          ...sessionUser,
          extraField: user.extraField,
        },
      },
      { status: 201 }
    );

    attachSessionCookie(response, token);
    return response;
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }
    console.error("[AUTH_VERIFY_SIGNUP_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to verify code and complete signup. Please try again." },
      { status: 500 }
    );
  }
}
