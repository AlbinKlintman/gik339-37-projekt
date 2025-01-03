console.log("start of server");

const sqlite = require("sqlite3").verbose();
const express = require('express');
const cors = require('cors');

const server = express();
const db = new sqlite.Database('./src/animals.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Successfully connected to database');
  }
});

// Middleware setup
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: false }));

// Error handling middleware
server.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    type: err.name,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message,
    path: req.path
  });
});

// GET all animals
server.get('/animals', (req, res) => {
  console.log('GET /animals request received');
  
  const sql = 'SELECT * FROM animals';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Database error in GET /animals:', {
        message: err.message,
        stack: err.stack,
        sql: sql
      });
      res.status(500).json({ 
        error: 'Database error',
        details: err.message 
      });
      return;
    }
    
    console.log(`Successfully retrieved ${rows.length} animals`);
    res.json(rows);
  });
});

// GET single animal
server.get('/animals/:id', (req, res) => {
  const sql = 'SELECT * FROM animals WHERE id = ?';
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Animal not found' });
      return;
    }
    res.json(row);
  });
});

// POST new animal
server.post('/animals', (req, res) => {
  console.log('POST /animals request received', {
    body: req.body
  });
  
  const { name, species, funFact, diet, category, habitat, lifespan, imageUrl } = req.body;
  
  // Validate required fields
  const requiredFields = ['name', 'species', 'diet', 'category', 'habitat'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    console.error('Missing required fields:', missingFields);
    res.status(400).json({
      error: 'Missing required fields',
      details: `Missing: ${missingFields.join(', ')}`
    });
    return;
  }

  const sql = `INSERT INTO animals (name, species, funFact, diet, category, habitat, lifespan, imageQuery) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [name, species, funFact, diet, category, habitat, lifespan, imageUrl], function(err) {
    if (err) {
      console.error('Database error in POST /animals:', {
        message: err.message,
        stack: err.stack,
        sql: sql,
        values: [name, species, funFact, diet, category, habitat, lifespan, imageUrl]
      });
      res.status(500).json({ 
        error: 'Database error',
        details: err.message 
      });
      return;
    }
    
    console.log('Successfully added new animal with ID:', this.lastID);
    res.json({
      id: this.lastID,
      message: 'Animal added successfully'
    });
  });
});

// PUT update animal
server.put('/animals/:id', (req, res) => {
  const { name, species, funFact, diet, category, habitat, lifespan, imageQuery } = req.body;
  const sql = `UPDATE animals 
               SET name = ?, species = ?, funFact = ?, diet = ?, 
                   category = ?, habitat = ?, lifespan = ?, imageQuery = ?
               WHERE id = ?`;
  
  db.run(sql, [name, species, funFact, diet, category, habitat, lifespan, imageQuery, req.params.id], 
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Animal not found' });
        return;
      }
      res.json({ message: 'Animal updated successfully' });
  });
});

// DELETE animal
server.delete('/animals/:id', (req, res) => {
  const sql = 'DELETE FROM animals WHERE id = ?';
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Animal not found' });
      return;
    }
    res.json({ message: 'Animal deleted successfully' });
  });
});

// Start server
server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});