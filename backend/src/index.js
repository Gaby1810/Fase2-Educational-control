const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// LOG DE TODAS LAS PETICIONES (IMPORTANTE)
app.use((req, res, next) => {
  console.log(`➡ ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clases', require('./routes/clases'));
app.use('/api/materiales', require('./routes/materiales'));

// 404 DEBUG CLARO
app.use((req, res) => {
  console.log("❌ Ruta no encontrada:", req.url);
  res.status(404).json({ error: "Ruta no existe" });
});

app.listen(3000, '0.0.0.0', () => {
  console.log("🔥 Servidor corriendo en puerto 3000");
});