router.get('/', (req, res) => {

  console.log("GET /materiales recibido");

  const { clase_id } = req.query;

  const sql = `
    SELECT * FROM materiales
    WHERE clase_id = ?
    ORDER BY id DESC
  `;

  db.query(sql, [clase_id], (err, rows) => {

    if (err) {
      console.log("❌ DB ERROR:", err);

      return res.status(500).json({
        error: "Error en base de datos"
      });
    }

    res.json(rows);
  });
});