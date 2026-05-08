const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");


// =====================
// REGISTRO
// =====================
router.post("/register", async (req, res) => {
    console.log("LLEGÓ REQUEST:", req.body);
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

    try {
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
                return res.status(500).json({
                    error: "Error al registrar usuario",
                    detalle: err
                });
            }

            res.json({
                mensaje: "Usuario registrado correctamente"
            });
        });

    } catch (error) {
        res.status(500).json({
            error: "Error del servidor"
        });
    }
});


// =====================
// LOGIN
// =====================
router.post("/login", (req, res) => {

    const { correo, password } = req.body;

    db.query(
        "SELECT * FROM usuarios WHERE correo = ?",
        [correo],
        async (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: "Error en servidor"
                });
            }

            if (results.length === 0) {
                return res.status(400).json({
                    error: "Usuario no existe"
                });
            }

            const usuario = results[0];

            const valido = await bcrypt.compare(password, usuario.password);

            if (!valido) {
                return res.status(400).json({
                    error: "Contraseña incorrecta"
                });
            }

            res.json({
                mensaje: "Login correcto",
                usuario
            });
        }
    );
});

module.exports = router;