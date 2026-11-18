import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ensureAdminSchool } from "@/lib/school";
import {
  attachSessionCookie,
  createSessionToken,
  hashPassword,
  isValidEmail,
  isValidRole,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password, role } = body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password.trim()
    ) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Authenticate user against institutional records
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { error: "No registered account found with this email address. Please sign up first." },
        { status: 404 }
      );
    }

    // Verify password with timing-safe salted scrypt check (and auto-upgrade legacy hashes)
    const { valid, needsRehash } = verifyPassword(password, user.password || "");
    if (!valid) {
      return NextResponse.json(
        { error: "Incorrect password. Please verify your credentials." },
        { status: 401 }
      );
    }

    // Verify role boundary
    const requestedRole = typeof role === "string" ? role.toLowerCase().trim() : "";
    if (requestedRole && user.role !== requestedRole) {
      return NextResponse.json(
        {
          error: `This account is registered as '${user.role.toUpperCase()}'. Please select the ${user.role.toUpperCase()} portal to sign in.`,
        },
        { status: 403 }
      );
    }

    if (!isValidRole(user.role)) {
      return NextResponse.json(
        { error: "Account role configuration is invalid. Please contact an administrator." },
        { status: 403 }
      );
    }

    // Transparently upgrade legacy SHA-256 hash to salted scrypt
    if (needsRehash) {
      user.password = hashPassword(password);
      await user.save();
    }

    // Ensure legacy Admin accounts have a provisioned School & Join Code
    let schoolId = user.schoolId?.toString();
    let schoolCode = user.schoolCode;
    if (user.role === "admin" && (!schoolId || !schoolCode)) {
      const ensured = await ensureAdminSchool({
        _id: user._id as mongoose.Types.ObjectId,
        role: user.role,
        institution: user.institution,
        schoolId: user.schoolId as mongoose.Types.ObjectId | undefined,
        schoolCode: user.schoolCode,
      });
      schoolId = ensured.schoolId;
      schoolCode = ensured.schoolCode;
    }

    const sessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution || "St. Jude Collegiate Academy",
      schoolId,
      schoolCode,
      linkedStudentId: user.linkedStudentId?.toString(),
    };

    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({
      success: true,
      message: "Authentication successful.",
      user: {
        ...sessionUser,
        extraField: user.extraField,
      },
    });

    attachSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("[AUTH_LOGIN_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to complete authentication. Please try again." },
      { status: 500 }
    );
  }
}
