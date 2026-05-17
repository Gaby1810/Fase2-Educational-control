// ===============================
// routes/admin.js
// Solo accesible para rol 'administrador'
// ===============================

const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const bcrypt = require('bcrypt');

// Todos los endpoints requieren estar logueado como administrador
router.use(auth, requireRole('administrador'));


// =====================
// GET /api/admin/stats
// Tarjetas del dashboard: total docentes, estudiantes, clases
// =====================
router.get('/stats', (req, res) => {

    const sqlDocentes  = `SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'docente'`;
    const sqlEstud     = `SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'estudiante'`;
    const sqlClases    = `SELECT COUNT(*) AS total FROM clases`;
    const sqlActividad = `
        SELECT 'usuario' AS tipo, nombre AS detalle, rol AS subtipo,
               created_at AS fecha
        FROM usuarios
        ORDER BY created_at DESC
        LIMIT 10
    `;

    db.query(sqlDocentes, (err, rowsD) => {
        if (err) return res.status(500).json({ error: 'Error al obtener docentes' });

        db.query(sqlEstud, (err2, rowsE) => {
            if (err2) return res.status(500).json({ error: 'Error al obtener estudiantes' });

            db.query(sqlClases, (err3, rowsC) => {
                if (err3) return res.status(500).json({ error: 'Error al obtener clases' });

                // Actividad reciente: últimos usuarios creados + clases creadas
                const sqlAct = `
                    SELECT 'usuario_creado' AS tipo,
                           nombre AS titulo,
                           rol    AS subtitulo,
                           created_at AS fecha
                    FROM usuarios
                    ORDER BY created_at DESC
                    LIMIT 8
                `;

                db.query(sqlAct, (err4, rowsAct) => {
                    if (err4) return res.status(500).json({ error: 'Error actividad' });

                    res.json({
                        totalDocentes:    rowsD[0].total,
                        totalEstudiantes: rowsE[0].total,
                        totalClases:      rowsC[0].total,
                        actividadReciente: rowsAct || []
                    });
                });
            });
        });
    });
});


// =====================
// GET /api/admin/usuarios
// Lista todos los usuarios (filtro opcional por rol)
// =====================
router.get('/usuarios', (req, res) => {

    const { rol, busqueda } = req.query;

    let sql = `
        SELECT id, nombre, correo, rol,
               grado, seccion, turno, materia_principal,
               created_at
        FROM usuarios
        WHERE 1=1
    `;
    const params = [];

    if (rol && rol !== 'todos') {
        sql += ' AND rol = ?';
        params.push(rol);
    }

    if (busqueda) {
        sql += ' AND (nombre LIKE ? OR correo LIKE ?)';
        params.push(`%${busqueda}%`, `%${busqueda}%`);
    }

    sql += ' ORDER BY created_at DESC';

    db.query(sql, params, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        res.json(rows);
    });
});


// =====================
// PUT /api/admin/usuarios/:id
// Editar nombre, correo y rol de un usuario
// =====================
router.put('/usuarios/:id', (req, res) => {
 
    const { id } = req.params;
    const { nombre, correo, rol } = req.body;
 
    if (!nombre && !correo && !rol) {
        return res.status(400).json({ error: 'Nada que actualizar' });
    }
 
    // Si viene correo, verificar que no esté en uso por otro usuario
    if (correo) {
        db.query(
            'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
            [correo, id],
            (errCheck, rows) => {
                if (errCheck) {
                    console.error(errCheck);
                    return res.status(500).json({ error: 'Error al validar correo' });
                }
                if (rows.length > 0) {
                    return res.status(409).json({ error: 'El correo ya está en uso' });
                }
                ejecutarUpdate(id, nombre, correo, rol, res);
            }
        );
    } else {
        ejecutarUpdate(id, nombre, correo, rol, res);
    }
});
 
function ejecutarUpdate(id, nombre, correo, rol, res) {
    const fields = [];
    const params = [];
 
    if (nombre) { fields.push('nombre = ?'); params.push(nombre); }
    if (correo) { fields.push('correo = ?'); params.push(correo); }
    if (rol)    { fields.push('rol = ?');    params.push(rol); }
 
    params.push(id);
 
    const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;
 
    db.query(sql, params, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al actualizar usuario' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ mensaje: 'Usuario actualizado correctamente' });
    });
}


