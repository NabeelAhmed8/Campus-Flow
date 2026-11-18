const AUTH_STORAGE_KEYS = [
  "campusflow_user_role",
  "campusflow_user_name",
  "campusflow_user_email",
  "campusflow_institution",
  "campusflow_admin_name",
  "campusflow_school_code",
] as const;

export interface ClientAuthSnapshot {
  role: string;
  name: string;
  email: string;
  institution: string;
  schoolCode: string;
}

export function readClientAuthStorage(): ClientAuthSnapshot {
  if (typeof window === "undefined") {
    return { role: "", name: "", email: "", institution: "", schoolCode: "" };
  }
  return {
    role: localStorage.getItem("campusflow_user_role") || "",
    name:
      localStorage.getItem("campusflow_user_name") ||
      localStorage.getItem("campusflow_admin_name") ||
      "",
    email: localStorage.getItem("campusflow_user_email") || "",
    institution: localStorage.getItem("campusflow_institution") || "",
    schoolCode: localStorage.getItem("campusflow_school_code") || "",
  };
}

export function clearClientAuthStorage(): void {
  if (typeof window === "undefined") return;
  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

export function syncClientAuthStorage(
  user: {
    role?: string;
    name?: string;
    email?: string;
    institution?: string;
    schoolCode?: string;
  },
  options?: { dispatchEvent?: boolean }
): void {
  if (typeof window === "undefined") return;
  if (user.role) localStorage.setItem("campusflow_user_role", user.role);
  if (user.name) localStorage.setItem("campusflow_user_name", user.name);
  if (user.email) localStorage.setItem("campusflow_user_email", user.email);
  if (user.institution) localStorage.setItem("campusflow_institution", user.institution);
  if (user.schoolCode) localStorage.setItem("campusflow_school_code", user.schoolCode);
  if (user.role === "admin" && user.name) {
    localStorage.setItem("campusflow_admin_name", user.name);
  }
  if (options?.dispatchEvent !== false) {
    window.dispatchEvent(new Event("campusflow_institution_updated"));
  }
}
