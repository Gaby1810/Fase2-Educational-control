const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:claseId/tareas', (req, res) => {
    const sql = "SELECT * FROM tareas WHERE clase_id = ? ORDER BY fecha_entrega ASC";
    db.query(sql, [req.params.claseId], (err, rows) => {
        if (err) return res.status(500).json({ error: "Error al obtener tareas" });
        res.json(rows);
    });
});

router.post('/tareas/crear', (req, res) => {
    const { clase_id, titulo, instrucciones, fecha_entrega } = req.body;
    const sql = "INSERT INTO tareas (titulo, instrucciones, fecha_entrega, clase_id) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [titulo, instrucciones, fecha_entrega, clase_id], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al crear tarea" });
        res.json({ id: result.insertId, message: "Tarea creada" });
    });
});

router.get('/tareas/:tareaId/seguimiento', (req, res) => {
    const { tareaId } = req.params;
    
    const sql = `
        SELECT 
            u.id, u.nombre, 
            et.archivo AS archivo_entrega, 
            et.fecha_entrega,
            n.calificacion
        FROM usuarios u
        INNER JOIN inscripciones i ON u.id = i.estudiante_id
        INNER JOIN tareas t ON i.clase_id = t.clase_id
        LEFT JOIN entrega_tareas et ON t.id = et.tarea_id AND u.id = et.estudiante_id
        LEFT JOIN notas n ON t.clase_id = n.clase_id AND u.id = n.estudiante_id
        WHERE t.id = ? AND u.rol = 'estudiante'
    `;

    db.query(sql, [tareaId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener seguimiento" });
        }
        res.json(rows);
    });
});

module.exports = router;