// =====================
// DELETE /api/admin/usuarios/:id
// Eliminar un usuario
// =====================
router.delete('/usuarios/:id', (req, res) => {
    const id = Number(req.params.id);

    if (id === req.usuario.id) {
        return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al eliminar usuario' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ mensaje: 'Usuario eliminado correctamente' });
    });
});


// =====================
// GET /api/admin/clases
// Lista todas las clases con docente y conteo de estudiantes
// =====================
router.get('/clases', (req, res) => {

    const sql = `
        SELECT
            c.id,
            c.nombre,
            c.codigo_clase,
            c.grado,
            c.seccion,
            c.descripcion,
            u.nombre  AS docente,
            u.correo  AS docente_correo,
            (SELECT COUNT(*) FROM inscripciones i WHERE i.clase_id = c.id) AS total_estudiantes
        FROM clases c
        LEFT JOIN usuarios u ON u.id = c.docente_id
        ORDER BY c.id DESC
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener clases' });
        }
        res.json(rows);
    });
});


// =====================
// DELETE /api/admin/clases/:id
// Eliminar una clase
// =====================
router.delete('/clases/:id', (req, res) => {

    const { id } = req.params;

    db.query('DELETE FROM clases WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al eliminar clase' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Clase no encontrada' });
        }
        res.json({ mensaje: 'Clase eliminada correctamente' });
    });
});


// =====================
// GET /api/admin/reportes
// Estadísticas de asistencia general y por grado
// =====================
router.get('/reportes', (req, res) => {

    // Asistencia general
    const sqlAsistTotal = `
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN estado = 'presente' THEN 1 ELSE 0 END) AS presentes,
            SUM(CASE WHEN estado = 'ausente'  THEN 1 ELSE 0 END) AS ausentes
        FROM asistencia
    `;

    // Promedio sistema (notas)
    const sqlPromedio = `SELECT AVG(calificacion) AS promedio FROM notas`;

    // Total alumnos activos
    const sqlAlumnos = `SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'estudiante'`;

    // Estudiantes por grado
    const sqlPorGrado = `
        SELECT
            c.grado,
            COUNT(DISTINCT i.estudiante_id) AS total
        FROM inscripciones i
        INNER JOIN clases c ON c.id = i.clase_id
        GROUP BY c.grado
        ORDER BY c.grado
    `;

    // Clases por grado
    const sqlClasesPorGrado = `
        SELECT grado, COUNT(*) AS total_clases
        FROM clases
        GROUP BY grado
        ORDER BY grado
    `;

    db.query(sqlAsistTotal, (err, rowsA) => {
        if (err) return res.status(500).json({ error: 'Error asistencia' });

        db.query(sqlPromedio, (err2, rowsP) => {
            if (err2) return res.status(500).json({ error: 'Error promedio' });

            db.query(sqlAlumnos, (err3, rowsAl) => {
                if (err3) return res.status(500).json({ error: 'Error alumnos' });

                db.query(sqlPorGrado, (err4, rowsG) => {
                    if (err4) return res.status(500).json({ error: 'Error por grado' });

                    db.query(sqlClasesPorGrado, (err5, rowsCG) => {
                        if (err5) return res.status(500).json({ error: 'Error clases grado' });

                        const total    = rowsA[0].total    || 0;
                        const presentes = rowsA[0].presentes || 0;
                        const pctAsist  = total > 0
                            ? Math.round((presentes / total) * 100)
                            : 0;

                        res.json({
                            asistenciaGeneral: pctAsist,
                            promedioSistema:   rowsP[0].promedio
                                ? parseFloat(rowsP[0].promedio).toFixed(1)
                                : '0.0',
                            totalAlumnos:      rowsAl[0].total,
                            estudiantesPorGrado: rowsG,
                            clasesPorGrado:      rowsCG
                        });
                    });
                });
            });
        });
    });
});


module.exports = router;