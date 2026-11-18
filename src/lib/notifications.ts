import mongoose from "mongoose";
import {
  CampusNotification,
  NotificationAudience,
  NotificationCategory,
} from "@/models/CampusNotification";

interface NotifyParams {
  schoolId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  audience?: NotificationAudience;
  grade?: string;
  section?: string;
  priority?: "normal" | "urgent";
  documentId?: string;
  fileName?: string;
  mimeType?: string;
  createdBy?: string;
  senderRole?: "admin" | "coordinator";
  senderUserId?: string;
}

export async function createCampusNotification(params: NotifyParams) {
  try {
    if (!params.schoolId || !mongoose.Types.ObjectId.isValid(params.schoolId)) {
      return null;
    }

    // Mark only the sender's own userId as read so Admin ALWAYS receives an unread
    // notification whenever a Coordinator sends anything (and vice versa).
    const initialReadBy = params.senderUserId ? [params.senderUserId] : [];

    const doc = await CampusNotification.create({
      schoolId: new mongoose.Types.ObjectId(params.schoolId),
      category: params.category,
      title: params.title.trim().slice(0, 140),
      message: params.message.trim().slice(0, 600),
      audience: params.audience || "all",
      grade: params.grade?.trim().slice(0, 40) || "All Classes",
      section: params.section?.trim().slice(0, 40) || "All Sections",
      priority: params.priority === "urgent" ? "urgent" : "normal",
      ...(params.documentId && mongoose.Types.ObjectId.isValid(params.documentId)
        ? { documentId: new mongoose.Types.ObjectId(params.documentId) }
        : {}),
      fileName: params.fileName?.trim().slice(0, 180) || "",
      mimeType: params.mimeType?.trim().slice(0, 80) || "",
      createdBy: params.createdBy?.trim().slice(0, 100) || "Academic Coordinator",
      senderRole: params.senderRole === "admin" ? "admin" : "coordinator",
      readBy: initialReadBy,
    });

    return doc;
  } catch (error) {
    console.error("[CREATE_CAMPUS_NOTIFICATION_ERROR]", error);
    return null;
  }
}

export function getAllowedAudiencesForRole(role: string): string[] | null {
  // Admin sees EVERY campus notification including private billing & renewal alerts
  if (role === "admin") {
    return null;
  }
  // Coordinator sees all academic/campus broadcasts but NOT private Admin billing notices
  if (role === "coordinator") {
    return ["all", "parents_students", "teachers", "parents", "students"];
  }
  if (role === "teacher") return ["all", "teachers"];
  if (role === "parent") return ["all", "parents_students", "parents"];
  if (role === "student") return ["all", "parents_students", "students"];
  return ["all"];
}
