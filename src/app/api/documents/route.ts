import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import {
  CampusDocument,
  DocumentAudience,
  DocumentCategory,
} from "@/models/CampusDocument";
import { CampusNotification } from "@/models/CampusNotification";
import { requireAuth } from "@/lib/auth";
import {
  createCampusNotification,
  getAllowedAudiencesForRole,
} from "@/lib/notifications";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const VALID_CATEGORIES = [
  "timetable",
  "syllabus",
  "datesheet",
  "circular",
] as const;
const VALID_AUDIENCES = ["all", "teachers", "parents", "students"] as const;

const CATEGORY_TITLES: Record<DocumentCategory, string> = {
  timetable: "Class Timetable",
  syllabus: "Term Syllabus",
  datesheet: "Exam Date Sheet",
  circular: "Campus Circular",
};

function detectSafeMimeType(
  buffer: Buffer,
  declaredType: string,
  fileName: string
): "application/pdf" | "image/jpeg" | "image/png" | null {
  if (buffer.length < 4) return null;

  // PDF: %PDF (0x25 0x50 0x44 0x46)
  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46;

  // JPEG: FF D8 FF
  const isJpeg =
    buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  // PNG: 89 50 4E 47
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  const lowerName = fileName.toLowerCase();
  const lowerType = declaredType.toLowerCase();

  if (isPdf && (lowerType === "application/pdf" || lowerName.endsWith(".pdf"))) {
    return "application/pdf";
  }
  if (
    isJpeg &&
    (lowerType === "image/jpeg" ||
      lowerType === "image/jpg" ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg"))
  ) {
    return "image/jpeg";
  }
  if (isPng && (lowerType === "image/png" || lowerName.endsWith(".png"))) {
    return "image/png";
  }

  return null;
}

export async function GET(req: Request) {
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
    return NextResponse.json({ success: true, documents: [] });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const query: Record<string, unknown> = {
      schoolId: new mongoose.Types.ObjectId(session.schoolId),
    };

    if (
      category &&
      (VALID_CATEGORIES as readonly string[]).includes(category)
    ) {
      query.category = category;
    }

    const allowedAudiences = getAllowedAudiencesForRole(session.role);
    if (allowedAudiences) {
      query.audience = { $in: allowedAudiences };
    }

    const docs = await CampusDocument.find(query)
      .select("-fileData")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      documents: docs.map((d) => ({
        _id: d._id.toString(),
        category: d.category,
        title: d.title,
        grade: d.grade,
        section: d.section,
        term: d.term,
        audience: d.audience,
        notes: d.notes,
        fileName: d.fileName,
        mimeType: d.mimeType,
        fileSize: d.fileSize,
        uploadedBy: d.uploadedBy,
        createdAt: d.createdAt,
        fileUrl: `/api/documents/${d._id.toString()}/file`,
        downloadUrl: `/api/documents/${d._id.toString()}/file?download=1`,
      })),
    });
  } catch (error) {
    console.error("[DOCUMENTS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load uploaded documents." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin", "coordinator"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json(
      { error: "School workspace is not configured." },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const formData = await req.formData();

    const file = formData.get("file");
    const categoryRaw = String(formData.get("category") || "datesheet").trim();
    const titleRaw = String(formData.get("title") || "").trim();
    const gradeRaw = String(formData.get("grade") || "All Classes").trim();
    const sectionRaw = String(formData.get("section") || "All Sections").trim();
    const termRaw = String(formData.get("term") || "").trim();
    const audienceRaw = String(formData.get("audience") || "all").trim();
    const notesRaw = String(formData.get("notes") || "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please attach a PDF, JPG, JPEG, or PNG file to upload." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty. Please choose a valid file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File size must be 5 MB or smaller." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const safeFileName = (file.name || "document")
      .replace(/[^\w.\-() ]+/g, "_")
      .slice(0, 140);

    const verifiedMime = detectSafeMimeType(buffer, file.type, safeFileName);
    if (!verifiedMime) {
      return NextResponse.json(
        {
          error:
            "Unsupported file format. Only valid PDF, JPEG, JPG, and PNG files are allowed.",
        },
        { status: 400 }
      );
    }

    const cleanCategory: DocumentCategory = (
      VALID_CATEGORIES as readonly string[]
    ).includes(categoryRaw)
      ? (categoryRaw as DocumentCategory)
      : "datesheet";

    const cleanAudience: DocumentAudience = (
      VALID_AUDIENCES as readonly string[]
    ).includes(audienceRaw)
      ? (audienceRaw as DocumentAudience)
      : "all";

    const cleanTitle =
      titleRaw.slice(0, 140) ||
      `${CATEGORY_TITLES[cleanCategory]} — ${gradeRaw}`;
    const cleanGrade = gradeRaw.slice(0, 40) || "All Classes";
    const cleanSection = sectionRaw.slice(0, 40) || "All Sections";
    const cleanTerm = termRaw.slice(0, 30);
    const cleanNotes = notesRaw.slice(0, 400);

    const created = await CampusDocument.create({
      schoolId: new mongoose.Types.ObjectId(session.schoolId),
      category: cleanCategory,
      title: cleanTitle,
      grade: cleanGrade,
      section: cleanSection,
      term: cleanTerm,
      audience: cleanAudience,
      notes: cleanNotes,
      fileName: safeFileName,
      mimeType: verifiedMime,
      fileSize: buffer.length,
      fileData: buffer,
      uploadedBy: session.name || "Academic Coordinator",
    });

    const fileKindLabel = verifiedMime === "application/pdf" ? "PDF" : "Image";
    const scopeLabel =
      cleanGrade === "All Classes"
        ? "All Classes"
        : cleanSection && cleanSection !== "All Sections"
        ? `${cleanGrade} (Section ${cleanSection})`
        : cleanGrade;

    // Broadcast live notification to target portals + Admin oversight
    await createCampusNotification({
      schoolId: session.schoolId,
      category: cleanCategory,
      title: `New ${CATEGORY_TITLES[cleanCategory]} (${fileKindLabel})`,
      message: `${cleanTitle} uploaded for ${scopeLabel}. Tap to view or download.`,
      audience: cleanAudience,
      grade: cleanGrade,
      section: cleanSection,
      documentId: created._id.toString(),
      fileName: safeFileName,
      mimeType: verifiedMime,
      createdBy: session.name || "Academic Coordinator",
      senderRole: session.role === "admin" ? "admin" : "coordinator",
      senderUserId: session.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: `${CATEGORY_TITLES[cleanCategory]} uploaded and portals notified.`,
        document: {
          _id: created._id.toString(),
          category: created.category,
          title: created.title,
          grade: created.grade,
          section: created.section,
          term: created.term,
          audience: created.audience,
          notes: created.notes,
          fileName: created.fileName,
          mimeType: created.mimeType,
          fileSize: created.fileSize,
          uploadedBy: created.uploadedBy,
          createdAt: created.createdAt,
          fileUrl: `/api/documents/${created._id.toString()}/file`,
          downloadUrl: `/api/documents/${created._id.toString()}/file?download=1`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[DOCUMENTS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to upload file right now. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(req, ["admin", "coordinator"]);
  if (auth.response) return auth.response;

  const { session } = auth;
  if (!session.schoolId || !mongoose.Types.ObjectId.isValid(session.schoolId)) {
    return NextResponse.json(
      { error: "School workspace is not configured." },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid document ID." }, { status: 400 });
    }

    const schoolObjId = new mongoose.Types.ObjectId(session.schoolId);
    const docObjId = new mongoose.Types.ObjectId(id);

    await CampusDocument.deleteOne({ _id: docObjId, schoolId: schoolObjId });
    await CampusNotification.deleteMany({
      documentId: docObjId,
      schoolId: schoolObjId,
    });

    return NextResponse.json({
      success: true,
      message: "Uploaded file removed.",
    });
  } catch (error) {
    console.error("[DOCUMENTS_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete uploaded document." },
      { status: 500 }
    );
  }
}
