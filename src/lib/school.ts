import crypto from "node:crypto";
import mongoose from "mongoose";
import { School } from "@/models/School";
import { User } from "@/models/User";
import { Student } from "@/models/Student";
import { Fee } from "@/models/Fee";
import { Attendance } from "@/models/Attendance";
import { buildInitialTrialSubscription } from "@/lib/subscription";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Ambiguity-free (no 0/O/1/I)

function randomCodePart(length: number): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return out;
}

export async function generateUniqueSchoolCode(
  institutionName: string
): Promise<string> {
  const letters = institutionName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4);
  const prefix = letters.length >= 2 ? letters : "SCH";

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `${prefix}-${randomCodePart(4)}`;
    const exists = await School.exists({ code: candidate });
    if (!exists) return candidate;
  }

  return `SCH-${randomCodePart(6)}`;
}

export async function createSchoolForAdmin(params: {
  institutionName: string;
  ownerId: mongoose.Types.ObjectId | string;
}): Promise<{ schoolId: mongoose.Types.ObjectId; schoolCode: string; name: string }> {
  const cleanName = params.institutionName.trim() || "St. Jude Collegiate Academy";
  const code = await generateUniqueSchoolCode(cleanName);

  const school = await School.create({
    name: cleanName,
    code,
    ownerId: new mongoose.Types.ObjectId(params.ownerId),
    subscription: buildInitialTrialSubscription(),
  });

  return {
    schoolId: school._id as mongoose.Types.ObjectId,
    schoolCode: school.code,
    name: school.name,
  };
}

/**
 * Backward compatibility: if an existing legacy Admin account was created before
 * multi-tenancy was introduced, automatically provision a School record for them
 * and bind any untagged legacy Student / Fee / Attendance documents to their school.
 */
export async function ensureAdminSchool(user: {
  _id: mongoose.Types.ObjectId;
  role: string;
  institution?: string;
  schoolId?: mongoose.Types.ObjectId;
  schoolCode?: string;
}): Promise<{ schoolId?: string; schoolCode?: string }> {
  if (user.schoolId && user.schoolCode) {
    return {
      schoolId: user.schoolId.toString(),
      schoolCode: user.schoolCode,
    };
  }

  if (user.role !== "admin") {
    return {
      schoolId: user.schoolId?.toString(),
      schoolCode: user.schoolCode,
    };
  }

  const created = await createSchoolForAdmin({
    institutionName: user.institution || "St. Jude Collegiate Academy",
    ownerId: user._id,
  });

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        schoolId: created.schoolId,
        schoolCode: created.schoolCode,
        institution: created.name,
      },
    }
  );

  // Claim any legacy records without schoolId so existing dev data stays visible
  const legacyFilter = {
    $or: [{ schoolId: { $exists: false } }, { schoolId: null }],
  };
  await Promise.all([
    Student.updateMany(legacyFilter, { $set: { schoolId: created.schoolId } }),
    Fee.updateMany(legacyFilter, { $set: { schoolId: created.schoolId } }),
    Attendance.updateMany(legacyFilter, { $set: { schoolId: created.schoolId } }),
  ]);

  return {
    schoolId: created.schoolId.toString(),
    schoolCode: created.schoolCode,
  };
}
