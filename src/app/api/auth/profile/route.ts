import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { School } from "@/models/School";
import {
  attachSessionCookie,
  createSessionToken,
  isValidRole,
  requireAuth,
} from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    await connectDB();
    const user = await User.findById(auth.session.id)
      .select(
        "_id name email role institution extraField schoolId schoolCode linkedStudentId createdAt updatedAt"
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution || "St. Jude Collegiate Academy",
        extraField: user.extraField || "",
        schoolId: user.schoolId?.toString() || auth.session.schoolId || "",
        schoolCode: user.schoolCode || auth.session.schoolCode || "",
        linkedStudentId: user.linkedStudentId?.toString() || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("[PROFILE_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to load profile details. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    await connectDB();
    const body = await req.json();
    const { name, institution, extraField } = body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Full name must be between 2 and 100 characters." },
        { status: 400 }
      );
    }

    const updateFields: Record<string, string> = {
      name: trimmedName,
    };

    // Only Admins can rename the institution; other roles inherit their linked school's name
    if (
      auth.session.role === "admin" &&
      typeof institution === "string" &&
      institution.trim()
    ) {
      const newSchoolName = institution.trim().slice(0, 120);
      updateFields.institution = newSchoolName;
      if (auth.session.schoolId) {
        await Promise.all([
          School.updateOne(
            { _id: auth.session.schoolId },
            { $set: { name: newSchoolName } }
          ),
          User.updateMany(
            { schoolId: auth.session.schoolId },
            { $set: { institution: newSchoolName } }
          ),
        ]);
      }
    }

    if (typeof extraField === "string") {
      updateFields.extraField = extraField.trim().slice(0, 120);
    }

    const updated = await User.findByIdAndUpdate(
      auth.session.id,
      { $set: updateFields },
      { new: true }
    )
      .select(
        "_id name email role institution extraField schoolId schoolCode linkedStudentId createdAt updatedAt"
      )
      .lean();

    if (!updated || !isValidRole(updated.role)) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    const refreshedSessionUser = {
      id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      role: updated.role,
      institution: updated.institution || "St. Jude Collegiate Academy",
      schoolId: updated.schoolId?.toString(),
      schoolCode: updated.schoolCode,
      linkedStudentId: updated.linkedStudentId?.toString(),
    };

    const newToken = await createSessionToken(refreshedSessionUser);
    const response = NextResponse.json({
      success: true,
      message: "Profile details updated successfully.",
      profile: {
        ...refreshedSessionUser,
        extraField: updated.extraField || "",
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });

    attachSessionCookie(response, newToken);
    return response;
  } catch (error) {
    console.error("[PROFILE_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to update profile details. Please try again." },
      { status: 500 }
    );
  }
}
