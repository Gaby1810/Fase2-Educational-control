const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// =====================
// LISTAR NOTAS DE UNA CLASE
// GET /api/notas/clase/:claseId
// =====================
router.get('/clase/:claseId', auth, (req, res) => {

    const { claseId } = req.params;

    const sql = `
        SELECT n.*, u.nombre AS estudiante
        FROM notas n
        LEFT JOIN usuarios u ON u.id = n.estudiante_id
        WHERE n.clase_id = ?
        ORDER BY n.id DESC
    `;

    db.query(sql, [claseId], (err, rows) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al obtener notas" });
        }

        res.json(rows);
    });
});

// =====================
// REGISTRAR / ACTUALIZAR NOTA
// POST /api/notas/guardar
// =====================
router.post('/guardar', auth, (req, res) => {

    const { calificacion, evaluacion, clase_id, estudiante_id } = req.body;

    if (calificacion == null || !clase_id || !estudiante_id) {
        return res.status(400).json({
            error: "calificacion, clase_id y estudiante_id son obligatorios"
        });
    }

    const sql = `
        INSERT INTO notas (calificacion, evaluacion, clase_id, estudiante_id)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [calificacion, evaluacion || null, clase_id, estudiante_id],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al guardar nota" });
            }

            res.json({ ok: true, id: result.insertId });
        }
    );
});

module.exports = router;
