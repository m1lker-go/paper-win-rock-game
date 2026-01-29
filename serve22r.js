const express = require("express");
const path = require("path");

const app = express();
const PORT = 10000;

// раздаём папку public
app.use(express.static(path.join(__dirname, "public")));

// защита на случай, если что-то не подхватится
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
