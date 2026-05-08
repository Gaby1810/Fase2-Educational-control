const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/guardar', (req, res) => {
    const { clase_id, fecha, datos } = req.body; 

    const mapaEstados = { 'P': 'presente', 'A': 'ausente', 'T': 'tarde' };

    const values = Object.entries(datos).map(([estudiante_id, estadoCorto]) => [
        fecha,
        mapaEstados[estadoCorto] || 'presente',
        clase_id,
        estudiante_id
    ]);

    const sql = "INSERT INTO asistencia (fecha, estado, clase_id, estudiante_id) VALUES ?";
    
    db.query(sql, [values], (err, result) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error al registrar asistencia" });
        }
        res.json({ message: "Asistencia guardada correctamente" });
    });
});

module.exports = router;