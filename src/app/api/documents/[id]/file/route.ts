import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { CampusDocument } from "@/models/CampusDocument";
import { requireAuth } from "@/lib/auth";
import { getAllowedAudiencesForRole } from "@/lib/notifications";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, [
    "admin",
    "coordinator",
    "teacher",
    "student",
    "parent",
  ]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid document ID." }, { status: 400 });
  }

  try {
    await connectDB();
    const query: Record<string, unknown> = {
      _id: new mongoose.Types.ObjectId(id),
      schoolId: new mongoose.Types.ObjectId(session.schoolId),
    };

    const allowedAudiences = getAllowedAudiencesForRole(session.role);
    if (allowedAudiences) {
      query.audience = { $in: allowedAudiences };
    }

    const doc = await CampusDocument.findOne(query);
    if (!doc || !doc.fileData) {
      return NextResponse.json(
        { error: "Document not found or access restricted." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get("download") === "1";

    // Mongoose returns a clean Node.js Buffer when not using .lean()
    const rawBuffer = Buffer.isBuffer(doc.fileData)
      ? doc.fileData
      : Buffer.from(doc.fileData);

    const safeName = (doc.fileName || "campus-document").replace(
      /["\r\n]/g,
      ""
    );

    return new NextResponse(new Uint8Array(rawBuffer), {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Length": String(rawBuffer.length),
        "Content-Disposition": `${
          isDownload ? "attachment" : "inline"
        }; filename="${safeName}"`,
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[DOCUMENT_FILE_STREAM_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to load document file." },
      { status: 500 }
    );
  }
}
