console.log("start of server");

const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database('./src/animals.db');

const express = require('express');
const server = express();

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const UNSPLASH_ACCESS_KEY = 'NOgDJ-n-JVMpuk-5NArfVsraj_Z_nUJMgZKdxCqzmw4';

// Add image cache with 5-minute expiration
const imageCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to get/set cache
function getCachedImage(query) {
  const cached = imageCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`🎯 Cache hit for: ${query}`);
    return cached.imageUrl;
  }
  return null;
}

function setCachedImage(query, imageUrl) {
  console.log(`💾 Caching image for: ${query}`);
  imageCache.set(query, {
    imageUrl,
    timestamp: Date.now()
  });
}

server
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
  .use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Headers", '*');
    res.header("Access-Control-Allow-Methods", '*');

    next();
});

const startServer = (port) => {
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(3000);

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

server.get("/animal-image/:query", async (req, res) => {
  const query = req.params.query;
  console.log(`🔍 Getting image for: ${query}`);

  // Check cache first
  const cachedUrl = getCachedImage(query);
  if (cachedUrl) {
    console.log(`✨ Returning cached image for: ${query}`);
    return res.json({ imageUrl: cachedUrl });
  }

  // If not in cache, fetch from Unsplash
  const enhancedQuery = `${query} animal wildlife nature`;
  const unsplashUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(enhancedQuery)}&orientation=landscape`;
  
  try {
    const response = await fetch(unsplashUrl, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.urls || !data.urls.regular) {
      throw new Error('Invalid image data from Unsplash');
    }

    const imageUrl = data.urls.regular;
    console.log(`✅ Successfully fetched new image for: ${query}`);
    
    // Cache the new image
    setCachedImage(query, imageUrl);
    
    res.json({ imageUrl });
  } catch (error) {
    console.error(`❌ Error fetching image for ${query}:`, error);
    res.status(500).json({ 
      error: error.message,
      imageUrl: null
    });
  }
});