const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/clases", require("./src/routes/clases"));
app.use("/api/asistencia", require("./src/routes/asistencia"));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en: http://localhost:${PORT}`);
});