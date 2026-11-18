"use client";

import { useState, useEffect } from "react";
import { readClientAuthStorage, type ClientAuthSnapshot } from "@/lib/client-auth";

export function useClientAuth(defaults?: Partial<ClientAuthSnapshot>): ClientAuthSnapshot {
  const [snapshot, setSnapshot] = useState<ClientAuthSnapshot>({
    role: defaults?.role ?? "",
    name: defaults?.name ?? "",
    email: defaults?.email ?? "",
    institution: defaults?.institution ?? "CampusFlow",
    schoolCode: defaults?.schoolCode ?? "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const stored = readClientAuthStorage();
      setSnapshot((prev) => ({
        role: stored.role || prev.role,
        name: stored.name || prev.name,
        email: stored.email || prev.email,
        institution: stored.institution || prev.institution,
        schoolCode: stored.schoolCode || prev.schoolCode,
      }));
    };
    sync();
    window.addEventListener("campusflow_institution_updated", sync);
    return () => window.removeEventListener("campusflow_institution_updated", sync);
  }, []);

  return snapshot;
}
