require('dotenv').config();
const express = require('express');
const sqlite = require("sqlite3").verbose();
const fs = require('fs').promises;
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const server = express();
const db = new sqlite.Database('./src/animals.db');
const imageCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000;

console.log('Environment check:');
console.log('PORT:', process.env.PORT);
console.log('NINJA_API_KEY length:', process.env.NINJA_API_KEY?.length);
console.log('NINJA_API_KEY first 10 chars:', process.env.NINJA_API_KEY?.substring(0, 10));

// Initialize database
async function initializeDatabase() {
  try {
    // Read SQL file
    const sqlFile = await fs.readFile(path.join(__dirname, 'animals.sql'), 'utf8');
    
    // Split into individual statements and execute them
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.exec(sqlFile, (err) => {
          if (err) {
            console.error('Database initialization error:', err);
            reject(err);
          } else {
            console.log('Database initialized successfully');
            resolve();
          }
        });
      });
    });
  } catch (error) {
    console.error('Failed to read SQL file:', error);
    throw error;
  }
}

// Basic middleware
server.use(express.json())
      .use(express.urlencoded({ extended: false }))
      .use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", '*');
        res.header("Access-Control-Allow-Headers", '*');
        res.header("Access-Control-Allow-Methods", '*');
        next();
      });

// Cache functions
const getCachedData = (key) => {
  const cached = imageCache.get(key);
  return (cached && Date.now() - cached.timestamp < CACHE_DURATION) ? cached.data : null;
};

const setCachedData = (key, data) => {
  imageCache.set(key, { data, timestamp: Date.now() });
};

// Routes
server.get("/animals", (req, res) => {
  db.all("SELECT * FROM animals", (err, rows) => {
    err ? res.status(500).send(err) : res.send(rows);
  });
});

server.post("/animals", (req, res) => {
  const { name } = req.body;
  db.run("INSERT INTO animals (name) VALUES (?)", [name], (err) => {
    err ? res.status(500).send(err) : res.json({ id: this.lastID, name });
  });
});

server.delete("/animals/:id", (req, res) => {
  db.run("DELETE FROM animals WHERE id = ?", [req.params.id], (err) => {
    err ? res.status(500).send(err) : res.sendStatus(200);
  });
});

// Animal info endpoint (combines Ninja API and Unsplash)
server.get("/animal-info/:name", async (req, res) => {
  const name = req.params.name;
  const cached = getCachedData(name);
  
  if (cached) {
    console.log('Returning cached data for:', name);
    return res.json(cached);
  }

  try {
    console.log('Fetching new data for:', name);
    console.log('Using API Key:', process.env.NINJA_API_KEY);
    
    // Get animal info from Ninja API
    const ninjaResponse = await fetch(
      `https://api.api-ninjas.com/v1/animals?name=${encodeURIComponent(name)}`,
      { 
        method: 'GET',
        headers: { 
          'X-Api-Key': process.env.NINJA_API_KEY.trim()
        }
      }
    );
    
    if (!ninjaResponse.ok) {
      const errorText = await ninjaResponse.text();
      console.error('Ninja API Error:', errorText);
      console.error('Response status:', ninjaResponse.status);
      console.error('Response headers:', ninjaResponse.headers);
      throw new Error(`Animal API error: ${errorText}`);
    }

    const animalData = await ninjaResponse.json();
    console.log('Ninja API response:', animalData);

    // Get image from Unsplash
    const unsplashResponse = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(name + ' animal')}&orientation=landscape`,
      { 
        headers: { 
          'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
        }
      }
    );
    
    if (!unsplashResponse.ok) {
      console.error('Unsplash API Error:', await unsplashResponse.text());
      throw new Error('Image API error');
    }

    const imageData = await unsplashResponse.json();

    const combinedData = {
      info: animalData[0] || null,
      imageUrl: imageData.urls?.regular || null
    };

    console.log('Combined data:', combinedData);
    setCachedData(name, combinedData);
    res.json(combinedData);
  } catch (error) {
    console.error('Error fetching animal info:', error);
    // Return a more graceful error response
    res.status(500).json({ 
      error: error.message,
      info: {
        name: name,
        taxonomy: { scientific_name: 'Not found' },
        characteristics: { habitat: 'Unknown', diet: 'Unknown' }
      },
      imageUrl: 'https://placehold.co/800x400/e9ecef/adb5bd?text=Image+Not+Found'
    });
  }
});

// Start server with database initialization
const port = process.env.PORT || 3000;
initializeDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });