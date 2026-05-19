/**
 * Servicio de envío de correos.
 *
 * Soporta 3 modos (decide automáticamente según el .env):
 *   1. Gmail SMTP   (si hay GMAIL_USER + GMAIL_APP_PASSWORD)
 *   2. Resend       (si hay RESEND_API_KEY)
 *   3. Modo DEV     (sin nada configurado → loguea el código en consola)
 */

const dns = require('dns');
const nodemailer = require('nodemailer');

dns.setDefaultResultOrder('ipv4first');

const APP_NAME = process.env.APP_NAME || 'EducationalControl';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
    ? process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') // quita espacios accidentales
    : null;

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// =========================
// CONFIGURAR TRANSPORTE
// =========================

let transporter = null;
let modo = 'DEV';
let remitente = '';

if (GMAIL_USER && GMAIL_APP_PASSWORD) {

    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4, // forzar IPv4 (evita ENETUNREACH en Railway)
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD
        },
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 20_000
    });

    remitente = `${APP_NAME} <${GMAIL_USER}>`;
    modo = 'GMAIL';

    console.log(`📧 Email: Gmail SMTP listo (${GMAIL_USER})`);

} else if (RESEND_API_KEY) {

    // Fallback: Resend (limitado a tu correo de registro si no verificaste dominio)
    const { Resend } = require('resend');
    const resend = new Resend(RESEND_API_KEY);
    remitente = process.env.EMAIL_FROM || `${APP_NAME} <onboarding@resend.dev>`;
    modo = 'RESEND';

    transporter = {
        sendMail: async ({ to, subject, html }) => {
            const { data, error } = await resend.emails.send({
                from: remitente,
                to,
                subject,
                html
            });
            if (error) throw new Error(error.message || 'Error Resend');
            return data;
        }
    };

    console.log("📧 Email: Resend listo");

} else {
    console.warn(
        "⚠ Sin credenciales de email configuradas. Los códigos se imprimirán en consola (modo DEV)."
    );
}

// =========================
// PLANTILLA HTML
// =========================
function htmlCodigo(nombre, codigo) {
    return `
    <div style="font-family: Arial, Helvetica, sans-serif; background:#000c2d; padding:32px; color:#dfe4ff;">
      <div style="max-width:480px; margin:0 auto; background:#001c51; border-radius:16px; padding:32px;">

        <h1 style="margin:0 0 8px 0; color:#cbd6ff; font-size:22px;">
          ${APP_NAME}
        </h1>
        <p style="margin:0 0 24px 0; color:#8aa8ff; font-size:13px;">
          Recuperación de contraseña
        </p>

        <p style="font-size:15px; line-height:1.5;">
          Hola ${nombre || 'estudiante'},<br/>
          recibimos una solicitud para restablecer la contraseña de tu cuenta.
          Usa el siguiente código en la app:
        </p>

        <div style="background:#00276c; border-radius:12px; padding:24px; text-align:center; margin:24px 0;">
          <div style="font-size:11px; color:#8aa8ff; letter-spacing:2px; margin-bottom:8px;">
            CÓDIGO DE VERIFICACIÓN
          </div>
          <div style="font-size:34px; font-weight:bold; color:#cbd6ff; letter-spacing:10px;">
            ${codigo}
          </div>
        </div>

        <p style="font-size:13px; color:#8aa8ff; line-height:1.5;">
          Este código expira en <b>15 minutos</b>.<br/>
          Si tú no solicitaste este cambio, puedes ignorar este correo.
        </p>

        <hr style="border:none; border-top:1px solid #18429a; margin:24px 0;"/>

        <p style="font-size:11px; color:#4f71cb; text-align:center;">
          ${APP_NAME} • Por favor no respondas a este correo.
        </p>
      </div>
    </div>
  `;
}

// =========================
// FUNCIÓN PÚBLICA
// =========================
async function enviarCodigoRecuperacion(correo, nombre, codigo) {

    if (!transporter) {
        console.log(
            `📧 [DEV] Código para ${correo}: ${codigo} (expira en 15 min)`
        );
        return { id: 'dev-mode', skipped: true };
    }

    try {

        const info = await transporter.sendMail({
            from: remitente,
            to: correo,
            subject: `Tu código de recuperación - ${APP_NAME}`,
            html: htmlCodigo(nombre, codigo)
        });

        console.log(`✅ Email enviado vía ${modo} a ${correo}`);
        return info;

    } catch (error) {

        console.error(`❌ Error enviando email vía ${modo}:`, error.message);
        throw new Error("No se pudo enviar el correo");
    }
}

module.exports = {
    enviarCodigoRecuperacion
};
