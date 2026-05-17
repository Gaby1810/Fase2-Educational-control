const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');


// =====================
// OBTENER CLASES
// - Docente: ve las clases que él creó
// - Estudiante: ve las clases en las que está inscrito
// =====================
router.get('/', auth, (req, res) => {

    const { id, rol } = req.usuario;

    if (rol === 'docente') {

        const sql = `
            SELECT c.*, u.nombre AS docente
            FROM clases c
            LEFT JOIN usuarios u ON u.id = c.docente_id
            WHERE c.docente_id = ?
            ORDER BY c.id DESC
        `;

        return db.query(sql, [id], (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al obtener clases" });
            }
            res.json(rows);
        });
    }

    // estudiante
    const sql = `
        SELECT c.*, u.nombre AS docente
        FROM inscripciones i
        INNER JOIN clases c ON c.id = i.clase_id
        LEFT JOIN usuarios u ON u.id = c.docente_id
        WHERE i.estudiante_id = ?
        ORDER BY c.id DESC
    `;

    db.query(sql, [id], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al obtener clases" });
        }
        res.json(rows);
    });
});


// =====================
// CREAR CLASE (solo docente)
// =====================
// =====================
// OBTENER NOTAS DEL ESTUDIANTE
// GET /api/clases/mis-notas
// =====================
router.get('/mis-notas', auth, requireRole('estudiante'), (req, res) => {
    const estudianteId = req.usuario.id;

    const sql = `
        SELECT 
            c.id AS clase_id,
            c.nombre AS materia,
            c.grado,
            u.nombre AS docente,
            AVG(n.calificacion) AS promedio_materia,
            COUNT(n.id) AS total_evaluaciones
        FROM inscripciones i
        INNER JOIN clases c ON c.id = i.clase_id
        LEFT JOIN usuarios u ON u.id = c.docente_id
        LEFT JOIN notas n ON n.clase_id = c.id AND n.estudiante_id = i.estudiante_id
        WHERE i.estudiante_id = ?
        GROUP BY c.id, c.nombre, c.grado, u.nombre
        ORDER BY c.nombre ASC
    `;

    db.query(sql, [estudianteId], (err, materias) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al obtener notas" });
        }

        let sumaGral = 0;
        let materiasEvaluadas = 0;

        const notasDetalladas = materias.map(m => {
            const prom = m.promedio_materia !== null ? parseFloat(m.promedio_materia) : null;
            if (prom !== null) {
                sumaGral += prom;
                materiasEvaluadas++;
            }
            return {
                ...m,
                promedio_materia: prom !== null ? Number(prom.toFixed(1)) : null
            };
        });

        const promedioGeneral = materiasEvaluadas > 0 ? Number((sumaGral / materiasEvaluadas).toFixed(1)) : null;

        res.json({
            materias: notasDetalladas,
            promedioGeneral
        });
    });
});


router.post('/crear', auth, requireRole('docente', 'administrador'), (req, res) => {

    const { nombre, grado, seccion } = req.body;
    const docente_id = req.usuario.id;

    if (!nombre || !grado) {
        return res.status(400).json({
            error: "Nombre y grado son obligatorios"
        });
    }

    let intentos = 0;
    const MAX_INTENTOS = 5;

    function intentarCrear() {
        if (intentos >= MAX_INTENTOS) {
            return res.status(500).json({ error: "No se pudo generar un código único para la clase" });
        }
        intentos++;

        const codigo_clase = Math.random().toString(36).substring(2, 8).toUpperCase();

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
                    if (err.code === 'ER_DUP_ENTRY') {
                        return intentarCrear();
                    }
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
    }

    intentarCrear();
});


// =====================
// UNIRSE A UNA CLASE (solo estudiante) por código
// POST /api/clases/unirse  { codigo_clase }
// =====================
router.post('/unirse', auth, requireRole('estudiante'), (req, res) => {

    const codigo_clase = String(req.body.codigo_clase || '')
        .trim()
        .toUpperCase();

    const estudiante_id = req.usuario.id;

    if (!codigo_clase) {
        return res.status(400).json({ error: "Código requerido" });
    }

    // Traemos también el grado/seccion del estudiante para validar
    const sqlBuscar = `
        SELECT
            c.*,
            u.nombre AS docente,
            (SELECT grado   FROM usuarios WHERE id = ?) AS estudiante_grado,
            (SELECT seccion FROM usuarios WHERE id = ?) AS estudiante_seccion
        FROM clases c
        LEFT JOIN usuarios u ON u.id = c.docente_id
        WHERE c.codigo_clase = ?
    `;

    db.query(sqlBuscar, [estudiante_id, estudiante_id, codigo_clase], (err, rows) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error en servidor" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: "Código inválido" });
        }

        const clase = rows[0];
        const estudianteGrado = clase.estudiante_grado;
        const estudianteSeccion = clase.estudiante_seccion;

        // --- Limpiamos los campos auxiliares para no enviarlos como parte de la clase
        delete clase.estudiante_grado;
        delete clase.estudiante_seccion;

        // 🚫 Validación: el grado del estudiante debe coincidir con el de la clase
        if (clase.grado && estudianteGrado && clase.grado !== estudianteGrado) {
            return res.status(403).json({
                error: `Esta clase es para ${clase.grado}. Tu grado registrado es ${estudianteGrado}.`
            });
        }

        // 🚫 Validación: la sección también debe coincidir (si la clase la especifica)
        if (clase.seccion && estudianteSeccion && clase.seccion !== estudianteSeccion) {
            return res.status(403).json({
                error: `Esta clase es de la sección ${clase.seccion}. Tú estás en la sección ${estudianteSeccion}.`
            });
        }

        // Evitar duplicar inscripción
        db.query(
            "SELECT id FROM inscripciones WHERE estudiante_id = ? AND clase_id = ?",
            [estudiante_id, clase.id],
            (err, dup) => {

                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: "Error en servidor" });
                }

                if (dup.length > 0) {
                    return res.status(409).json({ error: "Ya estás inscrito en esta clase" });
                }

                db.query(
                    "INSERT INTO inscripciones (estudiante_id, clase_id) VALUES (?, ?)",
                    [estudiante_id, clase.id],
                    (err, result) => {

                        if (err) {
                            console.log(err);
                            return res.status(500).json({ error: "Error al inscribirse" });
                        }

                        res.json({ ok: true, clase });
                    }
                );
            }
        );
    });
});

