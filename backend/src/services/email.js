/**
 * Envío de correos — recuperación de contraseña.
 *
 * En Railway el SMTP de Gmail (puertos 465/587) suele fallar o perder paquetes
 * (QDISC_DROP en el flujo de red). Usar Resend (HTTPS) en producción.
 *
 * Prioridad:
 *   1. RESEND_API_KEY  (recomendado en Railway)
 *   2. GMAIL_USER + GMAIL_APP_PASSWORD  (local / si SMTP no está bloqueado)
 *   3. DEV — imprime el código en consola
 */

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const APP_NAME = process.env.APP_NAME || 'EducationalControl';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
    ? process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '')
    : null;

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || '').toLowerCase();

const IS_RAILWAY = Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_SERVICE_NAME ||
    process.env.RAILWAY_PROJECT_NAME
);

let transporter = null;
let modo = 'DEV';
let remitente = '';

function setupResend() {
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
            if (error) throw new Error(error.message || JSON.stringify(error));
            return data;
        }
    };

    console.log(`📧 Email: Resend listo (from: ${remitente})`);
}

function setupGmail() {
    const nodemailer = require('nodemailer');

    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4,
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

    console.log(`📧 Email: Gmail SMTP (${GMAIL_USER}) [IPv4, puerto 465]`);

    if (IS_RAILWAY) {
        console.warn(
            '⚠️  Railway suele bloquear SMTP saliente (QDISC_DROP en :465). ' +
            'Configura RESEND_API_KEY para correos fiables.'
        );
    }
}

const preferResend =
    EMAIL_PROVIDER === 'resend' ||
    (EMAIL_PROVIDER !== 'gmail' && RESEND_API_KEY && (IS_RAILWAY || !GMAIL_USER));

const preferGmail =
    EMAIL_PROVIDER === 'gmail' ||
    (!preferResend && GMAIL_USER && GMAIL_APP_PASSWORD);

if (preferResend && RESEND_API_KEY) {
    setupResend();
} else if (preferGmail) {
    setupGmail();
} else if (RESEND_API_KEY) {
    setupResend();
} else {
    console.warn('⚠️  Sin email configurado. Códigos solo en consola (modo DEV).');
    if (IS_RAILWAY) {
        console.warn('⚠️  En Railway añade RESEND_API_KEY y EMAIL_FROM en Variables.');
    }
}

function htmlCodigo(nombre, codigo) {
    return `
    <div style="font-family: Arial, Helvetica, sans-serif; background:#000c2d; padding:32px; color:#dfe4ff;">
      <div style="max-width:480px; margin:0 auto; background:#001c51; border-radius:16px; padding:32px;">
        <h1 style="margin:0 0 8px 0; color:#cbd6ff; font-size:22px;">${APP_NAME}</h1>
        <p style="margin:0 0 24px 0; color:#8aa8ff; font-size:13px;">Recuperación de contraseña</p>
        <p style="font-size:15px; line-height:1.5;">
          Hola ${nombre || 'estudiante'},<br/>
          usa este código en la app:
        </p>
        <div style="background:#00276c; border-radius:12px; padding:24px; text-align:center; margin:24px 0;">
          <div style="font-size:34px; font-weight:bold; color:#cbd6ff; letter-spacing:10px;">${codigo}</div>
        </div>
        <p style="font-size:13px; color:#8aa8ff;">Expira en <b>15 minutos</b>.</p>
      </div>
    </div>
  `;
}

async function enviarCodigoRecuperacion(correo, nombre, codigo) {

    if (!transporter) {
        console.log(`📧 [DEV] forgot-password | ${correo} | código: ${codigo}`);
        return { id: 'dev-mode', skipped: true };
    }

    const inicio = Date.now();
    console.log(`📧 [${modo}] Enviando a ${correo}...`);

    try {
        const info = await transporter.sendMail({
            from: remitente,
            to: correo,
            subject: `Tu código de recuperación - ${APP_NAME}`,
            html: htmlCodigo(nombre, codigo)
        });

        const id = info?.id || info?.messageId || 'ok';
        console.log(`✅ [${modo}] Enviado a ${correo} | id=${id} | ${Date.now() - inicio}ms`);
        return info;

    } catch (error) {
        console.error(`❌ [${modo}] Falló ${correo} | ${Date.now() - inicio}ms | ${error.message}`);
        if (IS_RAILWAY && modo === 'GMAIL') {
            console.error('   → Usa RESEND_API_KEY: https://resend.com');
        }
        throw new Error('No se pudo enviar el correo');
    }
}

module.exports = {
    enviarCodigoRecuperacion,
    getEmailModo: () => modo
};
