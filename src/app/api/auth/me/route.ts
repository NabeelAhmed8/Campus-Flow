import { NextResponse } from "next/server";
import {
  attachSessionCookie,
  createSessionToken,
  getSessionFromRequest,
  requireAuth,
} from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) {
    return auth.response;
  }

  const { session } = auth;
  const response = NextResponse.json({
    authenticated: true,
    user: {
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      institution: session.institution,
      schoolId: session.schoolId,
      schoolCode: session.schoolCode,
      linkedStudentId: session.linkedStudentId,
      linkedStudentIds: session.linkedStudentIds || [],
      assignedClasses: session.assignedClasses || [],
    },
  });

  // Keep the signed session cookie in sync if role/profile changed in database
  // (e.g., Admin promoted a Teacher to Academic Coordinator or demoted back)
  const cookieSession = await getSessionFromRequest(req);
  if (
    cookieSession &&
    (cookieSession.role !== session.role ||
      cookieSession.name !== session.name ||
      cookieSession.schoolId !== session.schoolId)
  ) {
    const refreshedToken = await createSessionToken({
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      institution: session.institution,
      schoolId: session.schoolId,
      schoolCode: session.schoolCode,
      linkedStudentId: session.linkedStudentId,
    });
    attachSessionCookie(response, refreshedToken);
  }

  return response;
}
