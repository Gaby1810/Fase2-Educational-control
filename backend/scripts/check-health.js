/**
 * Verifica /api/health tras desplegar en Railway.
 * Uso: node scripts/check-health.js https://tu-dominio.up.railway.app
 */
const base = process.argv[2] || process.env.RAILWAY_PUBLIC_URL;

if (!base) {
    console.error('Uso: node scripts/check-health.js <URL_BASE>');
    console.error('Ej: node scripts/check-health.js https://xxx.up.railway.app');
    process.exit(1);
}

const url = `${base.replace(/\/$/, '')}/api/health`;

fetch(url)
    .then((r) => r.json())
    .then((data) => {
        if (data.status === 'ok') {
            console.log('OK', url, data);
            process.exit(0);
        }
        console.error('Respuesta inesperada:', data);
        process.exit(1);
    })
    .catch((err) => {
        console.error('Error:', err.message);
        process.exit(1);
    });
