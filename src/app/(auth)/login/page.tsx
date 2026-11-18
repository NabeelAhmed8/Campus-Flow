"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building,
  BrainCircuit,
  BookOpen,
  Users,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncClientAuthStorage } from "@/lib/client-auth";

type PortalRole = "admin" | "coordinator" | "teacher" | "student" | "parent";

const LOGIN_PORTALS = [
  {
    id: "admin" as PortalRole,
    title: "Admin Hub",
    badge: "Admin",
    target: "/admin",
    icon: Building,
    placeholderEmail: "admin@institution.edu",
  },
  {
    id: "coordinator" as PortalRole,
    title: "Coordinator Desk",
    badge: "Coord.",
    target: "/coordinator",
    icon: ShieldCheck,
    placeholderEmail: "coordinator@institution.edu",
  },
  {
    id: "teacher" as PortalRole,
    title: "Teacher Suite",
    badge: "Faculty",
    target: "/teacher",
    icon: BrainCircuit,
    placeholderEmail: "teacher@institution.edu",
  },
  {
    id: "student" as PortalRole,
    title: "Student Portal",
    badge: "Learner",
    target: "/student",
    icon: BookOpen,
    placeholderEmail: "student@institution.edu",
  },
  {
    id: "parent" as PortalRole,
    title: "Parent Portal",
    badge: "Guardian",
    target: "/parent",
    icon: Users,
    placeholderEmail: "parent@institution.edu",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<PortalRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Guarantee loading is reset on mount, route change, and browser back/forward cache
  useEffect(() => {
    setLoading(false);
    setPassword("");

    const handlePageShow = () => {
      setLoading(false);
      setPassword("");
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleSelectRole = (role: PortalRole) => {
    setSelectedRole(role);
    setLoading(false);
    setPassword("");
  };

  const activePortal = LOGIN_PORTALS.find((p) => p.id === selectedRole) || LOGIN_PORTALS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      syncClientAuthStorage(data.user);

      toast.success(`Welcome back ${data.user.name}! Loading ${activePortal.title}...`);
      setTimeout(() => {
        setLoading(false);
        router.push(activePortal.target);
      }, 600);
    } catch {
      toast.error("Unable to connect to the authentication server. Please check your connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center px-4 py-6 bg-muted/20 relative">
      {/* Top Navigation */}
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-sm space-y-3.5">
        {/* Brand */}
        <div className="text-center space-y-1">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <span>Campus<span className="text-primary/70 font-semibold">Flow</span></span>
          </Link>
          <p className="text-[11px] text-muted-foreground">Select portal to access your role workspace</p>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-muted/70 border">
          {LOGIN_PORTALS.map((portal) => {
            const Icon = portal.icon;
            const isSelected = selectedRole === portal.id;
            return (
              <button
                key={portal.id}
                type="button"
                onClick={() => handleSelectRole(portal.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-card text-foreground shadow-xs border font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 mb-0.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-[10px] leading-tight">{portal.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1 border-b">
            <div className="flex items-center gap-2">
              <activePortal.icon className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold">{activePortal.title} Workspace</h2>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {activePortal.badge}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label htmlFor="login-email" className="block font-semibold mb-1 text-foreground">
                {activePortal.title} Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={activePortal.placeholderEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 rounded-lg border bg-background pl-8.5 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="font-semibold text-foreground">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-9 rounded-lg border bg-background pl-8.5 pr-9 text-xs outline-none focus:ring-1 focus:ring-primary tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" size="sm" className="w-full h-9 mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to {activePortal.title}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="text-center text-[11px] text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-foreground hover:underline">
            Register new portal account
          </Link>
        </div>
      </div>
    </div>
  );
}
