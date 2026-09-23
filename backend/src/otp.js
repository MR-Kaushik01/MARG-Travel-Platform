import crypto from "node:crypto";
import nodemailer from "nodemailer";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_ATTEMPTS = 8;

function code() { return String(crypto.randomInt(100000, 1000000)); }
function hash(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }
function normalizeEmail(email) { return email.toLowerCase().trim(); }
function normalizePhone(phone) { return phone ? String(phone).trim() : null; }
function emailEnabled() { return Boolean(process.env.RESEND_API_KEY && process.env.OTP_FROM_EMAIL); }
function smsEnabled() { return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER); }

export function otpConfig() {
  return { emailEnabled: emailEnabled(), smsEnabled: smsEnabled() };
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmailOtp(to, otp) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("Gmail SMTP is not configured.");
  }

  await transporter.sendMail({
    from: `"MARG" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your MARG verification code",
    html: `
      <h2>Your MARG verification code</h2>
      <p>Your verification code is:</p>
      <h1>${otp}</h1>
      <p>This code expires in 5 minutes.</p>
      <p>Do not share this code with anyone.</p>
    `,
  });
}

async function sendSmsOtp(to, otp) {
  if (!smsEnabled()) throw new Error("SMS OTP is not configured. Add Twilio credentials in the backend environment.");
  const body = new URLSearchParams({ To: to, From: process.env.TWILIO_FROM_NUMBER, Body: `MARG verification code: ${otp}. It expires in 5 minutes. Do not share it.` });
  const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response.ok) throw new Error(`SMS OTP could not be sent (${response.status}).`);
}

export async function createChallenge(prisma, data) {
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);
  const existing = await prisma.otpChallenge.findFirst({ where: { email, purpose: data.purpose }, orderBy: { createdAt: "desc" } });
  const now = new Date();
  if (existing && now.getTime() - existing.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new Error("Please wait 45 seconds before requesting another OTP.");
  }
  const emailCode = code();
  const smsCode = phone ? code() : null;
  const challenge = await prisma.otpChallenge.create({ data: {
    email, phone, passwordHash: data.passwordHash, name: data.name, role: data.role, purpose: data.purpose,
    codeHashEmail: hash(emailCode), codeHashSms: smsCode ? hash(smsCode) : null,
    emailExpiresAt: new Date(now.getTime() + OTP_TTL_MS), smsExpiresAt: smsCode ? new Date(now.getTime() + OTP_TTL_MS) : null,
    emailLastSentAt: now, smsLastSentAt: smsCode ? now : null
  }});
  await sendEmailOtp(email, emailCode);
  if (smsCode) await sendSmsOtp(phone, smsCode);
  return { id: challenge.id, emailRequired: true, smsRequired: Boolean(phone), expiresInSeconds: OTP_TTL_MS / 1000 };
}

export async function resendChallenge(prisma, id) {
  const c = await prisma.otpChallenge.findUnique({ where: { id } });
  if (!c) throw new Error("OTP request not found. Please start again.");
  const now = new Date();
  const last = Math.max(c.emailLastSentAt?.getTime?.() || 0, c.smsLastSentAt?.getTime?.() || 0);
  if (now.getTime() - last < RESEND_COOLDOWN_MS) throw new Error("Please wait 45 seconds before requesting another OTP.");
  const emailCode = code();
  const smsCode = c.phone ? code() : null;
  const updated = await prisma.otpChallenge.update({ where: { id }, data: { codeHashEmail: hash(emailCode), codeHashSms: smsCode ? hash(smsCode) : null, emailVerifiedAt: null, smsVerifiedAt: null, emailExpiresAt: new Date(now.getTime()+OTP_TTL_MS), smsExpiresAt: smsCode ? new Date(now.getTime()+OTP_TTL_MS) : null, emailLastSentAt: now, smsLastSentAt: smsCode ? now : null, attempts: 0 } });
  await sendEmailOtp(updated.email, emailCode);
  if (smsCode) await sendSmsOtp(updated.phone, smsCode);
  return { id: updated.id, emailRequired: true, smsRequired: Boolean(updated.phone), expiresInSeconds: OTP_TTL_MS / 1000 };
}

export async function verifyChallenge(prisma, id, emailOtp, smsOtp) {
  const c = await prisma.otpChallenge.findUnique({ where: { id } });
  if (!c) throw new Error("OTP request not found. Please start again.");
  if (c.attempts >= MAX_ATTEMPTS) throw new Error("Too many incorrect OTP attempts. Please start again.");
  const now = new Date();
  let emailOk = Boolean(c.emailVerifiedAt);
  let smsOk = Boolean(c.smsVerifiedAt) || !c.codeHashSms;
  if (!emailOk) {
    if (!emailOtp || now > c.emailExpiresAt || hash(emailOtp) !== c.codeHashEmail) {
      await prisma.otpChallenge.update({ where: { id }, data: { attempts: { increment: 1 } } });
      throw new Error("Invalid or expired email OTP.");
    }
    emailOk = true;
    await prisma.otpChallenge.update({ where: { id }, data: { emailVerifiedAt: now } });
  }
  if (c.codeHashSms && !smsOk) {
    if (!smsOtp || now > c.smsExpiresAt || hash(smsOtp) !== c.codeHashSms) {
      await prisma.otpChallenge.update({ where: { id }, data: { attempts: { increment: 1 } } });
      throw new Error("Invalid or expired SMS OTP.");
    }
    smsOk = true;
    await prisma.otpChallenge.update({ where: { id }, data: { smsVerifiedAt: now } });
  }
  const fresh = await prisma.otpChallenge.findUnique({ where: { id } });
  return { ...fresh, verified: emailOk && smsOk };
}
