// Add cache management at the top of the file
const IMAGE_CACHE_KEY = 'animalImageCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Cache management functions
function getImageCache() {
  const cache = localStorage.getItem(IMAGE_CACHE_KEY);
  return cache ? JSON.parse(cache) : {};
}

function setImageCache(cache) {
  localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
}

// Instead, use the API key directly (since it's a public key anyway)
const UNSPLASH_ACCESS_KEY = '_QVElxtlOv5K98PBTh0gMMI27CctUGzyR6un46l5HHw';

// Function to fetch image from Unsplash
async function getAnimalImage(query) {
  const cache = getImageCache();
  const now = Date.now();

  // Check if we have a valid cached image
  if (cache[query] && cache[query].timestamp > now - CACHE_DURATION) {
    return cache[query].url;
  }

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
    
    // Cache the new image
    cache[query] = {
      url: data.urls.regular,
      timestamp: now
    };
    setImageCache(cache);
    
    return data.urls.regular;
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    // Return cached image even if expired, as fallback
    return cache[query]?.url || 'https://placehold.co/800x400/e9ecef/adb5bd?text=No+Image+Available';
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
    lifespan: 15,
    imageQuery: "lion" // Used to fetch from Unsplash
  },
  {
    id: 2,
    name: "Emperor Penguin",
    species: "Aptenodytes forsteri",
    funFact: "Can dive up to 500 meters deep and hold their breath for 20 minutes!",
    diet: "carnivore",
    category: "birds",
    habitat: "aquatic",
    lifespan: 20,
    imageQuery: "penguin" // Used to fetch from Unsplash
  },
  {
    id: 3,
    name: "Giant Pacific Octopus",
    species: "Enteroctopus dofleini",
    funFact: "Has three hearts and can change color in less than a second!",
    diet: "carnivore",
    category: "marine",
    habitat: "aquatic",
    lifespan: 5,
    imageQuery: "octopus" // Used to fetch from Unsplash
  },
  {
    id: 4,
    name: "Red-Eyed Tree Frog",
    species: "Agalychnis callidryas",
    funFact: "They sleep during the day with their eyes closed, showing only white!",
    diet: "carnivore",
    category: "reptiles",
    habitat: "terrestrial",
    lifespan: 5,
    imageQuery: "treefrog" // Used to fetch from Unsplash
  },
  {
    id: 5,
    name: "Monarch Butterfly",
    species: "Danaus plexippus",
    funFact: "They can travel up to 3000 miles during migration!",
    diet: "herbivore",
    category: "insects",
    habitat: "aerial",
    lifespan: 1,
    imageQuery: "monarch" // Used to fetch from Unsplash
  }
];

// Mock API functions
async function fetchAnimals() {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Fetch images only for animals that don't have an imageUrl
  const fetchPromises = mockAnimals
    .filter(animal => !animal.imageUrl)
    .map(async animal => {
      animal.imageUrl = await getAnimalImage(animal.imageQuery || animal.name.toLowerCase());
    });

  // Wait for all image fetches to complete
  await Promise.all(fetchPromises);
  
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

// Main application code
document.addEventListener('DOMContentLoaded', () => {
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

// Add the rest of your event handling code here... 

// Add the missing setupEventListeners function
function setupEventListeners() {
  // Filter event listeners
  document.getElementById('categoryFilter').addEventListener('change', filterAnimals);
  document.getElementById('habitatFilter').addEventListener('change', filterAnimals);

  // Form event listeners
  document.getElementById('animalForm').addEventListener('submit', handleFormSubmit);
}

// Add a simple filter function
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