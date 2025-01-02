require('dotenv').config();
const express = require('express');
const sqlite = require("sqlite3").verbose();
const fs = require('fs').promises;
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const server = express();
const db = new sqlite.Database('./src/animals.db');
const imageCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;
const descriptionCache = new Map();

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

// Animal info endpoint (combines Ninja API and iNaturalist)
server.get("/animal-info/:name", async (req, res) => {
  const name = req.params.name;
  
  try {
    // Check cache first
    const cached = getCachedData(name);
    if (cached) {
      return res.json(cached);
    }

    // First get the taxonomic data from iNaturalist
    const taxonResponse = await fetch(
      `https://api.inaturalist.org/v1/taxa?` +
      `q=${encodeURIComponent(name)}` +
      `&kingdom=Animalia` +
      `&rank=species,genus` +
      `&per_page=1`, {
        headers: {
          'Authorization': `Bearer ${process.env.INATURALIST_API_KEY}`
        }
      }
    );

    if (!taxonResponse.ok) throw new Error('Failed to fetch taxon data');
    const taxonData = await taxonResponse.json();
    const taxonResult = taxonData.results[0];

    // Get observations for images
    const iNatResponse = await fetch(
      `https://api.inaturalist.org/v1/observations?` + 
      `taxon_id=${taxonResult?.id}` +
      `&order=desc` +
      `&order_by=quality_grade` +
      `&per_page=10` +
      `&photos=true` +
      `&quality_grade=research,needs_id` +
      `&captive=false`, {
        headers: {
          'Authorization': `Bearer ${process.env.INATURALIST_API_KEY}`
        }
      }
    );

    if (!iNatResponse.ok) throw new Error('Failed to fetch iNaturalist data');
    const iNatData = await iNatResponse.json();
    
    // Get the best quality image
    const bestImage = iNatData.results
      .filter(obs => obs.photos && obs.photos.length > 0)
      .map(obs => ({
        url: obs.photos[0].url.replace('square', 'large'),
        score: obs.quality_grade === 'research' ? 2 : 1
      }))
      .sort((a, b) => b.score - a.score)[0];

    // Format taxonomy data
    const taxonomy = {
      scientific_name: taxonResult?.name,
      kingdom: taxonResult?.ancestor_ids ? 'Animalia' : undefined,
      class: taxonResult?.ancestors?.find(a => a.rank === 'class')?.name,
      order: taxonResult?.ancestors?.find(a => a.rank === 'order')?.name,
      family: taxonResult?.ancestors?.find(a => a.rank === 'family')?.name,
    };

    // Get locations from iNaturalist observations
    const locations = [...new Set(iNatData.results
      .filter(obs => obs.place_guess)
      .map(obs => obs.place_guess)
      .slice(0, 5))];

    const combinedData = {
      info: {
        name: name,
        displayName: taxonResult?.preferred_common_name || taxonResult?.name || name,
        taxonomy: taxonomy,
        locations: locations
      },
      imageUrl: bestImage?.url || 'https://placehold.co/800x400/e9ecef/adb5bd?text=Image+Not+Found'
    };

    setCachedData(name, combinedData);
    res.json(combinedData);
  } catch (error) {
    console.error('Error fetching animal info:', error);
    res.status(500).json({ 
      error: error.message,
      info: {
        name: name,
        taxonomy: { scientific_name: 'Not found' },
        locations: []
      },
      imageUrl: 'https://placehold.co/800x400/e9ecef/adb5bd?text=Image+Not+Found'
    });
  }
});

// Add this new endpoint to expose the API key
server.get("/config", (req, res) => {
  res.json({
    geminiApiKey: process.env.GEMINI_API_KEY
  });
});

// Add this new endpoint for Gemini descriptions
server.post("/generate-description", async (req, res) => {
  const { animalName, scientificName } = req.body;
  const cacheKey = `${animalName}-${scientificName}`;
  
  try {
    // Check cache first
    const cached = getCachedData(cacheKey, descriptionCache);
    if (cached) {
      console.log('Returning cached description for:', animalName);
      return res.json({ description: cached });
    }

    const prompt = `Create a comprehensive description about the ${animalName} (${scientificName}). Start with a detailed overview paragraph without any title, then continue with the following sections:

${animalName} is... [Start directly with the overview paragraph describing physical features, size, and distinctive characteristics]

# Habitat & Distribution
Write a detailed account of where this animal lives, including:
- Preferred ecosystems and environments
- Geographical range and distribution patterns
- Adaptations to their habitat
- Any seasonal migration patterns

# Behavior & Lifestyle
Provide comprehensive information about:
- Daily activities and routines
- Social structure and group dynamics
- Hunting or feeding strategies
- Mating rituals and reproductive behavior
- Parental care and family life
- Communication methods
- Interactions with other species

# Conservation Status
Detail the current status of the species:
- Population trends
- Major threats to survival
- Conservation efforts
- Role in the ecosystem
- Human impact and coexistence

Keep the writing engaging and informative, using clear language suitable for a general audience. Make each section detailed but concise, focusing on the most interesting and important aspects of the animal's life and behavior.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) throw new Error('Failed to generate description');
    
    const data = await response.json();
    const description = data.candidates[0].content.parts[0].text;
    
    // Cache the result
    setCachedData(cacheKey, description, descriptionCache);
    
    res.json({ description });
  } catch (error) {
    console.error('Error generating description:', error);
    res.status(500).json({ 
      description: 'Unable to generate description at this time.'
    });
  }
});

// Add this new endpoint for iNaturalist observations
server.get("/observations/:name", async (req, res) => {
  const name = req.params.name;
  const cacheKey = `inaturalist-${name}`;
  
  try {
    // Check cache first
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Fetch observations from iNaturalist API
    const response = await fetch(
      `https://api.inaturalist.org/v1/observations?` + 
      `taxon_name=${encodeURIComponent(name)}` +
      `&order=desc` +
      `&order_by=created_at` +
      `&per_page=5` +
      `&photos=true` +
      `&quality_grade=research` +
      `&captive=false`
    );

    if (!response.ok) throw new Error('Failed to fetch observations');
    
    const data = await response.json();
    
    // Format the observations
    const observations = data.results.map(obs => ({
      id: obs.id,
      location: {
        latitude: obs.latitude,
        longitude: obs.longitude,
        placeGuess: obs.place_guess
      },
      observedOn: obs.observed_on,
      photoUrl: obs.photos[0]?.url?.replace('square', 'medium'),
      observer: obs.user?.login,
      quality: obs.quality_grade
    }));

    // Cache the results
    setCachedData(cacheKey, observations);
    
    res.json(observations);
  } catch (error) {
    console.error('Error fetching observations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch observations',
      observations: [] 
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