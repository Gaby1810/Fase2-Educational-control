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

router.post('/', auth, requireRole('docente'), aceptarArchivo, crearMaterialHandler);
router.post('/subir', auth, requireRole('docente'), aceptarArchivo, crearMaterialHandler);

module.exports = router;
