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
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

console.log('Environment check:');
console.log('PORT:', process.env.PORT);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');

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

    // Get observations for images with better quality and randomization
    const iNatResponse = await fetch(
      `https://api.inaturalist.org/v1/observations?` + 
      `taxon_id=${taxonResult?.id}` +
      `&order=desc` +
      `&order_by=quality_grade` +
      `&per_page=30` +
      `&photos=true` +
      `&quality_grade=research` +
      `&photo_license=cc0,cc-by,cc-by-nc` +
      `&captive=false`, {
        headers: {
          'Authorization': `Bearer ${process.env.INATURALIST_API_KEY}`
        }
      }
    );

    if (!iNatResponse.ok) throw new Error('Failed to fetch iNaturalist data');
    const iNatData = await iNatResponse.json();
    
    // Get high quality images and randomize selection
    const getHighQualityImages = (observations) => {
      return observations
        .filter(obs => obs.photos && obs.photos.length > 0)
        .map(obs => ({
          url: obs.photos[0].url.replace('square', 'original'),
          score: calculateImageScore(obs)
        }))
        .filter(img => img.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    };

    const calculateImageScore = (observation) => {
      let score = 0;
      
      // Base score for research grade
      if (observation.quality_grade === 'research') score += 3;
      
      // Bonus for recent observations
      const obsDate = new Date(observation.observed_on);
      const yearsSince = (new Date() - obsDate) / (1000 * 60 * 60 * 24 * 365);
      if (yearsSince < 2) score += 1;
      
      // Bonus for photo license
      if (observation.photos[0].license_code === 'cc0') score += 1;
      
      // Bonus for non-blurry photos (if metadata available)
      if (!observation.photos[0].flags || !observation.photos[0].flags.includes('blurry')) score += 1;
      
      return score;
    };

    // Get the best images and randomly select one
    const bestImages = getHighQualityImages(iNatData.results);
    const randomIndex = Math.floor(Math.random() * Math.min(bestImages.length, 5));
    const selectedImage = bestImages[randomIndex] || bestImages[0];

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
      imageUrl: selectedImage?.url || 'https://placehold.co/800x400/e9ecef/adb5bd?text=Image+Not+Found'
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
  const cacheKey = `description-${animalName}`;

  try {
    // Check cache first
    const cached = descriptionCache.get(cacheKey);
    if (cached) return res.json({ description: cached });

    const prompt = {
      contents: [{
        parts: [{
          text: `Generate a detailed, engaging description of the ${animalName} (${scientificName || 'Scientific name unknown'}) following this EXACT format:

[Write the overview paragraph here with NO heading above it. 2-3 sentences introducing the animal.]

**Physical Characteristics**

[Write the physical characteristics paragraph here. 3-4 sentences.]

**Habitat and Distribution**

[Write the habitat paragraph here. 3-4 sentences.]

**Behavior and Lifestyle**

[Write the behavior paragraph here. 3-4 sentences.]

**Diet and Hunting**

[Write the diet paragraph here. 3-4 sentences.]

Critical formatting rules:
1. The overview paragraph MUST NOT have any heading above it
2. Each section MUST have its bold title on a separate line above the paragraph
3. Each section MUST be separated by exactly one blank line
4. Each bold title MUST be followed by exactly one blank line before its paragraph
5. Never include the animal's name as a heading
6. Never use markdown headings (#), only use bold text (**)
7. Keep all paragraphs between 3-4 sentences long (except overview: 2-3 sentences)
8. Use clear, scientific language without speculation
9. Follow this exact order: overview, physical, habitat, behavior, diet
10. Maintain consistent double line breaks between sections`
        }]
      }]
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify(prompt)
    });

    if (!response.ok) throw new Error('Failed to generate description');
    
    const data = await response.json();
    const description = data.candidates[0].content.parts[0].text;
    
    // Cache the result
    descriptionCache.set(cacheKey, description);
    
    res.json({ description });
  } catch (error) {
    console.error('Error generating description:', error);
    res.status(500).json({ 
      error: 'Failed to generate description',
      description: 'Description currently unavailable.' 
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
      `&per_page=3` +
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