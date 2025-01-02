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
  }
];

// Mock API functions
async function fetchAnimals() {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockAnimals;
}

async function addAnimal(animal) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newAnimal = { ...animal, id: mockAnimals.length + 1 };
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
  
  modalTitle.textContent = animal.name;
  modalBody.innerHTML = `
    <div class="animal-details">
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

  const detailsModal = new bootstrap.Modal(document.getElementById('animalDetailsModal'));
  detailsModal.show();
}

// Add the rest of your event handling code here... 