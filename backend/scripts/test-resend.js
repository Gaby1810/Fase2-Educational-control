/**
 * Prueba rápida de Resend.
 * Uso: node scripts/test-resend.js tu@correo.com
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const correo = process.argv[2];

if (!process.env.RESEND_API_KEY) {
    console.error('Falta RESEND_API_KEY en backend/.env');
    process.exit(1);
}

if (!correo) {
    console.error('Uso: node scripts/test-resend.js destino@correo.com');
    process.exit(1);
}

const { enviarCodigoRecuperacion } = require('../src/services/email');

enviarCodigoRecuperacion(correo, 'Prueba', '123456')
    .then((r) => {
        console.log('OK', r);
        process.exit(0);
    })
    .catch((e) => {
        console.error('Error:', e.message);
        process.exit(1);
    });
