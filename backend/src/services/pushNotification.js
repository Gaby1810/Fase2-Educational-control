const https = require('https');

/**
 * Envía notificaciones push a través de Expo Push Notification Service.
 * @param {string|string[]} tokens  Expo push token(s)
 * @param {string} title
 * @param {string} body
 * @param {object} data             Payload extra (opcional)
 */
async function sendPushNotification(tokens, title, body, data = {}) {
    const tokenList = Array.isArray(tokens) ? tokens : [tokens];

    const messages = tokenList
        .filter(t => t && typeof t === 'string' && t.startsWith('ExponentPushToken['))
        .map(token => ({
            to: token,
            sound: 'default',
            title,
            body,
            data,
            priority: 'high',
        }));

    if (messages.length === 0) return;

    const payload = JSON.stringify(messages);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'exp.host',
            path: '/--/api/v2/push/send',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        const req = https.request(options, res => {
            let raw = '';
            res.on('data', chunk => (raw += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(raw));
                } catch {
                    resolve(raw);
                }
            });
        });

        req.on('error', err => {
            console.warn('[PushNotification] Error al enviar:', err.message);
            reject(err);
        });

        req.write(payload);
        req.end();
    });
}

/**
 * Obtiene los push tokens de los estudiantes inscritos en una clase.
 * @param {object} db       Pool de conexión MySQL
 * @param {number} claseId
 * @returns {Promise<string[]>}
 */
function getTokensDeEstudiantesEnClase(db, claseId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT u.push_token
            FROM inscripciones i
            INNER JOIN usuarios u ON u.id = i.estudiante_id
            WHERE i.clase_id = ?
              AND u.push_token IS NOT NULL
              AND u.push_token != ''
        `;
        db.query(sql, [claseId], (err, rows) => {
            if (err) return reject(err);
            resolve(rows.map(r => r.push_token));
        });
    });
}

/**
 * Obtiene el push token de un estudiante específico.
 * @param {object} db
 * @param {number} estudianteId
 * @returns {Promise<string|null>}
 */
function getTokenDeEstudiante(db, estudianteId) {
    return new Promise((resolve, reject) => {
        db.query(
            'SELECT push_token FROM usuarios WHERE id = ? LIMIT 1',
            [estudianteId],
            (err, rows) => {
                if (err) return reject(err);
                resolve(rows[0]?.push_token || null);
            }
        );
    });
}

module.exports = {
    sendPushNotification,
    getTokensDeEstudiantesEnClase,
    getTokenDeEstudiante,
};
