/* // MOCK DATA - DELETE THIS SECTION WHEN CONNECTING TO BACKEND
const mockAnimals = [
  {
    id: 1,
    title: "African Lion",
    species: "Panthera leo",
    description: "Majestic male lion with a full mane, photographed in the Serengeti.",
    imageUrl: "https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=600",
    category: "mammals",
    habitat: "African Savanna"
  },
  {
    id: 2,
    title: "Golden Eagle",
    species: "Aquila chrysaetos",
    description: "Powerful bird of prey soaring over mountain peaks.",
    imageUrl: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=600",
    category: "birds",
    habitat: "Mountain Ranges"
  },
  {
    id: 3,
    title: "Green Sea Turtle",
    species: "Chelonia mydas",
    description: "Graceful sea turtle swimming in crystal clear waters.",
    imageUrl: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=600",
    category: "marine",
    habitat: "Tropical Oceans"
  },
  {
    id: 4,
    title: "Monarch Butterfly",
    species: "Danaus plexippus",
    description: "Beautiful butterfly during its annual migration.",
    imageUrl: "https://images.unsplash.com/photo-1595855759920-86582396756c?w=600",
    category: "insects",
    habitat: "North American Gardens"
  },
  {
    id: 5,
    title: "Komodo Dragon",
    species: "Varanus komodoensis",
    description: "World's largest lizard in its natural habitat.",
    imageUrl: "https://images.unsplash.com/photo-1577493340887-b7bfff550145?w=600",
    category: "reptiles",
    habitat: "Indonesian Islands"
  }
]; */

// Mock API functions - Replace these with real API calls later
async function fetchAnimals() {
  // Simulate API delay
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
  throw new Error('Animal not found');
}

async function deleteAnimal(id) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockAnimals.findIndex(a => a.id === id);
  if (index !== -1) {
    mockAnimals.splice(index, 1);
    return true;
  }
  throw new Error('Animal not found');
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
    showFeedback('Error loading animals: ' + error.message);
  }
}

function displayAnimals(animals) {
  const photoList = document.getElementById('photoList');
  photoList.innerHTML = animals.map(animal => `
    <div class="col-md-4 mb-4">
      <div class="card category-${animal.category}">
        <img src="${animal.imageUrl}" class="card-img-top" alt="${animal.title}">
        <div class="btn-group">
          <button class="btn btn-sm btn-light" onclick="editAnimal(${animal.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-light" onclick="confirmDelete(${animal.id})">
            <i class="bi bi-trash"></i>
          </button>
        </div>
        <div class="card-body">
          <h5 class="card-title">${animal.title}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${animal.species}</h6>
          <p class="card-text">${animal.description}</p>
          <div class="text-muted small">
            <i class="bi bi-geo-alt"></i> ${animal.habitat}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Rest of your application code... 

const  url = 'http:localhost:3000/animals'

window.addEventListener('load', fetchData);

function fetchData() {
  fetch(url)
    .then((result) => result.json())
    .then((animals) => {
      console.log(animals);

      displayAnimals(animals);
    });
}
