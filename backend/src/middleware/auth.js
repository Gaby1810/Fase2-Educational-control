const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT.
 * Lee el header Authorization: Bearer <token>, valida y deja
 * los datos del usuario en req.usuario.
 */
module.exports = function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ')
        ? header.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
        req.usuario = payload;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};
