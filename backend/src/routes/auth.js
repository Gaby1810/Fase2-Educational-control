const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

module.exports = router;
