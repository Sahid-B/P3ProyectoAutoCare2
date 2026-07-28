const nodemailer = require('nodemailer');
const dns = require('dns');

// Forzar preferiblemente IPv4 para evitar problemas de ruteo IPv6 (ENETUNREACH) en proveedores cloud como Render
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignorar en entornos node donde no este disponible
}

// Configuracion SMTP y APIs de Correo
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || (SMTP_USER ? `AutoCare Security <${SMTP_USER}>` : 'AutoCare Security <noreply@autocare.com>');
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BREVO_API_KEY = process.env.BREVO_API_KEY;

/** Indica si hay configuracion de correo suficiente. */
function smtpConfigurado() {
  return Boolean(BREVO_API_KEY || RESEND_API_KEY || (SMTP_USER && SMTP_PASS));
}

let transporter = null;
function obtenerTransporter() {
  if (!SMTP_USER || !SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      requireTLS: !SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }
  return transporter;
}

/**
 * Envia un codigo de verificacion de 6 digitos (segundo factor / activacion por correo).
 * Soporta Brevo API, Resend HTTP API y SMTP de Gmail.
 */
async function enviarCodigoOTP(destinatario, codigoOtp) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1d4ed8; margin: 0;">AutoCare Security</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Autenticacion en 2 Pasos (2FA)</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">
        Has solicitado iniciar sesion o verificar tu cuenta en <strong>AutoCare</strong>.
      </p>
      <p style="color: #334155; font-size: 15px; margin-top: 16px;">Tu codigo de seguridad temporal es:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8; background-color: #eff6ff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #3b82f6;">
          ${codigoOtp}
        </span>
      </div>
      <p style="color: #64748b; font-size: 13px; text-align: center;">
        Este codigo expirara en 10 minutos. Si no solicitaste este acceso, ignora este mensaje.
      </p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        AutoCare App &copy; ${new Date().getFullYear()}
      </p>
    </div>
  `;

  // 1. Si existe BREVO_API_KEY, usar Brevo REST API sobre HTTPS (Puerto 443 - Permite enviar a CUALQUIER correo gratis)
  if (BREVO_API_KEY) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: 'AutoCare Security', email: process.env.BREVO_SENDER || SMTP_USER || 'sahibosq@gmail.com' },
          to: [{ email: destinatario }],
          subject: `[AutoCare] Codigo de verificacion: ${codigoOtp}`,
          htmlContent: htmlContent,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[email-service] Correo enviado via Brevo API a ${destinatario} (ID: ${data.messageId})`);
        return { success: true, messageId: data.messageId };
      } else {
        console.error('[email-service] Error de Brevo API:', data);
      }
    } catch (err) {
      console.error('[email-service] Excepcion conectando a Brevo API:', err.message);
    }
  }

  // 2. Si existe RESEND_API_KEY, usar Resend REST API sobre HTTPS (Puerto 443)
  if (RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'AutoCare <onboarding@resend.dev>',
          to: [destinatario],
          subject: `[AutoCare] Codigo de verificacion: ${codigoOtp}`,
          html: htmlContent,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[email-service] Correo enviado via Resend API a ${destinatario} (ID: ${data.id})`);
        return { success: true, messageId: data.id };
      } else {
        console.error('[email-service] Error de la API de Resend:', data);
      }
    } catch (err) {
      console.error('[email-service] Excepcion conectando a Resend API:', err.message);
    }
  }

  // 3. Intentar transporte SMTP de Gmail
  const tx = obtenerTransporter();
  if (!tx) {
    console.warn('[email-service] Servicio de correo no configurado (falta BREVO_API_KEY, RESEND_API_KEY o credenciales SMTP).');
    return { success: false, error: 'Correo no configurado' };
  }

  try {
    const info = await tx.sendMail({
      from: SMTP_FROM,
      to: destinatario,
      subject: `[AutoCare] Codigo de verificacion: ${codigoOtp}`,
      html: htmlContent,
    });
    console.log(`[email-service] Correo enviado via SMTP a ${destinatario} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[email-service] Error enviando correo via SMTP:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  enviarCodigoOTP,
  smtpConfigurado,
};
