const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/crear", (req, res) => {
   
    const { nombre, grado, seccion, docente_id } = req.body;

    const codigo_clase = Math.random().toString(36).substring(2, 8).toUpperCase();

    const sql = `
        INSERT INTO clases (nombre, codigo_clase, grado, seccion, docente_id) 
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql, 
        [nombre, codigo_clase, grado, seccion, docente_id || null], 
        (err, result) => {
            if (err) {
                console.error("Error al insertar clase:", err);
                return res.status(500).json({ message: "Error al guardar en la base de datos" });
            }
            res.status(201).json({ 
                message: "Clase creada con éxito", 
                id: result.insertId,
                codigo: codigo_clase 
            });
        }
    );
});

module.exports = router;