const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || 'rsbosquez@espe.edu.ec';
const SMTP_PASS = process.env.SMTP_PASS || 'rraaleizrexpilsg';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true para 465, false para 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Envia un codigo de verificacion de 6 digitos al correo electronico especificado.
 */
async function enviarCodigoOTP(destinatario, codigoOtp) {
  try {
    const opcionesCorreo = {
      from: `"AutoCare Seguridad" <${SMTP_USER}>`,
      to: destinatario,
      subject: `[AutoCare] Código de Verificación 2FA: ${codigoOtp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #1d4ed8; margin: 0;">AutoCare Security</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Autenticación en 2 Pasos (2FA)</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">
            Has solicitado iniciar sesión o verificar tu cuenta en <strong>AutoCare</strong>.
          </p>
          <p style="color: #334155; font-size: 15px; margin-top: 16px;">
            Tu código de seguridad temporal es:
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8; background-color: #eff6ff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #3b82f6;">
              ${codigoOtp}
            </span>
          </div>
          <p style="color: #64748b; font-size: 13px; text-align: center;">
            Este código expirará en 10 minutos. Si no solicitaste este acceso, puedes ignorar este mensaje.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            AutoCare App &copy; ${new Date().getFullYear()} - Sistema Integrativo de Control Vehicular
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(opcionesCorreo);
    console.log('[email-service] Correo OTP enviado exitosamente a:', destinatario, 'Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[email-service] Error enviando correo OTP:', error);
    // Retornar objeto informativo
    return { success: false, error: error.message };
  }
}

module.exports = {
  enviarCodigoOTP,
};
