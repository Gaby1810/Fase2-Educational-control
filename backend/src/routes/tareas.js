const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// =====================
// LISTAR TAREAS DE UNA CLASE
// GET /api/tareas/clase/:claseId
// =====================
router.get('/clase/:claseId', auth, (req, res) => {

    const { claseId } = req.params;

    const sql = `
        SELECT *
        FROM tareas
        WHERE clase_id = ?
        ORDER BY id DESC
    `;

    db.query(sql, [claseId], (err, rows) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al obtener tareas" });
        }

        res.json(rows);
    });
});


// =====================
// CREAR TAREA
// POST /api/tareas/crear
// =====================
router.post('/crear', auth, requireRole('docente'), (req, res) => {

    const { titulo, descripcion, fecha_entrega, clase_id } = req.body;

    if (!titulo || !clase_id) {
        return res.status(400).json({
            error: "titulo y clase_id son obligatorios"
        });
    }

    const sql = `
        INSERT INTO tareas
        (titulo, instrucciones, fecha_entrega, clase_id)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [titulo, descripcion || null, fecha_entrega || null, clase_id],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al crear tarea" });
            }

            res.json({ ok: true, id: result.insertId });
        }
    );
});

module.exports = router;
