import type { ISchoolSubscription, SubscriptionPlanId } from "@/models/School";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;

export const TRIAL_DURATION_DAYS = 14;
export const GRACE_PERIOD_HOURS = 24;
export const RENEWAL_REMINDER_WINDOW_DAYS = 3;
export const MONTHLY_CYCLE_DAYS = 30;

export interface SaaSPlanConfig {
  id: Exclude<SubscriptionPlanId, "trial">;
  name: string;
  tagline: string;
  pricePkr: number;
  priceUsd: number;
  studentLimit: string;
  popular?: boolean;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SaaSPlanConfig[] = [
  {
    id: "starter",
    name: "Starter Campus",
    tagline: "Ideal for growing primary & middle schools",
    pricePkr: 4900,
    priceUsd: 19,
    studentLimit: "Up to 250 Students",
    features: [
      "All 5 Portals (Admin, Coordinator, Teacher, Student, Parent)",
      "3-Term Exam Report Cards & Section RBAC",
      "PDF & Image Timetable, Syllabus & Date Sheet Uploads",
      "Pakistani Bank / Raast / JazzCash Fee Vouchers",
    ],
  },
  {
    id: "growth",
    name: "Growth Academy",
    tagline: "Complete AI-powered suite for high schools & colleges",
    pricePkr: 9900,
    priceUsd: 39,
    studentLimit: "Up to 1,000 Students",
    popular: true,
    features: [
      "Everything in Starter Campus",
      "Gemini AI Lesson Planner, Quiz Maker & Study Coach",
      "Faculty Attendance & Substitution Desk",
      "Priority Email + In-App Renewal Alerts & Auto-Renew",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Network",
    tagline: "Unlimited capacity for multi-section school networks",
    pricePkr: 19900,
    priceUsd: 79,
    studentLimit: "Unlimited Students & Sections",
    features: [
      "Everything in Growth Academy",
      "Unlimited Faculty, Coordinators & Enrolled Students",
      "Full Financial Analytics & Audit Transparency",
      "Dedicated Onboarding & Priority SLA Support",
    ],
  },
];

export function getPlanById(planId: string): SaaSPlanConfig | null {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId) || null;
}

export function buildInitialTrialSubscription(now = new Date()): ISchoolSubscription {
  const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * DAY_MS);
  const graceEndsAt = new Date(trialEndsAt.getTime() + GRACE_PERIOD_HOURS * HOUR_MS);

  return {
    planId: "trial",
    planName: "14-Day Free Trial",
    pricePkr: 0,
    priceUsd: 0,
    status: "trialing",
    trialStartsAt: now,
    trialEndsAt,
    currentPeriodStart: now,
    currentPeriodEnd: trialEndsAt,
    graceEndsAt,
    autoRenew: true,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    paymentMethod: null,
    sentReminders: [],
    billingHistory: [],
  };
}
