const express = require('express');
const router = express.Router();
const db = require('../db');


// OBTENER CLASES
router.get('/', (req, res) => {

    const sql = "SELECT * FROM clases ORDER BY id DESC";

    db.query(sql, (err, rows) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                error: "Error al obtener clases"
            });
        }

        res.json(rows);
    });
});


// CREAR CLASE
router.post('/crear', (req, res) => {

    const {
        nombre,
        grado,
        seccion,
        docente_id
    } = req.body;

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
        [
            nombre,
            grado,
            seccion,
            codigo_clase,
            docente_id
        ],
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

module.exports = router;