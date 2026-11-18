import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { School } from "@/models/School";
import { Student } from "@/models/Student";
import { EmailVerification } from "@/models/EmailVerification";
import {
  generateOtpCode,
  hashOtpCode,
  hashPassword,
  isValidEmail,
  isValidRole,
  PortalRole,
} from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mailer";

const ROLE_TITLES: Record<PortalRole, string> = {
  admin: "Admin Hub",
  coordinator: "Coordinator Desk",
  teacher: "Teacher Suite",
  student: "Student Portal",
  parent: "Parent Portal",
};

const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_RESENDS_PER_WINDOW = 6;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      institution,
      extraField,
      schoolCode,
      rollNumber,
    } = body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !role.trim()
    ) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 2 and 100 characters." },
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

    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 6 and 128 characters long." },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match. Please verify both fields." },
        { status: 400 }
      );
    }

    const normalizedRole = role.toLowerCase().trim();
    if (!isValidRole(normalizedRole) || normalizedRole === "coordinator") {
      return NextResponse.json(
        {
          error:
            normalizedRole === "coordinator"
              ? "Coordinators are promoted internally by the school administrator from registered teachers."
              : "Invalid portal role selected.",
        },
        { status: 400 }
      );
    }

    // Ensure email is not already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Multi-Tenant School & Student Linking Validation
    let resolvedInstitution =
      typeof institution === "string" && institution.trim()
        ? institution.trim().slice(0, 120)
        : "";
    let resolvedSchoolId: string | undefined;
    let resolvedSchoolCode: string | undefined;
    let resolvedLinkedStudentId: string | undefined;
    let resolvedLinkedStudentIds: string[] | undefined;
    let resolvedExtraField =
      typeof extraField === "string" && extraField.trim()
        ? extraField.trim().slice(0, 120)
        : undefined;

    if (normalizedRole === "admin") {
      if (!resolvedInstitution || resolvedInstitution.length < 2) {
        return NextResponse.json(
          { error: "Please enter your Institution / School Name." },
          { status: 400 }
        );
      }
    } else {
      // Teacher, Student, Parent MUST connect to an existing school via its School Join Code
      const cleanCode =
        typeof schoolCode === "string" ? schoolCode.trim().toUpperCase() : "";

      if (!cleanCode) {
        return NextResponse.json(
          {
            error:
              "School Join Code is required. Please obtain the code from your school administrator.",
          },
          { status: 400 }
        );
      }

      const school = await School.findOne({ code: cleanCode }).lean();
      if (!school) {
        return NextResponse.json(
          {
            error: `Invalid School Join Code "${cleanCode}". Please check the code with your school administrator.`,
          },
          { status: 404 }
        );
      }

      resolvedSchoolId = school._id.toString();
      resolvedSchoolCode = school.code;
      resolvedInstitution = school.name;

      // Student & Parent MUST also link to enrolled Student Roll Number(s) in that exact school
      if (normalizedRole === "student" || normalizedRole === "parent") {
        const rawRoll =
          typeof rollNumber === "string" ? rollNumber.trim() : "";

        if (!rawRoll) {
          return NextResponse.json(
            {
              error:
                normalizedRole === "student"
                  ? "Your enrolled Student Roll Number is required to link your academic record."
                  : "At least one child's enrolled Student Roll Number is required to link your guardian account.",
            },
            { status: 400 }
          );
        }

        // Parents may enter multiple comma-separated roll numbers (e.g. CF-101-A4B2, CF-102-B8C1)
        const rollList =
          normalizedRole === "parent"
            ? Array.from(
                new Set(
                  rawRoll
                    .split(",")
                    .map((r) => r.trim())
                    .filter(Boolean)
                )
              ).slice(0, 10)
            : [rawRoll];

        const matchedStudents = [];
        for (const singleRoll of rollList) {
          const st = await Student.findOne({
            schoolId: school._id,
            rollNumber: {
              $regex: new RegExp(`^${escapeRegex(singleRoll)}$`, "i"),
            },
          }).lean();

          if (!st) {
            return NextResponse.json(
              {
                error: `No enrolled student with Roll Number "${singleRoll}" was found in ${school.name}. Please verify the roll number with your school admin.`,
              },
              { status: 404 }
            );
          }
          matchedStudents.push(st);
        }

        resolvedLinkedStudentIds = matchedStudents.map((s) => s._id.toString());
        resolvedLinkedStudentId = resolvedLinkedStudentIds[0];
        resolvedExtraField = matchedStudents
          .map((s) => `${s.name} (${s.rollNumber})`)
          .join(", ")
          .slice(0, 120);
      }
    }

    // Enforce resend cooldown & abuse limit
    const existingPending = await EmailVerification.findOne({
      email: normalizedEmail,
    });
    if (existingPending) {
      const elapsed = Date.now() - new Date(existingPending.lastSentAt).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${waitSec} seconds before requesting a new verification code.`,
          },
          { status: 429 }
        );
      }
      if (
        existingPending.resendCount >= MAX_RESENDS_PER_WINDOW &&
        new Date(existingPending.expiresAt).getTime() > Date.now()
      ) {
        return NextResponse.json(
          {
            error:
              "Too many verification code requests. Please wait a few minutes and try again.",
          },
          { status: 429 }
        );
      }
    }

    const otpCode = generateOtpCode();
    const codeHash = hashOtpCode(normalizedEmail, otpCode);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await EmailVerification.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          codeHash,
          attempts: 0,
          lastSentAt: new Date(),
          expiresAt,
          resendCount: existingPending ? existingPending.resendCount + 1 : 1,
          pendingUser: {
            name: trimmedName,
            passwordHash: hashPassword(password),
            role: normalizedRole,
            institution: resolvedInstitution,
            extraField: resolvedExtraField,
            schoolId: resolvedSchoolId,
            schoolCode: resolvedSchoolCode,
            linkedStudentId: resolvedLinkedStudentId,
            linkedStudentIds: resolvedLinkedStudentIds,
          },
        },
      },
      { upsert: true, new: true }
    );

    const delivery = await sendVerificationEmail({
      to: normalizedEmail,
      name: trimmedName,
      code: otpCode,
      roleTitle: ROLE_TITLES[normalizedRole],
      institution: resolvedInstitution,
    });

    const payload: Record<string, unknown> = {
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
      institutionName: resolvedInstitution,
      expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
      deliveryMode: delivery.deliveryMode,
    };

    if (
      delivery.deliveryMode === "dev-preview" &&
      process.env.NODE_ENV !== "production"
    ) {
      payload.devPreviewUrl = delivery.previewUrl;
      payload.devCode = delivery.devCode;
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("[AUTH_SEND_VERIFICATION_ERROR]", error);
    return NextResponse.json(
      {
        error:
          "Unable to send verification email right now. Please check your email address and try again.",
      },
      { status: 500 }
    );
  }
}
