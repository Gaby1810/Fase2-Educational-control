const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require('../db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// =====================
// CONFIG MULTER
// =====================

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

// Acepta el archivo bajo el nombre 'archivo' o 'file' (compat con front)
const aceptarArchivo = upload.fields([
    { name: 'archivo', maxCount: 1 },
    { name: 'file', maxCount: 1 }
]);

// =====================
// OBTENER MATERIALES
// =====================
router.get('/:claseId', auth, (req, res) => {

    const { claseId } = req.params;
    const { id, rol } = req.usuario;

    let validarSql;
    let params;

    if (rol === 'estudiante') {
        validarSql = `SELECT id FROM inscripciones WHERE clase_id = ? AND estudiante_id = ? LIMIT 1`;
        params = [claseId, id];
    } else if (rol === 'docente') {
        validarSql = `SELECT id FROM clases WHERE id = ? AND docente_id = ? LIMIT 1`;
        params = [claseId, id];
    } else {
        validarSql = `SELECT 1`;
        params = [];
    }

    db.query(validarSql, params, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al validar permisos" });
        }
        if (rol !== 'administrador' && rows.length === 0) {
            return res.status(403).json({ error: "No tienes acceso a los materiales de esta clase" });
        }

        const sql = `
            SELECT *
            FROM materiales
            WHERE clase_id = ?
            ORDER BY id DESC
        `;

        db.query(sql, [claseId], (err, results) => {

            if (err) {
                console.log(err);
                return res.status(500).json({
                    error: 'Error obteniendo materiales'
                });
            }

            res.json(results);
        });
    });
});

// =====================
// CREAR MATERIAL
// Acepta POST /api/materiales y POST /api/materiales/subir
// =====================
function crearMaterialHandler(req, res) {

    try {

        const { titulo, descripcion, clase_id } = req.body;

        if (!titulo || !clase_id) {
            return res.status(400).json({
                error: 'titulo y clase_id son obligatorios'
            });
        }

        // Detectar archivo (vino bajo 'archivo' o 'file')
        let archivo = null;
        if (req.files) {
            if (req.files.archivo && req.files.archivo[0]) {
                archivo = req.files.archivo[0].filename;
            } else if (req.files.file && req.files.file[0]) {
                archivo = req.files.file[0].filename;
            }
        }

        const sql = `
            INSERT INTO materiales
            (titulo, descripcion, archivo, clase_id)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [titulo, descripcion || null, archivo, clase_id],
            (err, result) => {

                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        error: 'Error guardando material'
                    });
                }

                res.json({ ok: true, id: result.insertId });
            }
        );

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
}

router.post('/', auth, requireRole('docente', 'administrador'), aceptarArchivo, crearMaterialHandler);
router.post('/subir', auth, requireRole('docente', 'administrador'), aceptarArchivo, crearMaterialHandler);

// =====================
// EDITAR MATERIAL (Docente dueño / Admin)
// PUT /api/materiales/:id
// =====================
router.put('/:id', auth, requireRole('docente', 'administrador'), (req, res) => {

    const { id } = req.params;
    const { titulo, descripcion } = req.body;
    const { id: usuarioId, rol } = req.usuario;

    if (!titulo) {
        return res.status(400).json({ error: "El título es obligatorio" });
    }

    const sqlVerify = `
        SELECT m.id, c.docente_id
        FROM materiales m
        INNER JOIN clases c ON c.id = m.clase_id
        WHERE m.id = ?
    `;

    db.query(sqlVerify, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: "Error validando permiso" });
        if (rows.length === 0) return res.status(404).json({ error: "Material no encontrado" });

        if (rol !== 'administrador' && rows[0].docente_id !== usuarioId) {
            return res.status(403).json({ error: "No puedes editar este material" });
        }

        db.query(
            "UPDATE materiales SET titulo = ?, descripcion = ? WHERE id = ?",
            [titulo, descripcion || null, id],
            (err2) => {
                if (err2) {
                    console.log(err2);
                    return res.status(500).json({ error: "Error al actualizar material" });
                }
                res.json({ ok: true, mensaje: "Material actualizado correctamente" });
            }
        );
    });
});


// =====================
// ELIMINAR MATERIAL
// =====================
router.delete('/:id', auth, requireRole('docente', 'administrador'), (req, res) => {
    const { id } = req.params;
    const { id: usuarioId, rol } = req.usuario;

    // Admin: cualquier material. Docente: solo los de sus clases.
    const sqlVerify = rol === 'administrador'
        ? `SELECT m.id, m.archivo FROM materiales m WHERE m.id = ?`
        : `SELECT m.id, m.archivo
           FROM materiales m
           INNER JOIN clases c ON c.id = m.clase_id
           WHERE m.id = ? AND c.docente_id = ?`;
    const verifParams = rol === 'administrador' ? [id] : [id, usuarioId];

    db.query(sqlVerify, verifParams, (err, rows) => {
        if (err) return res.status(500).json({ error: "Error validando permiso" });
        if (rows.length === 0) return res.status(403).json({ error: "No tienes permiso para eliminar este material" });

        const archivo = rows[0].archivo;

        db.query("DELETE FROM materiales WHERE id = ?", [id], (err, result) => {
            if (err) return res.status(500).json({ error: "Error al eliminar material" });

            // Eliminar archivo físico si existe
            if (archivo) {
                const filePath = path.join(uploadsDir, archivo);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            res.json({ message: "Material eliminado" });
        });
    });
});

module.exports = router;
