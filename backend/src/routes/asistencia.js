const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

const mapaEstados = { P: 'presente', A: 'ausente', T: 'tarde' };

router.post('/guardar', auth, (req, res) => {

    const { clase_id, fecha, datos } = req.body;

    if (!clase_id || !fecha || !datos || typeof datos !== 'object') {
        return res.status(400).json({
            error: "clase_id, fecha y datos son obligatorios"
        });
    }

    const entradas = Object.entries(datos);

    if (entradas.length === 0) {
        return res.status(400).json({ error: "Sin estudiantes para registrar" });
    }

    const values = entradas.map(([estudiante_id, estadoCorto]) => [
        fecha,
        mapaEstados[estadoCorto] || 'presente',
        clase_id,
        estudiante_id
    ]);

    const sql = "INSERT INTO asistencia (fecha, estado, clase_id, estudiante_id) VALUES ?";

    db.query(sql, [values], (err, result) => {

        if (err) {
            console.error("Error SQL asistencia:", err);
            return res.status(500).json({ error: "Error al registrar asistencia" });
        }

        res.json({
            message: "Asistencia guardada correctamente",
            registros: result.affectedRows
        });
    });
});

module.exports = router;
