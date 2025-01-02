// Instead, use the API key directly (since it's a public key anyway)
const UNSPLASH_ACCESS_KEY = 'NOgDJ-n-JVMpuk-5NArfVsraj_Z_nUJMgZKdxCqzmw4';

// Add this at the top of script.js
const imageCache = new Map();

// Add this to determine if we're in development mode
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

// Function to fetch image from Unsplash
async function getAnimalImage(query) {
  console.log(`🔍 Getting image for: ${query}`);
  
  // Check cache first
  if (imageCache.has(query)) {
    console.log(`📦 Found in cache for: ${query}`);
    return imageCache.get(query);
  }

  console.log(`🌐 Fetching from Unsplash API for: ${query}`);
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const data = await response.json();
    const imageUrl = data.urls.regular;
    
    console.log(`✅ Successfully fetched Unsplash image for: ${query}`);
    console.log(`💾 Caching new image for: ${query}`);
    imageCache.set(query, imageUrl);
    saveImageCache(); // Save to localStorage after each new cache
    return imageUrl;
  } catch (error) {
    console.error(`❌ Error fetching Unsplash image for ${query}:`, error);
    // Use placeholder if fetch fails
    const placeholderUrl = 'https://placehold.co/800x400/e9ecef/adb5bd?text=Animal+Image';
    console.log(`⚠️ Using placeholder image for: ${query}`);
    imageCache.set(query, placeholderUrl);
    return placeholderUrl;
  }
}

// Mock data for animal species
const mockAnimals = [
  {
    id: 1,
    name: "African Lion",
    species: "Panthera leo",
    funFact: "Male lions can sleep up to 20 hours a day!",
    diet: "carnivore",
    category: "mammals",
    habitat: "terrestrial",
    lifespan: 15
  },
  {
    id: 2,
    name: "Emperor Penguin",
    species: "Aptenodytes forsteri",
    funFact: "Can dive up to 500 meters deep and hold their breath for 20 minutes!",
    diet: "carnivore",
    category: "birds",
    habitat: "aquatic",
    lifespan: 20
  },
  {
    id: 3,
    name: "Giant Pacific Octopus",
    species: "Enteroctopus dofleini",
    funFact: "Has three hearts and can change color in less than a second!",
    diet: "carnivore",
    category: "marine",
    habitat: "aquatic",
    lifespan: 5
  },
  {
    id: 4,
    name: "Red-Eyed Tree Frog",
    species: "Agalychnis callidryas",
    funFact: "They sleep during the day with their eyes closed, showing only white!",
    diet: "carnivore",
    category: "reptiles",
    habitat: "terrestrial",
    lifespan: 5
  },
  {
    id: 5,
    name: "Monarch Butterfly",
    species: "Danaus plexippus",
    funFact: "They can travel up to 3000 miles during migration!",
    diet: "herbivore",
    category: "insects",
    habitat: "aerial",
    lifespan: 1
  }
];

// Mock API functions
async function fetchAnimals() {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Only fetch images if the URL is missing or invalid
  for (let animal of mockAnimals) {
    if (!animal.imageUrl || animal.imageUrl.includes('placehold.co')) {
      animal.imageUrl = await getAnimalImage(animal.name.toLowerCase());
    }
  }
  
  return mockAnimals;
}

async function addAnimal(animal) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const imageUrl = await getAnimalImage(animal.name.toLowerCase());
  const newAnimal = { 
    ...animal, 
    id: mockAnimals.length + 1,
    imageUrl: imageUrl || 'https://placehold.co/800x400/e9ecef/adb5bd?text=No+Image+Available'
  };
  mockAnimals.push(newAnimal);
  return newAnimal;
}

async function updateAnimal(id, updatedAnimal) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockAnimals.findIndex(a => a.id === id);
  if (index !== -1) {
    mockAnimals[index] = { ...updatedAnimal, id };
    return mockAnimals[index];
  }
  throw new Error('Species not found');
}

async function deleteAnimal(id) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockAnimals.findIndex(a => a.id === id);
  if (index !== -1) {
    mockAnimals.splice(index, 1);
    return true;
  }
  throw new Error('Species not found');
}

