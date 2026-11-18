import { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "campusflow_session";
export const ALLOWED_ROLES = [
  "admin",
  "coordinator",
  "teacher",
  "student",
  "parent",
] as const;
export type PortalRole = (typeof ALLOWED_ROLES)[number];

export interface AssignedClass {
  grade: string;
  section: string;
}

export interface SessionPayload {
  id: string;
  name: string;
  email: string;
  role: PortalRole;
  institution: string;
  schoolId?: string;
  schoolCode?: string;
  linkedStudentId?: string;
  linkedStudentIds?: string[];
  assignedClasses?: AssignedClass[];
  exp: number;
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSigningSecret(): string {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.MONGODB_URI;
  if (!secret) {
    throw new Error(
      "Missing signing secret: configure SESSION_SECRET or NEXTAUTH_SECRET in environment variables."
    );
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded =
    str.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(getSigningSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

export async function createSessionToken(
  user: Omit<SessionPayload, "exp">
): Promise<string> {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_DURATION_MS,
  };
  const encoder = new TextEncoder();
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await getHmacKey("sign");
  const sigBuf = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );
  const sigB64 = toBase64Url(new Uint8Array(sigBuf));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") return null;
  const dotIndex = token.indexOf(".");
  if (dotIndex <= 0) return null;

  const payloadB64 = token.slice(0, dotIndex);
  const sigB64 = token.slice(dotIndex + 1);
  if (!payloadB64 || !sigB64) return null;

  try {
    const encoder = new TextEncoder();
    const key = await getHmacKey("verify");
    const sigBytes = fromBase64Url(sigB64);
    const sigArrayBuffer = sigBytes.buffer.slice(
      sigBytes.byteOffset,
      sigBytes.byteOffset + sigBytes.byteLength
    ) as ArrayBuffer;
    const isValid = await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      sigArrayBuffer,
      encoder.encode(payloadB64)
    );
    if (!isValid) return null;

    const decoded = new TextDecoder().decode(fromBase64Url(payloadB64));
    const parsed = JSON.parse(decoded) as SessionPayload;

    if (
      !parsed ||
      typeof parsed.id !== "string" ||
      typeof parsed.role !== "string" ||
      !ALLOWED_ROLES.includes(parsed.role as PortalRole) ||
      typeof parsed.exp !== "number" ||
      parsed.exp <= Date.now()
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function attachSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  // Clean up any legacy client-writable cookie
  res.cookies.set("campusflow_role", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("campusflow_role", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
}

export function extractCookieValue(
  cookieHeader: string | null,
  name: string
): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    if (key === name) {
      return decodeURIComponent(pair.slice(idx + 1).trim());
    }
  }
  return null;
}

export async function getSessionFromRequest(
  req: Request
): Promise<SessionPayload | null> {
  const token = extractCookieValue(req.headers.get("cookie"), SESSION_COOKIE_NAME);
  return verifySessionToken(token);
}

export async function requireAuth(
  req: Request,
  allowedRoles?: readonly PortalRole[]
): Promise<
  | { session: SessionPayload; response?: undefined }
  | { session?: undefined; response: NextResponse }
> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return {
      response: NextResponse.json(
        { error: "Authentication required. Please sign in to continue." },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return {
      response: NextResponse.json(
        { error: "Access denied. You do not have permission to perform this action." },
        { status: 403 }
      ),
    };
  }

  return { session };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidRole(role: string): role is PortalRole {
  return (ALLOWED_ROLES as readonly string[]).includes(role);
}

export function isValidDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}
