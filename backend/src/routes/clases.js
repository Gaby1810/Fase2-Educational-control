const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');


// =====================
// OBTENER CLASES (filtradas por docente logueado)
// Sigue siendo GET /api/clases — pero ahora protegida
// =====================
router.get('/', auth, (req, res) => {

    const docenteId = req.usuario.id;

    const sql = `
        SELECT c.*, u.nombre AS docente
        FROM clases c
        LEFT JOIN usuarios u ON u.id = c.docente_id
        WHERE c.docente_id = ?
        ORDER BY c.id DESC
    `;

    db.query(sql, [docenteId], (err, rows) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al obtener clases" });
        }

        res.json(rows);
    });
});


// =====================
// CREAR CLASE
// docente_id se toma del token, NO del body
// =====================
router.post('/crear', auth, (req, res) => {

    const { nombre, grado, seccion } = req.body;
    const docente_id = req.usuario.id;

    if (!nombre || !grado) {
        return res.status(400).json({
            error: "Nombre y grado son obligatorios"
        });
    }

    const codigo_clase =
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    const sql = `
        INSERT INTO clases
        (nombre, grado, seccion, codigo_clase, docente_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [nombre, grado, seccion || null, codigo_clase, docente_id],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json({
                    error: "Error al crear clase"
                });
            }

            res.json({
                id: result.insertId,
                codigo_clase
            });
        }
    );
});

module.exports = router;
