"use client";

import { useState, useEffect } from "react";
import { LandingNavbar, type LandingAuthState } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingPricing } from "@/components/landing/landing-pricing";

const INITIAL_AUTH: LandingAuthState = {
  isLoggedIn: false,
  role: null,
  userName: "",
  dashboardHref: "/login",
  roleLabel: "",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin Hub",
  coordinator: "Coordinator Desk",
  teacher: "Teacher AI Suite",
  student: "Student Portal",
  parent: "Parent Portal",
};

export default function Home() {
  const [authState, setAuthState] = useState<LandingAuthState>(INITIAL_AUTH);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isCancelled = false;
    const syncAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (isCancelled) return;

        if (res.ok && data?.authenticated && data?.user?.role) {
          const role = data.user.role as NonNullable<LandingAuthState["role"]>;
          setAuthState({
            isLoggedIn: true,
            role,
            userName: data.user.name || "User",
            dashboardHref: `/${role}`,
            roleLabel: ROLE_LABELS[role] || "Dashboard",
          });
        } else {
          localStorage.removeItem("campusflow_user_role");
          localStorage.removeItem("campusflow_user_name");
          localStorage.removeItem("campusflow_user_email");
          localStorage.removeItem("campusflow_institution");
          localStorage.removeItem("campusflow_admin_name");
        }
      } catch {
        // Leave logged-out state on network error
      }
    };

    syncAuth();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    if (typeof window === "undefined") return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Proceed with client cleanup regardless
    }
    localStorage.removeItem("campusflow_user_role");
    localStorage.removeItem("campusflow_user_name");
    localStorage.removeItem("campusflow_user_email");
    localStorage.removeItem("campusflow_institution");
    localStorage.removeItem("campusflow_admin_name");
    setAuthState(INITIAL_AUTH);
    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar authState={authState} onSignOut={handleSignOut} />
      <LandingHero authState={authState} />
      <LandingFeatures />
      <LandingPricing authState={authState} />
    </div>
  );
}
