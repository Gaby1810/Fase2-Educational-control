const express = require('express');
const router = express.Router();

const multer = require('multer');

const path = require('path');

const db = require('../db');

// =====================
// CONFIG MULTER
// =====================

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    cb(null, 'uploads/');
  },

  filename: (req, file, cb) => {

    cb(
      null,
      Date.now() +
      path.extname(file.originalname)
    );
  }
});

const upload = multer({
  storage
});

// =====================
// OBTENER MATERIALES
// =====================

router.get('/:claseId', (req, res) => {

  const { claseId } = req.params;

  const sql = `
    SELECT *
    FROM materiales
    WHERE clase_id = ?
    ORDER BY id DESC
  `;

  db.query(
    sql,
    [claseId],
    (err, results) => {

      if (err) {

        console.log(err);

        return res.status(500).json({
          error: 'Error obteniendo materiales'
        });
      }

      res.json(results);
    }
  );
});

// =====================
// CREAR MATERIAL
// =====================

router.post(
  '/',
  upload.single('archivo'),
  (req, res) => {

    try {

      const {
        titulo,
        descripcion,
        clase_id
      } = req.body;

      const archivo =
        req.file
        ? req.file.filename
        : null;

      const sql = `
        INSERT INTO materiales
        (
          titulo,
          descripcion,
          archivo,
          clase_id
        )
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          titulo,
          descripcion,
          archivo,
          clase_id
        ],
        (err, result) => {

          if (err) {

            console.log(err);

            return res.status(500).json({
              error: 'Error guardando material'
            });
          }

          res.json({
            ok: true,
            id: result.insertId
          });
        }
      );

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error: error.message
      });
    }
  }
);

module.exports = router;