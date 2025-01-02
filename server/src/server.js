console.log("start of server");

const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database('./animals.db');

const express = require('express');
const server = express();

server
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
  .use((req, res, next) => {
    res.header("Access-Controll-Allow-Origin", '*');
    res.header("Access-Controll-Allow-Headers", '*');
    res.header("Access-Controll-Allow-Methods", '*');

    next();
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

server.get("/animals", (req, res) => {
  const sql = "SELECT * FROM animals";

  db.all(sql, (err, rows) => {
    if (err) {
      res.status(500).send(err);
    } else { 
      res.send(rows);
    }
  })
})

console.log(animalsForm);
animalsForm.addEventListener("submit", handleSubmit);

function handleSubmit(e) {
  e.preventDefault();
  const serverAnimalObject = {
    animalName:"",
    color: "",
    food: ""
  };
  console.log(animalsForm.animalName.value);
}
