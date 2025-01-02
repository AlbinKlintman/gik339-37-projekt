const API_BASE_URL = 'http://localhost:3000';

// Load animals when page loads
document.addEventListener('DOMContentLoaded', loadAnimals);

async function loadAnimals() {
  try {
    const response = await fetch(`${API_BASE_URL}/animals`);
    if (!response.ok) throw new Error('Failed to fetch animals');
    
    const animals = await response.json();
    
    const animalList = document.getElementById('animalList');
    animalList.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    
    // Load details for each animal
    const animalDetails = await Promise.all(
      animals.map(async animal => {
        try {
          const infoResponse = await fetch(`${API_BASE_URL}/animal-info/${encodeURIComponent(animal.name)}`);
          if (!infoResponse.ok) throw new Error(`Failed to fetch info for ${animal.name}`);
          
          const details = await infoResponse.json();
          console.log(`Details for ${animal.name}:`, details);
          return { ...animal, ...details };
        } catch (error) {
          console.error(`Error loading details for ${animal.name}:`, error);
          return {
            ...animal,
            info: null,
            imageUrl: 'https://placehold.co/800x400/e9ecef/adb5bd?text=Image+Not+Found'
          };
        }
      })
    );
    
    displayAnimals(animalDetails);
  } catch (error) {
    console.error('Failed to load animals:', error);
    showError('Failed to load animals');
  }
}

function displayAnimals(animals) {
  const animalList = document.getElementById('animalList');
  animalList.innerHTML = animals.map(animal => `
    <div class="col-md-4 mb-4">
      <div class="card h-100">
        <img src="${animal.imageUrl || 'https://placehold.co/800x400/e9ecef/adb5bd?text=Image+Not+Found'}" 
             class="card-img-top" 
             alt="${animal.name}"
             style="height: 200px; object-fit: cover;"
             onerror="this.src='https://placehold.co/800x400/e9ecef/adb5bd?text=Image+Not+Found'">
        <div class="card-body">
          <h5 class="card-title">${animal.name}</h5>
          ${animal.info ? `
            <p class="card-text">
              <small><strong>Scientific Name:</strong> ${animal.info?.taxonomy?.scientific_name || 'Unknown'}</small><br>
              <small><strong>Habitat:</strong> ${animal.info?.characteristics?.habitat || 'Unknown'}</small><br>
              <small><strong>Diet:</strong> ${animal.info?.characteristics?.diet || 'Unknown'}</small>
            </p>
          ` : '<p class="text-muted">No additional information available</p>'}
        </div>
        <div class="card-footer">
          <button class="btn btn-danger btn-sm" onclick="deleteAnimal(${animal.id})">
            <i class="bi bi-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function addAnimal(event) {
  event.preventDefault();
  const name = document.getElementById('animalName').value;
  
  try {
    const response = await fetch(`${API_BASE_URL}/animals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    if (!response.ok) throw new Error('Failed to add animal');
    
    document.getElementById('animalForm').reset();
    loadAnimals();
  } catch (error) {
    showError('Failed to add animal');
  }
}

async function deleteAnimal(id) {
  if (!confirm('Are you sure you want to delete this animal?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/animals/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete animal');
    loadAnimals();
  } catch (error) {
    showError('Failed to delete animal');
  }
}

function showError(message) {
  alert(message); // You can replace this with a nicer error display
} 