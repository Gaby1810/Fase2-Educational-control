require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Asegurar que exista la carpeta uploads/
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Health-check público
app.use('/api', require('./routes'));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clases', require('./routes/clases'));
app.use('/api/materiales', require('./routes/materiales'));
app.use('/api/asistencia', require('./routes/asistencia'));
app.use('/api/tareas', require('./routes/tareas'));
app.use('/api/notas', require('./routes/notas'));
app.use('/api/admin', require('./routes/admin'));   // ADMIN

// 404
app.use((req, res) => {
    console.log("❌ Ruta no encontrada:", req.method, req.url);
    res.status(404).json({ error: "Ruta no existe" });
});

// Manejador de errores
app.use((err, req, res, next) => {
    console.error("💥 Error:", err.stack);
    res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});