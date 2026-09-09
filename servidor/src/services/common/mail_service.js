import nodemailer from "nodemailer";
import { env } from "../../configuracion_servidor/env.js";
export function mailConfigured() { return !!(env.SMTP_USER && env.SMTP_PASS); }
export async function enviarEmail({ to, subject, html, text }) {
  if (!mailConfigured()) throw new Error("SMTP no configurado");
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 10000, socketTimeout: 15000,
  });
  return transporter.sendMail({ from: env.SMTP_FROM || env.SMTP_USER, to, subject, html, text });
}
