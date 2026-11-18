import nodemailer from "nodemailer";

export interface SendVerificationEmailParams {
  to: string;
  name: string;
  code: string;
  roleTitle: string;
  institution: string;
}

export interface SendEmailResult {
  sent: boolean;
  deliveryMode: "resend" | "smtp" | "dev-preview";
  previewUrl?: string;
  devCode?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSmtpConfig() {
  const user = process.env.SMTP_USER?.trim() || "";
  const pass = process.env.SMTP_PASS?.trim() || "";
  const isPlaceholder =
    !user ||
    !pass ||
    user.includes("your-email@gmail.com") ||
    pass.includes("your-16-char");

  if (isPlaceholder) return null;

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return {
    user,
    pass: pass.replace(/\s+/g, ""),
    host,
    port,
    secure,
  };
}

async function deliverEmailViaProvider(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  senderLabel: string;
  timeoutMs?: number;
}): Promise<"resend" | "smtp" | null> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const fromAddress =
      process.env.EMAIL_FROM?.trim() ||
      process.env.SMTP_FROM?.trim() ||
      `${params.senderLabel} <onboarding@resend.dev>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[MAILER_RESEND_ERROR]", res.status, errBody);
      throw new Error("Unable to send email via configured email provider.");
    }

    return "resend";
  }

  const smtp = getSmtpConfig();
  if (smtp) {
    const timeout = params.timeoutMs ?? 10000;
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      connectionTimeout: timeout,
      greetingTimeout: timeout,
      socketTimeout: timeout + 5000,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM?.trim() ||
        process.env.EMAIL_FROM?.trim() ||
        `${params.senderLabel} <${smtp.user}>`,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    return "smtp";
  }

  return null;
}

function buildVerificationEmailHtml({
  name,
  code,
  roleTitle,
  institution,
}: Omit<SendVerificationEmailParams, "to">): string {
  const safeName = escapeHtml(name);
  const safeRole = escapeHtml(roleTitle);
  const safeInst = escapeHtml(institution);
  const formattedCode = code.split("").join(" ");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your CampusFlow Account</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;">
          <tr>
            <td style="background:#18181b;padding:24px 28px;text-align:left;">
              <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">CampusFlow</div>
              <div style="font-size:12px;color:#a1a1aa;margin-top:4px;">${safeInst} &bull; ${safeRole}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#18181b;">Verify your email address</h1>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#52525b;">
                Hi <strong>${safeName}</strong>, thank you for registering for your <strong>${safeRole}</strong> workspace on CampusFlow. Enter the 6-digit verification code below to complete your signup and open your dashboard:
              </p>
              <div style="background:#f4f4f5;border:1px dashed #d4d4d8;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
                <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#71717a;margin-bottom:8px;">Verification Code</div>
                <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:32px;font-weight:800;letter-spacing:0.25em;color:#18181b;">${formattedCode}</div>
              </div>
              <p style="margin:0 0 8px 0;font-size:12px;line-height:1.5;color:#71717a;">
                This code is valid for <strong>10 minutes</strong> and can only be used once.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#71717a;">
                If you did not request this account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;border-top:1px solid #e4e4e7;padding:16px 28px;text-align:center;font-size:11px;color:#a1a1aa;">
              &copy; ${new Date().getFullYear()} CampusFlow Academic Management System
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export async function sendVerificationEmail(
  params: SendVerificationEmailParams
): Promise<SendEmailResult> {
  const subject = `${params.code} is your CampusFlow verification code`;
  const html = buildVerificationEmailHtml(params);
  const text = `Hi ${params.name},\n\nYour CampusFlow (${params.roleTitle}) verification code is: ${params.code}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.`;

  const provider = await deliverEmailViaProvider({
    to: params.to,
    subject,
    html,
    text,
    senderLabel: "CampusFlow",
  });
  if (provider) {
    return { sent: true, deliveryMode: provider };
  }

  if (process.env.NODE_ENV !== "production") {
    let previewUrl: string | undefined;
    try {
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      const info = await testTransporter.sendMail({
        from: '"CampusFlow" <no-reply@campusflow.edu>',
        to: params.to,
        subject,
        text,
        html,
      });
      const url = nodemailer.getTestMessageUrl(info);
      if (typeof url === "string") previewUrl = url;
    } catch {
      // Offline / Ethereal unreachable — log to server console below
    }

    console.info(
      `[DEV EMAIL VERIFICATION] To: ${params.to} | Code: ${params.code}${
        previewUrl ? ` | Preview: ${previewUrl}` : ""
      }`
    );

    return {
      sent: true,
      deliveryMode: "dev-preview",
      previewUrl,
      devCode: params.code,
    };
  }

  throw new Error(
    "Email delivery service is not configured. Please contact the system administrator."
  );
}

export interface SendSubscriptionEmailParams {
  to: string;
  name: string;
  institution: string;
  eventType:
    | "renewal_reminder"
    | "grace_warning"
    | "payment_confirmed"
    | "auto_renewed"
    | "canceled";
  planName: string;
  daysRemaining?: number;
  periodEndDate?: string;
  amountLabel?: string;
  invoiceId?: string;
}

export async function sendSubscriptionEmail(
  params: SendSubscriptionEmailParams
): Promise<boolean> {
  const safeName = escapeHtml(params.name || "School Administrator");
  const safeInst = escapeHtml(params.institution || "CampusFlow Institution");
  const safePlan = escapeHtml(params.planName);
  const safeEndDate = escapeHtml(params.periodEndDate || "");
  const safeAmount = escapeHtml(params.amountLabel || "");
  const safeInvoice = escapeHtml(params.invoiceId || "");

  let subject = "";
  let headline = "";
  let bodyCopy = "";
  let accentColor = "#18181b";

  if (params.eventType === "renewal_reminder") {
    const d = params.daysRemaining ?? 3;
    subject = `Action Required: ${safeInst} CampusFlow plan expires in ${d} ${d === 1 ? "day" : "days"}`;
    headline = `Your ${safePlan} expires in ${d} ${d === 1 ? "day" : "days"}`;
    bodyCopy = `Hi <strong>${safeName}</strong>, this is a friendly reminder that your <strong>${safePlan}</strong> for <strong>${safeInst}</strong> will end on <strong>${safeEndDate}</strong>. Please renew or enable Auto-Renew in your Admin Hub &rarr; Subscription &amp; Plan panel to ensure uninterrupted access.`;
    accentColor = "#d97706";
  } else if (params.eventType === "grace_warning") {
    subject = `Urgent: 24-Hour Grace Period Active for ${safeInst} on CampusFlow`;
    headline = "Your 24-Hour Grace Period Has Started";
    bodyCopy = `Hi <strong>${safeName}</strong>, your <strong>${safePlan}</strong> for <strong>${safeInst}</strong> has ended. You have <strong>24 hours</strong> to complete your subscription payment before workspace access is paused.`;
    accentColor = "#e11d48";
  } else if (params.eventType === "auto_renewed") {
    subject = `Payment Receipt: ${safePlan} Auto-Renewed (${safeInvoice})`;
    headline = "Monthly Subscription Auto-Renewed";
    bodyCopy = `Hi <strong>${safeName}</strong>, your <strong>${safePlan}</strong> (${safeAmount}) for <strong>${safeInst}</strong> has been automatically renewed until <strong>${safeEndDate}</strong>. Invoice Reference: <strong>${safeInvoice}</strong>.`;
    accentColor = "#059669";
  } else if (params.eventType === "canceled") {
    subject = `Subscription Cancellation Confirmed — ${safeInst}`;
    headline = "Subscription Scheduled to Cancel";
    bodyCopy = `Hi <strong>${safeName}</strong>, your cancellation request for <strong>${safePlan}</strong> has been processed and Auto-Renew has been turned off. Your campus retains full access until <strong>${safeEndDate}</strong>.`;
    accentColor = "#52525b";
  } else {
    subject = `Welcome to ${safePlan} — Payment Confirmed (${safeInvoice})`;
    headline = "Subscription Activated Successfully";
    bodyCopy = `Hi <strong>${safeName}</strong>, thank you for subscribing <strong>${safeInst}</strong> to <strong>${safePlan}</strong> (${safeAmount}). Your billing cycle is active through <strong>${safeEndDate}</strong>. Invoice Reference: <strong>${safeInvoice}</strong>.`;
    accentColor = "#059669";
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:540px;background:#ffffff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;">
        <tr><td style="background:${accentColor};padding:22px 26px;">
          <div style="font-size:19px;font-weight:700;color:#ffffff;">CampusFlow Billing</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:4px;">${safeInst}</div>
        </td></tr>
        <tr><td style="padding:26px;">
          <h1 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#18181b;">${headline}</h1>
          <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#52525b;">${bodyCopy}</p>
          <p style="margin:0;font-size:12px;color:#71717a;">Manage billing, invoices, Auto-Renew, or Cancel Anytime from your Admin Hub &rarr; Subscription &amp; Plan tab.</p>
        </td></tr>
        <tr><td style="background:#fafafa;border-top:1px solid #e4e4e7;padding:14px 26px;text-align:center;font-size:11px;color:#a1a1aa;">
          &copy; ${new Date().getFullYear()} CampusFlow Academic SaaS Platform
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const text = `${headline}\n\n${bodyCopy.replace(/<[^>]+>/g, "")}`;

  try {
    const provider = await deliverEmailViaProvider({
      to: params.to,
      subject,
      html,
      text,
      senderLabel: "CampusFlow Billing",
      timeoutMs: 8000,
    });
    if (!provider) {
      console.info(
        `[SUBSCRIPTION EMAIL LOG] To: ${params.to} | Event: ${params.eventType} | Subject: ${subject}`
      );
    }
    return true;
  } catch (err) {
    console.error("[SUBSCRIPTION_EMAIL_ERROR]", err);
    return false;
  }
}
