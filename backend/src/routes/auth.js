const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { enviarCodigoRecuperacion } = require("../services/email");
const requireAuth = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Genera código numérico de 6 dígitos
function generarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// =====================
// REGISTRO
// =====================
router.post("/register", async (req, res) => {

    const {
        nombre,
        correo,
        password,
        rol,
        grado,
        seccion,
        turno,
        materia_principal,
        telefono
    } = req.body;

    // Validaciones
    if (!nombre || !correo || !password || !rol) {
        return res.status(400).json({
            error: "Faltan campos obligatorios (nombre, correo, password, rol)"
        });
    }

    if (!EMAIL_REGEX.test(correo)) {
        return res.status(400).json({ error: "Correo inválido" });
    }

    if (String(password).length < 6) {
        return res.status(400).json({
            error: "La contraseña debe tener al menos 6 caracteres"
        });
    }

    if (!['estudiante', 'docente'].includes(rol)) {
        return res.status(400).json({ error: "Rol inválido" });
    }

    try {

        // Verificar correo duplicado antes de insertar
        db.query(
            "SELECT id FROM usuarios WHERE correo = ?",
            [correo],
            async (err, rows) => {

                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: "Error en servidor" });
                }

                if (rows.length > 0) {
                    return res.status(409).json({
                        error: "El correo ya está registrado"
                    });
                }

                const hash = await bcrypt.hash(password, 10);

                const sql = `
                    INSERT INTO usuarios
                    (nombre, correo, password, rol, grado, seccion, turno, materia_principal, telefono)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                db.query(sql, [
                    nombre,
                    correo,
                    hash,
                    rol,
                    grado || null,
                    seccion || null,
                    turno || null,
                    materia_principal || null,
                    telefono || null
                ], (err, result) => {

                    if (err) {
                        console.log(err);
                        return res.status(500).json({
                            error: "Error al registrar usuario"
                        });
                    }

                    res.json({
                        mensaje: "Usuario registrado correctamente",
                        id: result.insertId
                    });
                });
            }
        );

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error del servidor" });
    }
});


// =====================
// LOGIN
// =====================
router.post("/login", (req, res) => {

    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({
            error: "Correo y contraseña requeridos"
        });
    }

    db.query(
        "SELECT * FROM usuarios WHERE correo = ?",
        [correo],
        async (err, results) => {

            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error en servidor" });
            }

            if (results.length === 0) {
                return res.status(400).json({ error: "Usuario no existe" });
            }

            const usuario = results[0];

            const valido = await bcrypt.compare(password, usuario.password);

            if (!valido) {
                return res.status(400).json({ error: "Contraseña incorrecta" });
            }

            // 🚫 Nunca devolver el hash
            delete usuario.password;

            // Generar JWT
            const token = jwt.sign(
                {
                    id: usuario.id,
                    correo: usuario.correo,
                    rol: usuario.rol
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            res.json({
                mensaje: "Login correcto",
                token,
                usuario
            });
        }
    );
});

// =====================
// FORGOT PASSWORD — solicitar código por email
// POST /api/auth/forgot-password  { correo }
// =====================
router.post("/forgot-password", (req, res) => {

    const correo = String(req.body.correo || '').trim().toLowerCase();

    if (!correo || !EMAIL_REGEX.test(correo)) {
        return res.status(400).json({ error: "Correo inválido" });
    }

    // Respuesta genérica para evitar enumeración de cuentas
    const respuestaGenerica = {
        mensaje: "Si el correo está registrado, recibirás un código en breve."
    };

    db.query(
        "SELECT id, nombre FROM usuarios WHERE correo = ?",
        [correo],
        (err, rows) => {

            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error en servidor" });
            }

            if (rows.length === 0) {
                return res.json(respuestaGenerica);
            }

            const usuario = rows[0];
            const codigo = generarCodigo();
            const expira_en = new Date(Date.now() + 15 * 60 * 1000); // 15 min

            // Invalidar códigos activos previos
            db.query(
                "UPDATE password_resets SET usado = TRUE WHERE usuario_id = ? AND usado = FALSE",
                [usuario.id],
                () => {

                    db.query(
                        "INSERT INTO password_resets (usuario_id, codigo, expira_en) VALUES (?, ?, ?)",
                        [usuario.id, codigo, expira_en],
                        async (err2) => {

                            if (err2) {
                                console.log(err2);
                                return res.status(500).json({ error: "Error al generar código" });
                            }

                            try {
                                await enviarCodigoRecuperacion(
                                    correo,
                                    usuario.nombre,
                                    codigo
                                );
                            } catch (e) {
                                console.error(
                                    `[forgot-password] Email NO enviado a ${correo}:`,
                                    e.message
                                );
                                // Respuesta genérica OK (no revelar si el correo existe)
                            }

                            res.json(respuestaGenerica);
                        }
                    );
                }
            );
        }
    );
});


// =====================
// VERIFY CODE — valida código y devuelve resetToken
// POST /api/auth/verify-code  { correo, codigo }
// =====================
router.post("/verify-code", (req, res) => {

    const correo = String(req.body.correo || '').trim().toLowerCase();
    const codigo = String(req.body.codigo || '').trim();

    if (!correo || !codigo) {
        return res.status(400).json({ error: "Correo y código requeridos" });
    }

    const sql = `
        SELECT pr.id, pr.usuario_id, pr.expira_en, pr.usado
        FROM password_resets pr
        INNER JOIN usuarios u ON u.id = pr.usuario_id
        WHERE u.correo = ? AND pr.codigo = ?
        ORDER BY pr.id DESC
        LIMIT 1
    `;

    db.query(sql, [correo, codigo], (err, rows) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error en servidor" });
        }

        if (rows.length === 0) {
            return res.status(400).json({ error: "Código incorrecto" });
        }

        const reset = rows[0];

        if (reset.usado) {
            return res.status(400).json({ error: "Este código ya fue usado" });
        }

        if (new Date(reset.expira_en) < new Date()) {
            return res.status(400).json({ error: "Código expirado, solicita uno nuevo" });
        }

        // Token de corta duración solo para resetear la contraseña
        const resetToken = jwt.sign(
            {
                reset_id: reset.id,
                usuario_id: reset.usuario_id,
                scope: 'pwd-reset'
            },
            JWT_SECRET,
            { expiresIn: '10m' }
        );

        res.json({ ok: true, resetToken });
    });
});


// =====================
// RESET PASSWORD — usa resetToken para cambiar la contraseña
// POST /api/auth/reset-password  { resetToken, password }
// =====================
router.post("/reset-password", async (req, res) => {

    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    if (String(password).length < 6) {
        return res.status(400).json({
            error: "La contraseña debe tener al menos 6 caracteres"
        });
    }

    let payload;
    try {
        payload = jwt.verify(resetToken, JWT_SECRET);
    } catch (e) {
        return res.status(401).json({ error: "Token inválido o expirado" });
    }

    if (payload.scope !== 'pwd-reset') {
        return res.status(401).json({ error: "Token inválido" });
    }

    // Re-validar que el código no haya sido usado entre verify y reset
    db.query(
        "SELECT usado, expira_en FROM password_resets WHERE id = ?",
        [payload.reset_id],
        async (err, rows) => {

            if (err || rows.length === 0) {
                return res.status(400).json({ error: "Token inválido" });
            }

            const r = rows[0];

            if (r.usado) {
                return res.status(400).json({ error: "Este código ya fue usado" });
            }

            if (new Date(r.expira_en) < new Date()) {
                return res.status(400).json({ error: "Código expirado" });
            }

            try {
                const hash = await bcrypt.hash(password, 10);

                db.query(
                    "UPDATE usuarios SET password = ? WHERE id = ?",
                    [hash, payload.usuario_id],
                    (err2) => {

                        if (err2) {
                            console.log(err2);
                            return res.status(500).json({ error: "Error al actualizar contraseña" });
                        }

                        // Marcar como usado (one-time)
                        db.query(
                            "UPDATE password_resets SET usado = TRUE WHERE id = ?",
                            [payload.reset_id]
                        );

                        res.json({ mensaje: "Contraseña actualizada correctamente" });
                    }
                );

            } catch (e) {
                console.log(e);
                res.status(500).json({ error: "Error en servidor" });
            }
        }
    );
});

// =====================
// UPDATE PROFILE
// =====================
router.put("/perfil", requireAuth, (req, res) => {
    const { nombre, telefono } = req.body;
    const usuarioId = req.usuario.id;

    if (!nombre) {
        return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    const sql = "UPDATE usuarios SET nombre = ?, telefono = ? WHERE id = ?";
    db.query(sql, [nombre, telefono || null, usuarioId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al actualizar el perfil" });
        }

        // Return updated user data (just the updated fields for frontend sync)
        res.json({ message: "Perfil actualizado correctamente", nombre, telefono });
    });
});

module.exports = router;
