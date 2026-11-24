export interface PlanOption {
  id: "starter" | "growth" | "enterprise";
  name: string;
  tagline: string;
  pricePkr: number;
  priceUsd: number;
  studentLimit: string;
  popular?: boolean;
  features: string[];
}

export interface GatewayStatusInfo {
  provider: string;
  configured: boolean;
  environment: "sandbox" | "production";
  webhookPath: string;
}

export interface BillingInvoiceRecord {
  invoiceId: string;
  planId: string;
  planName: string;
  amountPkr: number;
  amountUsd: number;
  paymentMethod: string;
  status: "paid" | "auto_renewed";
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  invoiceUrl?: string;
}

export interface SubscriptionData {
  schoolName: string;
  planId: "trial" | "starter" | "growth" | "enterprise";
  planName: string;
  pricePkr: number;
  priceUsd: number;
  status: "trialing" | "active" | "grace_period" | "canceled" | "expired";
  isTrial: boolean;
  isLocked: boolean;
  isGracePeriod: boolean;
  showRenewalBanner: boolean;
  daysRemaining: number;
  hoursRemainingInGrace: number;
  trialStartsAt?: string;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd: string;
  graceEndsAt: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: {
    type: "card" | "bank" | "wallet";
    brand: string;
    last4: string;
    label: string;
  } | null;
  billingHistory: BillingInvoiceRecord[];
}
