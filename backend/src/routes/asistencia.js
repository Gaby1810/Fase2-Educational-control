const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const mapaEstados = { P: 'presente', A: 'ausente', T: 'tarde' };


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
