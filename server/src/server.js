const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const cors = require('cors');

const server = express();
const db = new sqlite3.Database('./src/animals.db');

// Middleware
server.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400
}));
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Initialize database with schema
const initializeDatabase = () => {
  console.log('Initializing database...');
  
  db.run("DROP TABLE IF EXISTS animals", async (err) => {
    if (err) {
      console.error('Error dropping table:', err);
      return;
    }
    
    console.log('Successfully dropped existing table');
    
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'animals.sql'), 'utf8');
    
    db.run(schemaSQL, async (err) => {
      if (err) {
        console.error('Error creating table:', err);
        return;
      }
      console.log('Successfully created new table with updated schema');
      
      // Populate default animals after table is created
      await populateDefaultAnimals();
    });
  });
};

// Add this after initializeDatabase function
async function populateDefaultAnimals() {
  console.log('Populating default animals...');
  
  const defaultAnimals = [
    {
      name: 'African Lion',
      species: 'Panthera leo',
      category: 'mammals',
      funFact: 'Male lions can sleep up to 20 hours a day!',
      diet: 'Carnivore',
      habitat: 'Savanna',
      lifespan: 15
    },
    {
      name: 'Emperor Penguin',
      species: 'Aptenodytes forsteri',
      category: 'birds',
      funFact: 'Can dive up to 500 meters deep in search of food',
      diet: 'Piscivore',
      habitat: 'Antarctic',
      lifespan: 20
    },
    {
      name: 'Giant Pacific Octopus',
      species: 'Enteroctopus dofleini',
      category: 'marine',
      funFact: 'Has three hearts and blue blood',
      diet: 'Carnivore',
      habitat: 'Marine',
      lifespan: 5
    },
    {
      name: 'Red-Eyed Tree Frog',
      species: 'Agalychnis callidryas',
      category: 'amphibians',
      funFact: 'Their eyes are red to camouflage during the day',
      diet: 'Insectivore',
      habitat: 'Tropical',
      lifespan: 5
    },
    {
      name: 'Monarch Butterfly',
      species: 'Danaus plexippus',
      category: 'insects',
      funFact: 'Can travel up to 3000 miles during migration',
      diet: 'Herbivore',
      habitat: 'Temperate',
      lifespan: 1
    }
  ];

  for (const animal of defaultAnimals) {
    try {
      console.log(`Adding default animal: ${animal.name}`);
      const imageUrl = await getImageFromINaturalist(animal.species);
      
      const sql = `INSERT INTO animals (name, species, category, funFact, diet, habitat, lifespan, image_url) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
      await new Promise((resolve, reject) => {
        db.run(sql, [
          animal.name,
          animal.species,
          animal.category,
          animal.funFact,
          animal.diet,
          animal.habitat,
          animal.lifespan,
          imageUrl
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log(`✅ Successfully added ${animal.name}`);
    } catch (error) {
      console.error(`Failed to add ${animal.name}:`, error);
    }
  }
  console.log('Finished populating default animals');
}

// Call initializeDatabase when server starts
initializeDatabase();

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

// GET all animals with image verification
server.get('/animals', async (req, res) => {
  console.log('GET /animals request received');
  
  const sql = 'SELECT * FROM animals';
  
  db.all(sql, [], async (err, rows) => {
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

    try {
      // Check and update missing images
      const updatedRows = await Promise.all(rows.map(async (animal) => {
        if (!animal.image_url) {
          console.log(`🔄 Fetching missing image for ${animal.species}`);
          try {
            const imageUrl = await getImageFromINaturalist(animal.species);
            if (imageUrl) {
              // Update the database with the new image URL
              const updateSql = 'UPDATE animals SET image_url = ? WHERE id = ?';
              await new Promise((resolve, reject) => {
                db.run(updateSql, [imageUrl, animal.id], (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
              animal.image_url = imageUrl;
            }
          } catch (error) {
            console.error(`Failed to fetch image for ${animal.species}:`, error);
          }
        }
        return animal;
      }));
      
      console.log(`Successfully retrieved and updated ${updatedRows.length} animals`);
      res.json(updatedRows);
    } catch (error) {
      console.error('Error processing animals:', error);
      res.status(500).json({ 
        error: 'Failed to process animals',
        details: error.message 
      });
    }
  });
});

// GET single animal with image verification
server.get('/animals/:id', async (req, res) => {
  const sql = 'SELECT * FROM animals WHERE id = ?';
  
  db.get(sql, [req.params.id], async (err, animal) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!animal) {
      res.status(404).json({ error: 'Animal not found' });
      return;
    }

    try {
      // Check and update missing image
      if (!animal.image_url) {
        console.log(`🔄 Fetching missing image for ${animal.species}`);
        try {
          const imageUrl = await getImageFromINaturalist(animal.species);
          if (imageUrl) {
            // Update the database with the new image URL
            const updateSql = 'UPDATE animals SET image_url = ? WHERE id = ?';
            await new Promise((resolve, reject) => {
              db.run(updateSql, [imageUrl, animal.id], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
            animal.image_url = imageUrl;
          }
        } catch (error) {
          console.error(`Failed to fetch image for ${animal.species}:`, error);
        }
      }
      
      res.json(animal);
    } catch (error) {
      console.error('Error processing animal:', error);
      res.status(500).json({ 
        error: 'Failed to process animal',
        details: error.message 
      });
    }
  });
});

// Improve image fetching from iNaturalist with better logging
async function getImageFromINaturalist(speciesName) {
  try {
    console.log('\n🔍 Starting image search for species:', speciesName);
    
    // First try exact species match
    const exactMatchUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(speciesName)}&per_page=1&order=desc&order_by=observations_count`;
    console.log('\n📡 API Request:', {
      url: exactMatchUrl,
      method: 'GET',
      timestamp: new Date().toISOString()
    });
    
    const response = await fetch(exactMatchUrl);
    const data = await response.json();
    
    console.log('\n📥 iNaturalist Response:', {
      status: response.status,
      totalResults: data.total_results,
      hasResults: Boolean(data.results?.length),
      firstResult: data.results?.[0] ? {
        id: data.results[0].id,
        name: data.results[0].name,
        hasPhoto: Boolean(data.results[0].default_photo),
        photoUrl: data.results[0].default_photo?.medium_url
      } : 'No results'
    });
    
    if (data.results?.[0]?.default_photo?.medium_url) {
      const imageUrl = data.results[0].default_photo.medium_url;
      console.log('\n✅ Found exact match image:', imageUrl);
      return imageUrl;
    }

    // Log the fallback attempt
    console.log('\n🔄 No exact match found, trying autocomplete...');
    
    const autoCompleteUrl = `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(speciesName)}&per_page=1`;
    console.log('\n📡 Autocomplete API Request:', {
      url: autoCompleteUrl,
      method: 'GET',
      timestamp: new Date().toISOString()
    });
    
    const autoCompleteResponse = await fetch(autoCompleteUrl);
    const autoCompleteData = await autoCompleteResponse.json();
    
    console.log('\n📥 Autocomplete Response:', {
      status: autoCompleteResponse.status,
      hasResults: Boolean(autoCompleteData.results?.length),
      firstResult: autoCompleteData.results?.[0] ? {
        id: autoCompleteData.results[0].id,
        name: autoCompleteData.results[0].name,
        hasPhoto: Boolean(autoCompleteData.results[0].default_photo),
        photoUrl: autoCompleteData.results[0].default_photo?.medium_url
      } : 'No results'
    });
    
    if (autoCompleteData.results?.[0]?.default_photo?.medium_url) {
      const imageUrl = autoCompleteData.results[0].default_photo.medium_url;
      console.log('\n✅ Found autocomplete image:', imageUrl);
      return imageUrl;
    }

    console.log('\n❌ No image found after both attempts');
    throw new Error(`No image found for species: ${speciesName}`);
  } catch (error) {
    console.error('\n❌ Image fetch error:', {
      error: error.message,
      stack: error.stack,
      speciesName,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// Update the POST endpoint to handle the simplified form
server.post('/animals', async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  try {
    console.log(`🔍 Searching for animal: ${name}`);
    
    // Search iNaturalist for the species
    const searchUrl = `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(name)}&per_page=1`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!data.results?.[0]) {
      throw new Error(`No results found for: ${name}`);
    }

    const species = data.results[0];
    const imageUrl = await getImageFromINaturalist(species.name);
    
    if (!imageUrl) {
      throw new Error(`No image found for: ${name}`);
    }

    // Prepare animal data from iNaturalist response
    const animalData = {
      name: species.preferred_common_name || species.name,
      species: species.name,
      category: species.iconic_taxon_name?.toLowerCase() || 'unknown',
      funFact: `This ${species.preferred_common_name || species.name} has been observed ${species.observations_count} times on iNaturalist!`,
      diet: species.preferred_establishment_means || 'unknown',
      habitat: species.establishment_means || 'unknown',
      lifespan: 0,
      image_url: imageUrl
    };

    // Insert into database
    const sql = `INSERT INTO animals (name, species, category, funFact, diet, habitat, lifespan, image_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    await new Promise((resolve, reject) => {
      db.run(sql, [
        animalData.name,
        animalData.species,
        animalData.category,
        animalData.funFact,
        animalData.diet,
        animalData.habitat,
        animalData.lifespan,
        animalData.image_url
      ], function(err) {
        if (err) reject(err);
        else {
          animalData.id = this.lastID;
          resolve();
        }
      });
    });

    console.log(`✅ Successfully added ${animalData.name}`);
    res.json(animalData);
  } catch (error) {
    console.error('Error adding animal:', error);
    res.status(400).json({ 
      error: `Failed to add animal: ${error.message}` 
    });
  }
});

// Update the PUT endpoint to handle image requirement
server.put('/animals/:id', async (req, res) => {
  const { name, species, funFact, diet, category, habitat, lifespan } = req.body;
  
  try {
    const imageUrl = await getImageFromINaturalist(species);
    if (!imageUrl) {
      res.status(400).json({ error: 'Could not find an image for this species. Please verify the species name.' });
      return;
    }

    const sql = `UPDATE animals 
                 SET name = ?, species = ?, funFact = ?, diet = ?, 
                     category = ?, habitat = ?, lifespan = ?, image_url = ?
                 WHERE id = ?`;
    
    db.run(sql, [name, species, funFact, diet, category, habitat, lifespan, imageUrl, req.params.id], 
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Animal not found' });
          return;
        }
        res.json({ 
          message: 'Animal updated successfully',
          image_url: imageUrl 
        });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(400).json({ 
      error: 'Failed to update animal entry',
      details: error.message 
    });
  }
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

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});