const nodemailer = require('nodemailer');
const dns = require('dns');

// Forzar preferiblemente IPv4 para evitar problemas de ruteo IPv6 (ENETUNREACH) en proveedores cloud como Render
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignorar en entornos node donde no este disponible
}

// Configuracion SMTP leida de variables de entorno
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || (SMTP_USER ? `AutoCare Security <${SMTP_USER}>` : 'AutoCare Security <noreply@autocare.com>');

/** Indica si hay configuracion SMTP suficiente para enviar correos. */
function smtpConfigurado() {
  return Boolean(SMTP_USER && SMTP_PASS);
}

let transporter = null;
function obtenerTransporter() {
  if (!smtpConfigurado()) return null;
  if (!transporter) {
    // Transporte SMTP ultra-compatible con Gmail y servidores cloud (Render / Heroku)
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE, // false para puerto 587 (STARTTLS)
      requireTLS: !SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Permite handshakes SSL tras proxies o en contenedores cloud
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
 * Devuelve { success, messageId, error } sin lanzar excepciones.
 */
async function enviarCodigoOTP(destinatario, codigoOtp) {
  const tx = obtenerTransporter();
  if (!tx) {
    console.warn('[email-service] SMTP no configurado en el servidor.');
    return { success: false, error: 'SMTP no configurado' };
  }

  try {
    const info = await tx.sendMail({
      from: SMTP_FROM,
      to: destinatario,
      subject: `[AutoCare] Codigo de verificacion: ${codigoOtp}`,
      html: `
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
      `,
    });
    console.log(`[email-service] Correo enviado exitosamente a ${destinatario} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[email-service] Error enviando correo OTP:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  enviarCodigoOTP,
  smtpConfigurado,
};
