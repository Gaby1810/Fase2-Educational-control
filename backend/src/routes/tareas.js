const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// =====================
// TAREAS DEL ESTUDIANTE
// GET /api/tareas/estudiante?clase_id=1&estado=incompletas
// estado: todas | completas | incompletas
// =====================
router.get('/estudiante', auth, requireRole('estudiante'), (req, res) => {

    const estudianteId = req.usuario.id;
    const claseId = req.query.clase_id ? Number(req.query.clase_id) : null;
    const estado = String(req.query.estado || 'todas').toLowerCase();

    const where = ['i.estudiante_id = ?'];
    const params = [estudianteId, estudianteId];

    if (claseId) {
        where.push('c.id = ?');
        params.push(claseId);
    }

    if (estado === 'completas') {
        where.push('et.id IS NOT NULL');
    } else if (estado === 'incompletas') {
        where.push('et.id IS NULL');
    }

    const tareasSql = `
        SELECT
            t.id,
            t.titulo,
            t.instrucciones,
            t.fecha_entrega,
            t.clase_id,
            c.nombre AS materia,
            c.grado,
            c.seccion,
            u.nombre AS docente,
            et.id AS entrega_id,
            et.archivo AS archivo_entregado,
            et.fecha_entrega AS fecha_entregada,
            CASE WHEN et.id IS NULL THEN 'incompleta' ELSE 'completa' END AS estado_entrega,
            DATEDIFF(t.fecha_entrega, CURDATE()) AS dias_restantes
        FROM inscripciones i
        INNER JOIN clases c ON c.id = i.clase_id
        INNER JOIN tareas t ON t.clase_id = c.id
        LEFT JOIN usuarios u ON u.id = c.docente_id
        LEFT JOIN entrega_tareas et
            ON et.tarea_id = t.id
            AND et.estudiante_id = ?
        WHERE ${where.join(' AND ')}
        ORDER BY
            CASE WHEN t.fecha_entrega IS NULL THEN 1 ELSE 0 END,
            t.fecha_entrega ASC,
            t.id DESC
    `;

    const materiasSql = `
        SELECT
            c.id,
            c.nombre,
            c.grado,
            c.seccion,
            COUNT(t.id) AS total_tareas,
            SUM(CASE WHEN et.id IS NULL AND t.id IS NOT NULL THEN 1 ELSE 0 END) AS incompletas,
            SUM(CASE WHEN et.id IS NOT NULL THEN 1 ELSE 0 END) AS completas
        FROM inscripciones i
        INNER JOIN clases c ON c.id = i.clase_id
        LEFT JOIN tareas t ON t.clase_id = c.id
        LEFT JOIN entrega_tareas et
            ON et.tarea_id = t.id
            AND et.estudiante_id = ?
        WHERE i.estudiante_id = ?
        GROUP BY c.id, c.nombre, c.grado, c.seccion
        ORDER BY c.nombre ASC
    `;

    db.query(tareasSql, params, (err, tareas) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al obtener tareas del estudiante" });
        }

        db.query(materiasSql, [estudianteId, estudianteId], (err, materias) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al obtener materias" });
            }

            const resumen = tareas.reduce(
                (acc, tarea) => {
                    acc.total += 1;
                    if (tarea.estado_entrega === 'completa') acc.completas += 1;
                    if (tarea.estado_entrega === 'incompleta') acc.incompletas += 1;
                    return acc;
                },
                { total: 0, completas: 0, incompletas: 0 }
            );

            res.json({ tareas, materias, resumen });
        });
    });
});