// Add these functions to manage the cache
function loadImageCache() {
  try {
    const cached = localStorage.getItem('animalImageCache');
    if (cached) {
      const entries = JSON.parse(cached);
      entries.forEach(([key, value]) => imageCache.set(key, value));
      console.log(`📥 Loaded ${entries.length} images from cache`);
    } else {
      console.log('💭 No existing image cache found');
    }
  } catch (error) {
    console.error('❌ Error loading image cache:', error);
  }
}

function saveImageCache() {
  try {
    const entries = Array.from(imageCache.entries());
    localStorage.setItem('animalImageCache', JSON.stringify(entries));
    console.log(`📤 Saved ${entries.length} images to cache`);
  } catch (error) {
    console.error('❌ Error saving image cache:', error);
  }
}

// Load cache when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadImageCache();
  loadAnimals();
  setupEventListeners();
});

async function loadAnimals() {
  try {
    const animals = await fetchAnimals();
    displayAnimals(animals);
  } catch (error) {
    showFeedback('Error loading species: ' + error.message);
  }
}

function displayAnimals(animals) {
  const animalList = document.getElementById('animalList');
  animalList.innerHTML = animals.map(animal => `
    <div class="col-lg-4 col-md-6">
      <div class="card h-100 category-${animal.category} habitat-${animal.habitat}" 
           onclick="showAnimalDetails(${animal.id})" 
           style="cursor: pointer;">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <span class="badge bg-primary">${animal.category}</span>
            <span class="badge bg-secondary">${animal.habitat}</span>
          </div>
          <div class="btn-group" onclick="event.stopPropagation()">
            <button class="btn btn-light btn-sm" onclick="editAnimal(${animal.id})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-light btn-sm" onclick="confirmDelete(${animal.id})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <h5 class="card-title">${animal.name}</h5>
          <h6 class="card-subtitle mb-2 text-muted"><em>${animal.species}</em></h6>
          <p class="card-text">
            <i class="bi bi-lightbulb me-2"></i>${animal.funFact}
          </p>
          <div class="d-flex justify-content-between text-muted small">
            <span><i class="bi bi-egg-fried me-1"></i>${animal.diet}</span>
            <span><i class="bi bi-hourglass-split me-1"></i>${animal.lifespan} years</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Add this new function to handle showing animal details
function showAnimalDetails(id) {
  const animal = mockAnimals.find(a => a.id === id);
  if (!animal) return;

  const modalTitle = document.getElementById('detailsModalTitle');
  const modalBody = document.getElementById('detailsModalBody');
  
  // First show loading state
  modalTitle.textContent = animal.name;
  modalBody.innerHTML = `
    <div class="animal-details">
      <div class="text-center mb-4 position-relative">
        <div class="placeholder-glow">
          <div class="placeholder col-12" style="height: 400px; border-radius: 8px;"></div>
        </div>
      </div>
      <div class="placeholder-glow">
        <div class="placeholder col-8 mb-4" style="height: 24px;"></div>
        <div class="placeholder col-6 mb-4" style="height: 24px;"></div>
        <div class="placeholder col-10 mb-4" style="height: 24px;"></div>
        <div class="placeholder col-7 mb-4" style="height: 24px;"></div>
      </div>
    </div>
  `;

  // Show the modal immediately with loading state
  const detailsModal = new bootstrap.Modal(document.getElementById('animalDetailsModal'));
  detailsModal.show();

  // Load the image
  const img = new Image();
  img.onload = () => {
    modalBody.innerHTML = `
      <div class="animal-details">
        <div class="text-center mb-4">
          <img src="${animal.imageUrl}" 
               alt="${animal.name}" 
               class="animal-detail-image rounded shadow-sm">
        </div>
        
        <div class="mb-4">
          <h6 class="text-muted">Scientific Name</h6>
          <p class="fs-5"><em>${animal.species}</em></p>
        </div>
        
        <div class="mb-4">
          <h6 class="text-muted">Classification</h6>
          <div class="d-flex gap-2 mb-2">
            <span class="badge bg-primary">${animal.category}</span>
            <span class="badge bg-secondary">${animal.habitat}</span>
            <span class="badge bg-info">${animal.diet}</span>
          </div>
        </div>

        <div class="mb-4">
          <h6 class="text-muted">Fun Fact</h6>
          <p><i class="bi bi-lightbulb me-2"></i>${animal.funFact}</p>
        </div>

        <div class="mb-4">
          <h6 class="text-muted">Lifespan</h6>
          <p><i class="bi bi-hourglass-split me-2"></i>${animal.lifespan} years</p>
        </div>
      </div>
    `;
  };

  img.onerror = () => {
    // Show error state if image fails to load
    modalBody.querySelector('.placeholder-glow').innerHTML = `
      <div class="text-center p-5 bg-light rounded">
        <i class="bi bi-image text-muted display-1"></i>
        <p class="text-muted mt-3">Image not available</p>
      </div>
    `;
  };

  img.src = animal.imageUrl;
}

// Add these functions at the bottom of script.js

function showFeedback(message) {
  const feedbackMessage = document.getElementById('feedbackMessage');
  feedbackMessage.textContent = message;
  
  const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
  feedbackModal.show();
}

function setupEventListeners() {
  // Form submission handler
  const animalForm = document.getElementById('animalForm');
  animalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('name').value,
      species: document.getElementById('species').value,
      funFact: document.getElementById('funFact').value,
      diet: document.getElementById('diet').value,
      category: document.getElementById('category').value,
      habitat: document.getElementById('habitat').value,
      lifespan: parseInt(document.getElementById('lifespan').value),
      imageUrl: document.getElementById('imageUrl').value
    };

    const animalId = document.getElementById('animalId').value;
    
    try {
      if (animalId) {
        // Update existing animal
        await updateAnimal(parseInt(animalId), formData);
        showFeedback('Species updated successfully!');
      } else {
        // Add new animal
        await addAnimal(formData);
        showFeedback('New species added successfully!');
      }
      
      // Refresh the list and close the modal
      loadAnimals();
      const modal = bootstrap.Modal.getInstance(document.getElementById('animalFormModal'));
      modal.hide();
      animalForm.reset();
    } catch (error) {
      showFeedback('Error: ' + error.message);
    }
  });

  // Filter handlers
  document.getElementById('categoryFilter').addEventListener('change', filterAnimals);
  document.getElementById('habitatFilter').addEventListener('change', filterAnimals);

  // Delete confirmation handler
  document.getElementById('confirmDelete').addEventListener('click', async () => {
    const animalId = parseInt(document.getElementById('confirmDelete').dataset.animalId);
    try {
      await deleteAnimal(animalId);
      showFeedback('Species deleted successfully!');
      loadAnimals();
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
      modal.hide();
    } catch (error) {
      showFeedback('Error deleting species: ' + error.message);
    }
  });

  document.querySelector('[data-bs-target="#animalFormModal"]').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Add New Species';
    document.getElementById('animalId').value = '';
    document.getElementById('animalForm').reset();
  });
}

function filterAnimals() {
  const categoryFilter = document.getElementById('categoryFilter').value;
  const habitatFilter = document.getElementById('habitatFilter').value;
  
  const filteredAnimals = mockAnimals.filter(animal => {
    const matchesCategory = !categoryFilter || animal.category === categoryFilter;
    const matchesHabitat = !habitatFilter || animal.habitat === habitatFilter;
    return matchesCategory && matchesHabitat;
  });
  
  displayAnimals(filteredAnimals);
}

function editAnimal(id) {
  const animal = mockAnimals.find(a => a.id === id);
  if (!animal) return;

  // Update modal title
  document.getElementById('modalTitle').textContent = 'Edit Species';
  
  // Fill form with animal data
  document.getElementById('animalId').value = animal.id;
  document.getElementById('name').value = animal.name;
  document.getElementById('species').value = animal.species;
  document.getElementById('funFact').value = animal.funFact;
  document.getElementById('diet').value = animal.diet;
  document.getElementById('category').value = animal.category;
  document.getElementById('habitat').value = animal.habitat;
  document.getElementById('lifespan').value = animal.lifespan;
  document.getElementById('imageUrl').value = animal.imageUrl;
  
  // Show the modal
  const modal = new bootstrap.Modal(document.getElementById('animalFormModal'));
  modal.show();
}

function confirmDelete(id) {
  document.getElementById('confirmDelete').dataset.animalId = id;
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

// Add the rest of your event handling code here... 