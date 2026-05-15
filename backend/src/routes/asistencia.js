const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const mapaEstados = { P: 'presente', A: 'ausente', T: 'tarde' };

// =====================
// REPORTE ANUAL DE ASISTENCIA (estudiante)
// GET /api/asistencia/reporte-anual?anio=2026
// =====================
router.get('/reporte-anual', auth, requireRole('estudiante'), (req, res) => {

    const estudianteId = req.usuario.id;
    const anio = Number(req.query.anio) || new Date().getFullYear();

    const materiasSql = `
        SELECT
            c.id AS clase_id,
            c.nombre AS materia,
            c.grado,
            c.seccion,
            COUNT(a.id) AS total,
            SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS presentes,
            SUM(CASE WHEN a.estado = 'ausente' THEN 1 ELSE 0 END) AS ausentes,
            SUM(CASE WHEN a.estado = 'tarde' THEN 1 ELSE 0 END) AS tardes
        FROM inscripciones i
        INNER JOIN clases c ON c.id = i.clase_id
        LEFT JOIN asistencia a
            ON a.clase_id = c.id
            AND a.estudiante_id = i.estudiante_id
            AND YEAR(a.fecha) = ?
        WHERE i.estudiante_id = ?
        GROUP BY c.id, c.nombre, c.grado, c.seccion
        ORDER BY c.nombre ASC
    `;

    const mesesSql = `
        SELECT
            MONTH(a.fecha) AS mes,
            COUNT(a.id) AS total,
            SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS presentes,
            SUM(CASE WHEN a.estado = 'ausente' THEN 1 ELSE 0 END) AS ausentes,
            SUM(CASE WHEN a.estado = 'tarde' THEN 1 ELSE 0 END) AS tardes
        FROM asistencia a
        INNER JOIN inscripciones i
            ON i.clase_id = a.clase_id
            AND i.estudiante_id = a.estudiante_id
        WHERE a.estudiante_id = ? AND YEAR(a.fecha) = ?
        GROUP BY MONTH(a.fecha)
        ORDER BY mes ASC
    `;

    db.query(materiasSql, [anio, estudianteId], (err, materias) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al obtener reporte anual" });
        }

        db.query(mesesSql, [estudianteId, anio], (err, meses) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al obtener reporte mensual" });
            }

            const resumen = materias.reduce(
                (acc, item) => {
                    acc.total += Number(item.total || 0);
                    acc.presentes += Number(item.presentes || 0);
                    acc.ausentes += Number(item.ausentes || 0);
                    acc.tardes += Number(item.tardes || 0);
                    return acc;
                },
                { total: 0, presentes: 0, ausentes: 0, tardes: 0 }
            );

            resumen.porcentajeAsistencia = resumen.total
                ? Number(((resumen.presentes / resumen.total) * 100).toFixed(1))
                : 0;

            resumen.porcentajeConTardanzas = resumen.total
                ? Number((((resumen.presentes + resumen.tardes) / resumen.total) * 100).toFixed(1))
                : 0;

            res.json({
                anio,
                resumen,
                materias,
                meses
            });
        });
    });
});

// =====================
// OBTENER ASISTENCIA DE UNA CLASE
//  - Docente: ve todos los registros con nombre del estudiante.
//  - Estudiante: ve solo sus propios registros.
// GET /api/asistencia/clase/:claseId
// =====================
router.get('/clase/:claseId', auth, (req, res) => {

    const { claseId } = req.params;
    const { id, rol } = req.usuario;

    let sql;
    let params;

    if (rol === 'estudiante') {
        sql = `
            SELECT a.*
            FROM asistencia a
            WHERE a.clase_id = ? AND a.estudiante_id = ?
            ORDER BY a.fecha DESC, a.id DESC
        `;
        params = [claseId, id];
    } else {
        sql = `
            SELECT a.*, u.nombre AS estudiante
            FROM asistencia a
            LEFT JOIN usuarios u ON u.id = a.estudiante_id
            WHERE a.clase_id = ?
            ORDER BY a.fecha DESC, a.id DESC
        `;
        params = [claseId];
    }

    db.query(sql, params, (err, rows) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al obtener asistencia" });
        }

        res.json(rows);
    });
});


// =====================
// REGISTRAR ASISTENCIA (solo docente)
// POST /api/asistencia/guardar
// =====================
router.post('/guardar', auth, requireRole('docente'), (req, res) => {

    const { clase_id, fecha, datos } = req.body;

    if (!clase_id || !fecha || !datos || typeof datos !== 'object') {
        return res.status(400).json({
            error: "clase_id, fecha y datos son obligatorios"
        });
    }

    const entradas = Object.entries(datos);

    if (entradas.length === 0) {
        return res.status(400).json({ error: "Sin estudiantes para registrar" });
    }

    const values = entradas.map(([estudiante_id, estadoCorto]) => [
        fecha,
        mapaEstados[estadoCorto] || 'presente',
        clase_id,
        estudiante_id
    ]);

    const sql = "INSERT INTO asistencia (fecha, estado, clase_id, estudiante_id) VALUES ?";

    db.query(sql, [values], (err, result) => {

        if (err) {
            console.error("Error SQL asistencia:", err);
            return res.status(500).json({ error: "Error al registrar asistencia" });
        }

        res.json({
            message: "Asistencia guardada correctamente",
            registros: result.affectedRows
        });
    });
});

module.exports = router;
