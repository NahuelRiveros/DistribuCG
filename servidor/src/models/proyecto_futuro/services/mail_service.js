import nodemailer from "nodemailer";
import { env } from "../configuracion_servidor/env.js";

const smtpConfigurado = () =>
  Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

export function crearMailer() {
  return nodemailer.createTransport({
    host:   env.SMTP_HOST,
    port:   env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function probarSMTP() {
  if (!smtpConfigurado()) {
    console.warn("⚠️  SMTP no configurado — emails desactivados");
    return;
  }
  const transporter = crearMailer();
  await transporter.verify();
  console.log("✅ SMTP OK");
}

export async function enviarMailRecuperacionPassword({ to, nombre, resetUrl }) {
  const minutos = env.RESET_TOKEN_EXPIRES_MINUTES;
  const appNombre = env.APP_FULL_NAME || env.APP_NAME || "Sistema";

  if (!smtpConfigurado()) {
    // En desarrollo: logueamos el link para no bloquearnos sin SMTP
    console.warn("⚠️  SMTP no configurado. Link de reset (solo dev):", resetUrl);
    return;
  }

  const mailer = crearMailer();

  await mailer.sendMail({
    from:    env.SMTP_FROM,
    to,
    subject: `Recuperación de contraseña — ${appNombre}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5; max-width: 520px;">
        <h2>Recuperación de contraseña</h2>

        <p>Hola ${nombre || "usuario"},</p>

        <p>Se recibió una solicitud para restablecer la contraseña de tu cuenta en <strong>${appNombre}</strong>.</p>

        <p>Hacé clic en el siguiente enlace para continuar:</p>

        <p>
          <a
            href="${resetUrl}"
            style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;
                   text-decoration:none;border-radius:8px;font-weight:bold;"
          >
            Restablecer contraseña
          </a>
        </p>

        <p>Este enlace vence en <strong>${minutos} minutos</strong>. Si no solicitaste este cambio, ignorá este correo.</p>
      </div>
    `,
  });
}
