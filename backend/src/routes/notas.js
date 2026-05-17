const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// =====================
// PROMEDIO GENERAL DEL ESTUDIANTE
// GET /api/notas/promedio-general
// =====================
router.get('/promedio-general', auth, requireRole('estudiante'), (req, res) => {

    const estudianteId = req.usuario.id;

    const sqlMaterias = `
        SELECT
            c.id,
            c.nombre AS materia,
            c.grado,
            c.seccion,
            u.nombre AS docente,
            COUNT(n.id) AS total_notas,
            ROUND(AVG(n.calificacion), 2) AS promedio
        FROM inscripciones i
        INNER JOIN clases c ON c.id = i.clase_id
        LEFT JOIN usuarios u ON u.id = c.docente_id
        LEFT JOIN notas n
            ON n.clase_id = c.id
            AND n.estudiante_id = i.estudiante_id
        WHERE i.estudiante_id = ?
        GROUP BY c.id, c.nombre, c.grado, c.seccion, u.nombre
        ORDER BY c.nombre ASC
    `;

    const sqlGeneral = `
        SELECT
            ROUND(AVG(n.calificacion), 2) AS promedio_general,
            COUNT(DISTINCT i.clase_id) AS total_materias,
            COUNT(n.id) AS total_notas
        FROM inscripciones i
        LEFT JOIN notas n
            ON n.clase_id = i.clase_id
            AND n.estudiante_id = i.estudiante_id
        WHERE i.estudiante_id = ?
    `;

    db.query(sqlMaterias, [estudianteId], (err, materias) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al obtener promedio por materias" });
        }

        db.query(sqlGeneral, [estudianteId], (err, resumenRows) => {

            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al obtener promedio general" });
            }

            const resumen = resumenRows[0] || {};

            res.json({
                promedio_general: resumen.promedio_general,
                total_materias: resumen.total_materias || 0,
                total_notas: resumen.total_notas || 0,
                materias
            });
        });
    });
});

// =====================
// LISTAR NOTAS DE UNA CLASE
//  - Docente: ve TODAS las notas de la clase (con nombre del estudiante).
//  - Estudiante: ve solo sus propias notas.
// GET /api/notas/clase/:claseId
// =====================
router.get('/clase/:claseId', auth, (req, res) => {

    const { claseId } = req.params;
    const { id, rol } = req.usuario;

    let sql;
    let params;

    if (rol === 'estudiante') {
        sql = `
            SELECT n.*, u.nombre AS estudiante
            FROM notas n
            LEFT JOIN usuarios u ON u.id = n.estudiante_id
            WHERE n.clase_id = ? AND n.estudiante_id = ?
            ORDER BY n.id DESC
        `;
        params = [claseId, id];
    } else {
        sql = `
            SELECT n.*, u.nombre AS estudiante
            FROM notas n
            LEFT JOIN usuarios u ON u.id = n.estudiante_id
            WHERE n.clase_id = ?
            ORDER BY n.id DESC
        `;
        params = [claseId];
    }

    db.query(sql, params, (err, rows) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al obtener notas" });
        }

        res.json(rows);
    });
});


// =====================
// REGISTRAR NOTA (solo docente)
// POST /api/notas/guardar
// =====================
router.post('/guardar', auth, requireRole('docente', 'administrador'), (req, res) => {

    const { calificacion, evaluacion, clase_id, estudiante_id } = req.body;

    if (calificacion == null || !clase_id || !estudiante_id) {
        return res.status(400).json({
            error: "calificacion, clase_id y estudiante_id son obligatorios"
        });
    }

    const nota = Number(calificacion);
    if (isNaN(nota) || nota < 0 || nota > 10) {
        return res.status(400).json({
            error: "La calificación debe estar entre 0 y 10"
        });
    }

    const sql = `
        INSERT INTO notas (calificacion, evaluacion, clase_id, estudiante_id)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE calificacion = VALUES(calificacion)
    `;

    db.query(
        sql,
        [nota, evaluacion || null, clase_id, estudiante_id],
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
