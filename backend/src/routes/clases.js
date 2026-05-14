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
router.post('/crear', auth, requireRole('docente'), (req, res) => {

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
router.get('/:claseId/estudiantes', auth, requireRole('docente'), (req, res) => {

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

module.exports = router;
