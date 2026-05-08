const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


app.use("/api", require("./routes/auth"));

app.listen(3000, "0.0.0.0", () => {
    console.log("Servidor corriendo en red");
});