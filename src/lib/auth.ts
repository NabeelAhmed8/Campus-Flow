import crypto from "node:crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ensureAdminSchool } from "@/lib/school";
import {
  clearSessionCookie,
  getSessionFromRequest,
  isValidRole,
  PortalRole,
  SessionPayload,
} from "./session";

export {
  SESSION_COOKIE_NAME,
  ALLOWED_ROLES,
  createSessionToken,
  verifySessionToken,
  attachSessionCookie,
  clearSessionCookie,
  extractCookieValue,
  getSessionFromRequest,
  isValidEmail,
  isValidRole,
  isValidDateString,
} from "./session";
export type { AssignedClass, PortalRole, SessionPayload } from "./session";

// ============================================================================
// Password Hashing (Salted scrypt + Timing-Safe Verification)
// ============================================================================

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
}

export function verifyPassword(
  password: string,
  storedHash: string
): { valid: boolean; needsRehash: boolean } {
  if (!storedHash || typeof storedHash !== "string") {
    return { valid: false, needsRehash: false };
  }

  // Modern salted scrypt format
  if (storedHash.startsWith("scrypt$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 3) return { valid: false, needsRehash: false };
    const [, salt, keyHex] = parts;
    try {
      const derivedBuf = crypto.scryptSync(password, salt, 64);
      const storedBuf = Buffer.from(keyHex, "hex");
      if (derivedBuf.length !== storedBuf.length) {
        return { valid: false, needsRehash: false };
      }
      const valid = crypto.timingSafeEqual(derivedBuf, storedBuf);
      return { valid, needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // Legacy SHA-256 hex support (auto-migrated to scrypt on next successful login)
  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    const legacyHash = crypto.createHash("sha256").update(password).digest("hex");
    try {
      const valid = crypto.timingSafeEqual(
        Buffer.from(legacyHash, "hex"),
        Buffer.from(storedHash, "hex")
      );
      return { valid, needsRehash: valid };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  return { valid: false, needsRehash: false };
}

// ============================================================================
// Email OTP Generation & Timing-Safe HMAC Verification
// ============================================================================

function getOtpSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.MONGODB_URI ||
    "campusflow-otp-hmac-key-v1"
  );
}

export function generateOtpCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashOtpCode(email: string, code: string): string {
  const normalized = `${email.toLowerCase().trim()}:${code.trim()}`;
  return crypto
    .createHmac("sha256", getOtpSecret())
    .update(normalized)
    .digest("hex");
}

export function verifyOtpCode(
  email: string,
  submittedCode: string,
  storedHash: string
): boolean {
  if (!submittedCode || !storedHash) return false;
  const computed = hashOtpCode(email, submittedCode);
  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ============================================================================
// Live Database-Backed Session Verification (Instant Revocation on User Delete)
// ============================================================================

export async function requireAuth(
  req: Request,
  allowedRoles?: readonly PortalRole[]
): Promise<
  | { session: SessionPayload; response?: undefined }
  | { session?: undefined; response: NextResponse }
> {
  const tokenSession = await getSessionFromRequest(req);
  if (!tokenSession || !mongoose.Types.ObjectId.isValid(tokenSession.id)) {
    const res = NextResponse.json(
      { error: "Authentication required. Please sign in to continue." },
      { status: 401 }
    );
    clearSessionCookie(res);
    return { response: res };
  }

  try {
    await connectDB();
    const dbUser = await User.findById(tokenSession.id)
      .select(
        "_id name email role institution schoolId schoolCode linkedStudentId linkedStudentIds assignedClasses"
      )
      .lean();

    // User was deleted from MongoDB or role is no longer valid — revoke session immediately
    if (!dbUser || !isValidRole(dbUser.role)) {
      const res = NextResponse.json(
        { error: "Your account session is no longer active. Please sign in again." },
        { status: 401 }
      );
      clearSessionCookie(res);
      return { response: res };
    }

    let schoolId = dbUser.schoolId?.toString();
    let schoolCode = dbUser.schoolCode;

    // Auto-provision school for any legacy Admin account created before multi-tenancy
    if (dbUser.role === "admin" && (!schoolId || !schoolCode)) {
      const ensured = await ensureAdminSchool({
        _id: dbUser._id as mongoose.Types.ObjectId,
        role: dbUser.role,
        institution: dbUser.institution,
        schoolId: dbUser.schoolId as mongoose.Types.ObjectId | undefined,
        schoolCode: dbUser.schoolCode,
      });
      schoolId = ensured.schoolId;
      schoolCode = ensured.schoolCode;
    }

    // Merge legacy linkedStudentId and multi-child linkedStudentIds (deduplicated)
    const mergedLinkedIds = new Set<string>();
    if (dbUser.linkedStudentId) {
      mergedLinkedIds.add(dbUser.linkedStudentId.toString());
    }
    if (Array.isArray(dbUser.linkedStudentIds)) {
      for (const sid of dbUser.linkedStudentIds) {
        if (sid) mergedLinkedIds.add(sid.toString());
      }
    }
    const linkedIdsArray = Array.from(mergedLinkedIds);

    const assignedClasses = Array.isArray(dbUser.assignedClasses)
      ? dbUser.assignedClasses
          .filter((c) => c && c.grade && c.section)
          .map((c) => ({ grade: c.grade.trim(), section: c.section.trim() }))
      : [];

    const liveSession: SessionPayload = {
      id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      institution: dbUser.institution || "St. Jude Collegiate Academy",
      schoolId,
      schoolCode,
      linkedStudentId: linkedIdsArray[0],
      linkedStudentIds: linkedIdsArray,
      assignedClasses,
      exp: tokenSession.exp,
    };

    if (allowedRoles && !allowedRoles.includes(liveSession.role)) {
      return {
        response: NextResponse.json(
          { error: "Access denied. You do not have permission to perform this action." },
          { status: 403 }
        ),
      };
    }

    return { session: liveSession };
  } catch (error) {
    console.error("[AUTH_DB_SESSION_CHECK_ERROR]", error);
    return {
      response: NextResponse.json(
        { error: "Unable to verify session right now. Please try again." },
        { status: 503 }
      ),
    };
  }
}

// ============================================================================
// Teacher Class & Section Assignment Isolation Helpers
// ============================================================================

function escapeRegexChars(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildTeacherClassFilter(
  assignedClasses: Array<{ grade: string; section: string }> | undefined
): Record<string, unknown>[] {
  if (!Array.isArray(assignedClasses) || assignedClasses.length === 0) {
    return [];
  }
  return assignedClasses
    .filter((c) => c && c.grade?.trim() && c.section?.trim())
    .map((c) => ({
      grade: { $regex: new RegExp(`^${escapeRegexChars(c.grade.trim())}$`, "i") },
      section: { $regex: new RegExp(`^${escapeRegexChars(c.section.trim())}$`, "i") },
    }));
}

export function isStudentInTeacherScope(
  student: { grade?: string; section?: string },
  assignedClasses: Array<{ grade: string; section: string }> | undefined
): boolean {
  if (!Array.isArray(assignedClasses) || assignedClasses.length === 0) {
    return false;
  }
  const stGrade = (student.grade || "").trim().toLowerCase();
  const stSection = (student.section || "A").trim().toLowerCase();
  return assignedClasses.some(
    (c) =>
      (c.grade || "").trim().toLowerCase() === stGrade &&
      (c.section || "").trim().toLowerCase() === stSection
  );
}
