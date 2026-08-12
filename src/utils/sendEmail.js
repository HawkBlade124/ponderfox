import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const FRONTEND_URL = (process.env.FRONTEND_URL || "https://ponderfox.com").replace(/\/+$/, "");

// `context` carries only server-derived data (the authenticated user's id/username
// and the app's SECRET_KEY) — never client input — so link destinations and
// personalized text can't be hijacked by the caller of /api/email/send.
export function buildEmailFromType(type, context = {}) {
  switch (type) {
    case "password_reset": {
      const token = jwt.sign(
        { id: context.userId, purpose: "password_reset" },
        context.secretKey,
        { expiresIn: "1h" }
      );
      return {
        subject: "Reset Your Password",
        body: `Click here to reset: ${FRONTEND_URL}/reset-password?token=${token}`,
        templateName: "password_reset"
      };
    }

    case "verify_email": {
      const token = jwt.sign(
        { id: context.userId, purpose: "verify_email" },
        context.secretKey,
        { expiresIn: "24h" }
      );
      return {
        subject: "Verify Your Email",
        body: `Click to verify: ${FRONTEND_URL}/verify-email?token=${token}`,
        templateName: "verify_email"
      };
    }

    case "welcome":
      return {
        subject: "Welcome to Ponderfox!",
        body: `Hey ${context.username}, welcome aboard!`,
        templateName: "welcome"
      };

    case "login_notification":
      return {
        subject: "New Sign-In to Your Ponderfox Account",
        body: `Hi ${context.username}, we noticed a new sign-in to your account at ${context.loginTime} from IP address ${context.ip}. If this was you, no action is needed. If you don't recognize this activity, change your password right away.`,
        templateName: "login_notification"
      };

    case "account_deleted":
      return {
        subject: "Your Ponderfox Account Has Been Deleted",
        body: `Hi ${context.username}, this confirms your Ponderfox account and all associated Thoughts have been permanently deleted. If you didn't request this, contact us right away.`,
        templateName: "account_deleted"
      };

    case "payment_failed":
      return {
        subject: "Your Payment Failed",
        body: `Your payment could not be processed. Update your billing info: ${FRONTEND_URL}/settings/billing`,
        templateName: "payment_failed"
      };

    case "revisit_reminder": {
      const names = context.thoughtNames.join(", ");
      return {
        subject: "You haven't checked in on some Thoughts in a while",
        body: `Hi ${context.username}, it's been a while since you visited: ${names}. Give them a revisit: ${FRONTEND_URL}/dashboard`,
        templateName: "revisit_reminder"
      };
    }
  }

  throw new Error("Unknown email type: " + type);
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("Email is not configured: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS");
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

export async function sendEmail(to, subject, body) {
  const from = process.env.SMTP_FROM || "no-reply@ponderfox.com";
  await getTransporter().sendMail({ from, to, subject, text: body });
}
