console.log("start of server");

const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database('./src/animals.db');
const express = require('express');
const cors = require('cors');
const server = express();

server.use(cors());

server
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
  .use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Headers", '*');
    res.header("Access-Control-Allow-Methods", '*');

    next();
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

server.get("/animals", (req, res) => {
  const sql = "SELECT * FROM animals";

  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
    } else { 
      res.json(rows);
    }
  });
});