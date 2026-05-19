const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require('../db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// =====================
// CONFIG MULTER (compartido para crear y entregar)
// =====================
const uploadsDir = require('../utils/uploadsDir');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

// Acepta el archivo bajo el nombre 'archivo' o 'file'
const aceptarArchivo = upload.fields([
    { name: 'archivo', maxCount: 1 },
    { name: 'file', maxCount: 1 }
]);

function extraerArchivo(req) {
    if (!req.files) return null;
    if (req.files.archivo && req.files.archivo[0]) return req.files.archivo[0].filename;
    if (req.files.file && req.files.file[0]) return req.files.file[0].filename;
    return null;
}


// =====================
// TAREAS DEL ESTUDIANTE (vista global)
// GET /api/tareas/estudiante?clase_id=1&estado=incompletas
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
            t.archivo,
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
// ENTREGAR TAREA (estudiante)
// POST /api/tareas/:tareaId/entregar
// Acepta multipart con archivo (opcional)
// =====================
router.post('/:tareaId/entregar', auth, requireRole('estudiante'), aceptarArchivo, (req, res) => {

    const estudianteId = req.usuario.id;
    const tareaId = Number(req.params.tareaId);
    const archivoSubido = extraerArchivo(req) || req.body.archivo || null;

    if (!tareaId) {
        return res.status(400).json({ error: "Tarea inválida" });
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
            "SELECT id, archivo FROM entrega_tareas WHERE tarea_id = ? AND estudiante_id = ?",
            [tareaId, estudianteId],
            (err, entregas) => {

                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: "Error al verificar entrega" });
                }

                // Si ya entregó: actualizar archivo si vino uno nuevo
                if (entregas.length > 0) {
                    const entrega = entregas[0];
                    if (archivoSubido && archivoSubido !== entrega.archivo) {
                        db.query(
                            "UPDATE entrega_tareas SET archivo = ?, fecha_entrega = CURRENT_TIMESTAMP WHERE id = ?",
                            [archivoSubido, entrega.id],
                            (err) => {
                                if (err) {
                                    console.log(err);
                                    return res.status(500).json({ error: "Error al actualizar entrega" });
                                }
                                res.json({ ok: true, id: entrega.id, updated: true });
                            }
                        );
                        return;
                    }
                    return res.json({ ok: true, id: entrega.id, alreadyDelivered: true });
                }

                // Nueva entrega
                db.query(
                    "INSERT INTO entrega_tareas (tarea_id, estudiante_id, archivo) VALUES (?, ?, ?)",
                    [tareaId, estudianteId, archivoSubido],
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
            GROUP BY t.id, t.titulo, t.instrucciones, t.archivo, t.fecha_entrega, t.clase_id, c.nombre
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
// CREAR TAREA (docente) — con archivo opcional
// POST /api/tareas/crear
// =====================
router.post('/crear', auth, requireRole('docente', 'administrador'), aceptarArchivo, (req, res) => {

    const { titulo, descripcion, instrucciones, fecha_entrega, clase_id } = req.body;
    const { id: usuarioId, rol } = req.usuario;
    const textoInstrucciones = instrucciones || descripcion || null;
    const archivoSubido = extraerArchivo(req);

    if (!titulo || !clase_id) {
        return res.status(400).json({
            error: "titulo y clase_id son obligatorios"
        });
    }

    // Admin: cualquier clase. Docente: solo las suyas.
    const verifSql = rol === 'administrador'
        ? "SELECT id FROM clases WHERE id = ?"
        : "SELECT id FROM clases WHERE id = ? AND docente_id = ?";
    const verifParams = rol === 'administrador' ? [clase_id] : [clase_id, usuarioId];

    db.query(
        verifSql,
        verifParams,
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
                (titulo, instrucciones, archivo, fecha_entrega, clase_id)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [String(titulo).trim(), textoInstrucciones, archivoSubido, fecha_entrega || null, clase_id],
                (err, result) => {

                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: "Error al crear tarea" });
                    }

                    res.json({ ok: true, id: result.insertId });
                }
            );
        }
    );
});

