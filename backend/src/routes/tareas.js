const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// =====================
// LISTAR TAREAS DEL ESTUDIANTE
// GET /api/tareas/estudiante?clase_id=1&estado=incompleta
// =====================
router.get('/estudiante', auth, requireRole('estudiante'), (req, res) => {

    const estudianteId = req.usuario.id;
    const { clase_id, estado } = req.query;

    const filtros = ['i.estudiante_id = ?'];
    const params = [estudianteId];

    if (clase_id && clase_id !== 'todas') {
        filtros.push('c.id = ?');
        params.push(clase_id);
    }

    if (estado === 'completa') {
        filtros.push('et.id IS NOT NULL');
    }

    if (estado === 'incompleta') {
        filtros.push('et.id IS NULL');
    }

    const sql = `
        SELECT
            t.id,
            t.titulo,
            t.instrucciones,
            t.fecha_entrega,
            t.clase_id,
            c.nombre AS clase_nombre,
            c.grado,
            c.seccion,
            u.nombre AS docente,
            et.id AS entrega_id,
            et.archivo AS archivo_entregado,
            et.fecha_entrega AS fecha_entregada,
            CASE
                WHEN et.id IS NULL THEN 'incompleta'
                ELSE 'completa'
            END AS estado,
            CASE
                WHEN t.fecha_entrega IS NULL THEN 0
                WHEN t.fecha_entrega < CURDATE() AND et.id IS NULL THEN 1
                ELSE 0
            END AS vencida
        FROM inscripciones i
        INNER JOIN clases c ON c.id = i.clase_id
        INNER JOIN tareas t ON t.clase_id = c.id
        LEFT JOIN usuarios u ON u.id = c.docente_id
        LEFT JOIN entrega_tareas et
            ON et.tarea_id = t.id
            AND et.estudiante_id = i.estudiante_id
        WHERE ${filtros.join(' AND ')}
        ORDER BY
            CASE WHEN et.id IS NULL THEN 0 ELSE 1 END,
            t.fecha_entrega IS NULL,
            t.fecha_entrega ASC,
            t.id DESC
    `;

    db.query(sql, params, (err, rows) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al obtener tareas del estudiante" });
        }

        res.json(rows);
    });
});

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