// =====================
// MARCAR TAREA COMO ENTREGADA (estudiante)
// POST /api/tareas/:tareaId/entregar
// =====================
router.post('/:tareaId/entregar', auth, requireRole('estudiante'), (req, res) => {

    const estudianteId = req.usuario.id;
    const tareaId = Number(req.params.tareaId);

    if (!tareaId) {
        return res.status(400).json({ error: "Tarea invalida" });
    }

    const validarSql = `
        SELECT t.id
        FROM tareas t
        INNER JOIN inscripciones i
            ON i.clase_id = t.clase_id
            AND i.estudiante_id = ?
        WHERE t.id = ?
        LIMIT 1
    `;

    db.query(validarSql, [estudianteId, tareaId], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al validar tarea" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: "Tarea no encontrada para este estudiante" });
        }

        db.query(
            "SELECT id FROM entrega_tareas WHERE tarea_id = ? AND estudiante_id = ?",
            [tareaId, estudianteId],
            (err, entregas) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: "Error al verificar entrega" });
                }

                if (entregas.length > 0) {
                    return res.json({ ok: true, id: entregas[0].id, alreadyDelivered: true });
                }

                db.query(
                    "INSERT INTO entrega_tareas (tarea_id, estudiante_id, archivo) VALUES (?, ?, ?)",
                    [tareaId, estudianteId, req.body.archivo || null],
                    (err, result) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).json({ error: "Error al registrar entrega" });
                        }

                        res.json({ ok: true, id: result.insertId });
                    }
                );
            }
        );
    });
});

// =====================
// LISTAR TAREAS DE UNA CLASE
// GET /api/tareas/clase/:claseId
// =====================
router.get('/clase/:claseId', auth, (req, res) => {

    const { claseId } = req.params;
    const { id, rol } = req.usuario;

    let sql;
    let params;

    if (rol === 'docente') {
        sql = `
            SELECT
                t.*,
                c.nombre AS materia,
                COUNT(et.id) AS total_entregas
            FROM tareas t
            INNER JOIN clases c ON c.id = t.clase_id
            LEFT JOIN entrega_tareas et ON et.tarea_id = t.id
            WHERE t.clase_id = ? AND c.docente_id = ?
            GROUP BY t.id, t.titulo, t.instrucciones, t.fecha_entrega, t.clase_id, c.nombre
            ORDER BY t.id DESC
        `;
        params = [claseId, id];
    } else {
        sql = `
            SELECT
                t.*,
                c.nombre AS materia,
                et.id AS entrega_id,
                et.archivo AS archivo_entregado,
                et.fecha_entrega AS fecha_entregada,
                CASE WHEN et.id IS NULL THEN 'incompleta' ELSE 'completa' END AS estado_entrega,
                DATEDIFF(t.fecha_entrega, CURDATE()) AS dias_restantes
            FROM tareas t
            INNER JOIN clases c ON c.id = t.clase_id
            INNER JOIN inscripciones i
                ON i.clase_id = c.id
                AND i.estudiante_id = ?
            LEFT JOIN entrega_tareas et
                ON et.tarea_id = t.id
                AND et.estudiante_id = ?
            WHERE t.clase_id = ?
            ORDER BY t.id DESC
        `;
        params = [id, id, claseId];
    }

    db.query(sql, params, (err, rows) => {

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

    const { titulo, descripcion, instrucciones, fecha_entrega, clase_id } = req.body;
    const docenteId = req.usuario.id;
    const textoInstrucciones = instrucciones || descripcion || null;

    if (!titulo || !clase_id) {
        return res.status(400).json({
            error: "titulo y clase_id son obligatorios"
        });
    }

    db.query(
        "SELECT id FROM clases WHERE id = ? AND docente_id = ?",
        [clase_id, docenteId],
        (err, rows) => {

            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al validar clase" });
            }

            if (rows.length === 0) {
                return res.status(403).json({ error: "No puedes crear tareas en esta clase" });
            }

            const sql = `
                INSERT INTO tareas
                (titulo, instrucciones, fecha_entrega, clase_id)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                sql,
                [titulo.trim(), textoInstrucciones, fecha_entrega || null, clase_id],
                (err, result) => {

                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: "Error al crear tarea" });
                    }

                    res.json({
                        ok: true,
                        id: result.insertId,
                        tarea: {
                            id: result.insertId,
                            titulo: titulo.trim(),
                            instrucciones: textoInstrucciones,
                            fecha_entrega: fecha_entrega || null,
                            clase_id
                        }
                    });
                }
            );
        }
    );
});

module.exports = router;
