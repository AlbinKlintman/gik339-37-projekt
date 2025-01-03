const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const cors = require('cors');

const server = express();
const db = new sqlite3.Database('./src/animals.db');

// Middleware
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Initialize database with schema
const initializeDatabase = () => {
  const schemaSQL = fs.readFileSync(path.join(__dirname, 'animals.sql'), 'utf8');
  
  db.serialize(() => {
    // Split the SQL file into separate statements
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    
    statements.forEach(statement => {
      if (statement.trim()) {
        db.run(statement + ';', (err) => {
          if (err) {
            console.error('Error executing SQL statement:', err);
            console.error('Statement:', statement);
          }
        });
      }
    });
  });
};

// Initialize database when server starts
initializeDatabase();

server
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

    next();
});

// Add this error handling middleware at the top after other middleware
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

// Lägg till denna funktion för att hämta bilder från iNaturalist
async function getImageFromINaturalist(speciesName) {
  try {
    console.log('Fetching image for species:', speciesName);
    const response = await fetch(
      `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(speciesName)}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const defaultPhoto = data.results[0].default_photo;
      const imageUrl = defaultPhoto ? defaultPhoto.medium_url : null;
      console.log('Found image URL:', imageUrl);
      return imageUrl;
    }
    console.log('No image found for species');
    return null;
  } catch (error) {
    console.error('Error fetching from iNaturalist:', error);
    return null;
  }
}

// POST new animal
server.post('/animals', async (req, res) => {
  console.log('Received POST request:', req.body);
  const { name, species, category } = req.body;
  
  try {
    const imageUrl = await getImageFromINaturalist(species);
    console.log('Retrieved image URL:', imageUrl);

    const sql = 'INSERT INTO animals (name, species, category, image_url) VALUES (?, ?, ?, ?)';
    db.run(sql, [name, species, category, imageUrl], function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        id: this.lastID,
        name,
        species,
        category,
        image_url: imageUrl
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
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

// Uppdatera din befintliga POST-rutt för att inkludera bilder
server.post('/api/animals', async (req, res) => {
  const { name, species, category } = req.body;
  
  try {
    const imageUrl = await getImageFromINaturalist(species);
    
    db.run(
      'INSERT INTO animals (name, species, category, image_url) VALUES (?, ?, ?, ?)',
      [name, species, category, imageUrl],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({
          id: this.lastID,
          name,
          species,
          category,
          image_url: imageUrl
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});