// =====================
// LISTAR ESTUDIANTES INSCRITOS EN UNA CLASE (solo docente)
// GET /api/clases/:claseId/estudiantes
// =====================
router.get('/:claseId/estudiantes', auth, requireRole('docente', 'administrador'), (req, res) => {

    const { claseId } = req.params;

    const sql = `
        SELECT u.id, u.nombre, u.correo
        FROM inscripciones i
        INNER JOIN usuarios u ON u.id = i.estudiante_id
        WHERE i.clase_id = ?
        ORDER BY u.nombre ASC
    `;

    db.query(sql, [claseId], (err, rows) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al obtener estudiantes" });
        }

        res.json(rows);
    });
});

// =====================
// SALIR DE UNA CLASE (solo estudiante)
// DELETE /api/clases/:id/abandonar
// =====================
router.delete('/:id/abandonar', auth, requireRole('estudiante'), (req, res) => {
    const { id } = req.params;
    const estudianteId = req.usuario.id;

    const sql = "DELETE FROM inscripciones WHERE clase_id = ? AND estudiante_id = ?";
    db.query(sql, [id, estudianteId], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al salir de la clase" });
        if (result.affectedRows === 0) return res.status(404).json({ error: "No estás inscrito en esta clase" });
        res.json({ message: "Has salido de la clase exitosamente" });
    });
});

// =====================
// EXPULSAR ESTUDIANTE (solo docente)
// DELETE /api/clases/:claseId/estudiantes/:estudianteId
// =====================
router.delete('/:claseId/estudiantes/:estudianteId', auth, requireRole('docente', 'administrador'), (req, res) => {
    const { claseId, estudianteId } = req.params;
    const { id: usuarioId, rol } = req.usuario;

    // Admin: cualquier clase. Docente: solo las suyas.
    const verifSql = rol === 'administrador'
        ? "SELECT id FROM clases WHERE id = ?"
        : "SELECT id FROM clases WHERE id = ? AND docente_id = ?";
    const verifParams = rol === 'administrador' ? [claseId] : [claseId, usuarioId];

    db.query(verifSql, verifParams, (err, rows) => {
        if (err) return res.status(500).json({ error: "Error al validar la clase" });
        if (rows.length === 0) return res.status(403).json({ error: "No tienes permiso para modificar esta clase" });

        const sql = "DELETE FROM inscripciones WHERE clase_id = ? AND estudiante_id = ?";
        db.query(sql, [claseId, estudianteId], (err, result) => {
            if (err) return res.status(500).json({ error: "Error al remover estudiante" });
            res.json({ message: "Estudiante removido exitosamente" });
        });
    });
});

// =====================
// EDITAR CLASE (Docente dueño / Admin)
// PUT /api/clases/:id
// =====================
router.put('/:id', auth, requireRole('docente', 'administrador'), (req, res) => {

    const { id } = req.params;
    const { nombre, grado, seccion } = req.body;
    const { id: usuarioId, rol } = req.usuario;

    if (!nombre || !grado) {
        return res.status(400).json({ error: "Nombre y grado son obligatorios" });
    }

    db.query("SELECT docente_id FROM clases WHERE id = ?", [id], (err, rows) => {
        if (err) return res.status(500).json({ error: "Error en servidor" });
        if (rows.length === 0) return res.status(404).json({ error: "Clase no encontrada" });

        if (rol !== 'administrador' && rows[0].docente_id !== usuarioId) {
            return res.status(403).json({ error: "No puedes editar esta clase" });
        }

        db.query(
            "UPDATE clases SET nombre = ?, grado = ?, seccion = ? WHERE id = ?",
            [nombre, grado, seccion || null, id],
            (err2) => {
                if (err2) {
                    console.log(err2);
                    return res.status(500).json({ error: "Error al actualizar clase" });
                }
                res.json({ ok: true, mensaje: "Clase actualizada correctamente" });
            }
        );
    });
});


// =====================
// ELIMINAR CLASE COMPLETAMENTE (Docente / Admin)
// DELETE /api/clases/:id
// =====================
router.delete('/:id', auth, (req, res) => {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    // Verificar si el usuario es el dueño de la clase o es administrador
    const sqlVerify = "SELECT id, docente_id FROM clases WHERE id = ?";
    db.query(sqlVerify, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: "Error al validar clase" });
        if (rows.length === 0) return res.status(404).json({ error: "Clase no encontrada" });

        const clase = rows[0];
        if (rol !== 'administrador' && clase.docente_id !== usuarioId) {
            return res.status(403).json({ error: "No tienes permiso para eliminar esta clase" });
        }

        const sqlDelete = "DELETE FROM clases WHERE id = ?";
        db.query(sqlDelete, [id], (err, result) => {
            if (err) return res.status(500).json({ error: "Error al eliminar la clase" });
            res.json({ message: "Clase eliminada permanentemente" });
        });
    });
});

module.exports = router;
