/**
 * Middleware que exige uno o varios roles.
 * Úsalo DESPUÉS de `auth`, ya que necesita req.usuario.
 *
 * Ejemplo:
 *   router.post('/crear', auth, requireRole('docente'), handler)
 */
module.exports = function requireRole(...rolesPermitidos) {
    return (req, res, next) => {

        if (!req.usuario) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                error: `Solo ${rolesPermitidos.join(' / ')} pueden hacer esta acción`
            });
        }

        next();
    };
};
