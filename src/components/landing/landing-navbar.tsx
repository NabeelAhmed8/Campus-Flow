"use client";

import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  Users,
  ArrowRight,
  Layers,
  Menu,
  LayoutDashboard,
  LogOut,
  User,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CustomDropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "@/components/ui/custom-dropdown-menu";

export interface LandingAuthState {
  isLoggedIn: boolean;
  role: "admin" | "coordinator" | "teacher" | "student" | "parent" | null;
  userName: string;
  dashboardHref: string;
  roleLabel: string;
}

interface LandingNavbarProps {
  authState: LandingAuthState;
  onSignOut: () => void;
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth" });
}

export function LandingNavbar({ authState, onSignOut }: LandingNavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span>
            Campus<span className="text-primary/70 font-semibold">Flow</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#modules" className="hover:text-foreground transition-colors">
            Core Modules
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {authState.isLoggedIn ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSignOut}
                className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                Sign Out
              </Button>

              <Button size="sm" asChild className="shadow-xs font-semibold gap-1.5 px-3 sm:px-4">
                <Link href={authState.dashboardHref}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-0.5 opacity-80" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="shadow-xs font-semibold">
                <Link href="/register">
                  Get Started <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </>
          )}

          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden">
            <CustomDropdown>
              <DropdownTrigger
                className="p-2 rounded-lg border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors flex items-center justify-center"
                aria-label="Toggle Navigation Menu"
              >
                <Menu className="h-4 w-4" />
              </DropdownTrigger>
              <DropdownContent align="right" minWidth="min-w-[210px]">
                {authState.isLoggedIn ? (
                  <>
                    <div className="px-2.5 py-2 border-b border-border/60 bg-muted/40 rounded-lg mb-1">
                      <div className="text-xs font-bold text-foreground truncate">
                        {authState.userName}
                      </div>
                      <div className="text-[10px] text-primary font-medium flex items-center gap-1 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {authState.roleLabel} (Active)
                      </div>
                    </div>

                    <DropdownItem
                      icon={LayoutDashboard}
                      active
                      description={`Go directly to ${authState.roleLabel}`}
                      onClick={() => {
                        window.location.href = authState.dashboardHref;
                      }}
                    >
                      Go to Dashboard
                    </DropdownItem>

                    <DropdownItem
                      icon={Users}
                      description="View account details & password security"
                      onClick={() => {
                        window.location.href = "/profile";
                      }}
                    >
                      My Profile &amp; Account
                    </DropdownItem>

                    <DropdownSeparator />

                    <DropdownItem icon={Sparkles} onClick={() => scrollToSection("features")}>
                      Features
                    </DropdownItem>
                    <DropdownItem icon={Layers} onClick={() => scrollToSection("modules")}>
                      Core Modules
                    </DropdownItem>
                    <DropdownItem icon={CreditCard} onClick={() => scrollToSection("pricing")}>
                      Pricing
                    </DropdownItem>

                    <DropdownSeparator />

                    <DropdownItem
                      icon={LogOut}
                      destructive
                      onClick={onSignOut}
                      description="Disconnect session from this browser"
                    >
                      Sign Out
                    </DropdownItem>
                  </>
                ) : (
                  <>
                    <DropdownLabel>Explore CampusFlow</DropdownLabel>
                    <DropdownItem icon={Sparkles} onClick={() => scrollToSection("features")}>
                      Features
                    </DropdownItem>
                    <DropdownItem icon={Layers} onClick={() => scrollToSection("modules")}>
                      Core Modules
                    </DropdownItem>
                    <DropdownItem icon={CreditCard} onClick={() => scrollToSection("pricing")}>
                      Pricing
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      icon={ArrowRight}
                      onClick={() => {
                        window.location.href = "/register";
                      }}
                    >
                      Get Started Free
                    </DropdownItem>
                    <DropdownItem
                      icon={User}
                      onClick={() => {
                        window.location.href = "/login";
                      }}
                    >
                      Sign In
                    </DropdownItem>
                  </>
                )}
              </DropdownContent>
            </CustomDropdown>
          </div>
        </div>
      </div>
    </header>
  );
}