// =====================
// VER ENTREGAS DE UNA TAREA (solo docente)
// GET /api/tareas/:tareaId/entregas
// =====================
router.get('/:tareaId/entregas', auth, requireRole('docente', 'administrador'), (req, res) => {
    const { tareaId } = req.params;
    const { id: usuarioId, rol } = req.usuario;

    // Admin: cualquier tarea. Docente: solo las de sus clases.
    const validarSql = rol === 'administrador'
        ? `SELECT id FROM tareas WHERE id = ? LIMIT 1`
        : `SELECT t.id
           FROM tareas t
           INNER JOIN clases c ON c.id = t.clase_id
           WHERE t.id = ? AND c.docente_id = ?
           LIMIT 1`;
    const validarParams = rol === 'administrador' ? [tareaId] : [tareaId, usuarioId];

    db.query(validarSql, validarParams, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al validar tarea" });
        }
        if (rows.length === 0) {
            return res.status(403).json({ error: "No tienes permiso para ver estas entregas" });
        }

        const sql = `
            SELECT
                et.id AS entrega_id,
                et.archivo,
                et.fecha_entrega,
                u.id AS estudiante_id,
                u.nombre AS estudiante_nombre,
                n.calificacion AS nota
            FROM entrega_tareas et
            INNER JOIN usuarios u ON u.id = et.estudiante_id
            INNER JOIN tareas t ON t.id = et.tarea_id
            LEFT JOIN notas n
                ON n.estudiante_id = et.estudiante_id
                AND n.clase_id = t.clase_id
                AND n.evaluacion = t.titulo
            WHERE et.tarea_id = ?
            ORDER BY et.fecha_entrega DESC
        `;

        db.query(sql, [tareaId], (err, entregas) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al obtener entregas" });
            }
            res.json(entregas);
        });
    });
});

// =====================
// EDITAR TAREA (Docente dueño / Admin)
// PUT /api/tareas/:id
// =====================
router.put('/:id', auth, requireRole('docente', 'administrador'), (req, res) => {

    const { id } = req.params;
    const { titulo, descripcion, instrucciones, fecha_entrega } = req.body;
    const { id: usuarioId, rol } = req.usuario;
    const textoInstrucciones = instrucciones || descripcion || null;

    if (!titulo) {
        return res.status(400).json({ error: "El título es obligatorio" });
    }

    const sqlVerify = `
        SELECT t.id, c.docente_id
        FROM tareas t
        INNER JOIN clases c ON c.id = t.clase_id
        WHERE t.id = ?
    `;

    db.query(sqlVerify, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: "Error validando permiso" });
        if (rows.length === 0) return res.status(404).json({ error: "Tarea no encontrada" });

        if (rol !== 'administrador' && rows[0].docente_id !== usuarioId) {
            return res.status(403).json({ error: "No puedes editar esta tarea" });
        }

        db.query(
            "UPDATE tareas SET titulo = ?, instrucciones = ?, fecha_entrega = ? WHERE id = ?",
            [String(titulo).trim(), textoInstrucciones, fecha_entrega || null, id],
            (err2) => {
                if (err2) {
                    console.log(err2);
                    return res.status(500).json({ error: "Error al actualizar tarea" });
                }
                res.json({ ok: true, mensaje: "Tarea actualizada correctamente" });
            }
        );
    });
});


// =====================
// ELIMINAR TAREA
// =====================
router.delete('/:id', auth, requireRole('docente', 'administrador'), (req, res) => {
    const { id } = req.params;
    const { id: usuarioId, rol } = req.usuario;

    // Admin: cualquier tarea. Docente: solo las de sus clases.
    const sqlVerify = rol === 'administrador'
        ? `SELECT t.id, t.archivo FROM tareas t WHERE t.id = ?`
        : `SELECT t.id, t.archivo
           FROM tareas t
           INNER JOIN clases c ON c.id = t.clase_id
           WHERE t.id = ? AND c.docente_id = ?`;
    const verifParams = rol === 'administrador' ? [id] : [id, usuarioId];

    db.query(sqlVerify, verifParams, (err, rows) => {
        if (err) return res.status(500).json({ error: "Error validando permiso" });
        if (rows.length === 0) return res.status(403).json({ error: "No tienes permiso para eliminar esta tarea" });

        const archivo = rows[0].archivo;

        db.query("DELETE FROM tareas WHERE id = ?", [id], (err, result) => {
            if (err) return res.status(500).json({ error: "Error al eliminar tarea" });

            // Eliminar archivo físico si existe
            if (archivo) {
                const filePath = path.join(uploadsDir, archivo);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            res.json({ message: "Tarea eliminada" });
        });
    });
});

module.exports = router;
