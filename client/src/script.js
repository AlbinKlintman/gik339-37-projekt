const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await refreshAnimalList();
  } catch (error) {
    console.error('Error initializing animal list:', error);
    showFeedback('Failed to load animals. Please refresh the page.');
  }
});

// Replace the mock fetchAnimals function
async function fetchAnimals() {
  try {
    console.log('Attempting to fetch animals from:', `${API_URL}/animals`);
    const response = await fetch(`${API_URL}/animals`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Server error: ${errorData.error || response.statusText}`);
    }
    
    const animals = await response.json();
    console.log('Successfully fetched animals:', animals);
    return animals;
  } catch (error) {
    console.error('Detailed fetch error:', {
      message: error.message,
      stack: error.stack,
      type: error.name
    });
    throw new Error(`Failed to fetch animals: ${error.message}`);
  }
}

// Replace the mock addAnimal function
async function addAnimal(animal) {
  try {
    console.log('Sending animal data:', animal);
    const response = await fetch(`${API_URL}/animals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(animal)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add animal');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding animal:', error);
    throw error;
  }
}

// Replace the mock updateAnimal function
async function updateAnimal(id, animal) {
  try {
    const response = await fetch(`${API_URL}/animals/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(animal)
    });
    
    if (!response.ok) throw new Error('Failed to update animal');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Replace the mock deleteAnimal function
async function deleteAnimal(id) {
  try {
    const response = await fetch(`${API_URL}/animals/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete animal');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Add event listener for form submission
document.getElementById('animalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('name').value,
    species: document.getElementById('species').value,
    funFact: document.getElementById('funFact').value,
    diet: document.getElementById('diet').value,
    category: document.getElementById('category').value,
    habitat: document.getElementById('habitat').value,
    lifespan: parseInt(document.getElementById('lifespan').value)
  };

  try {
    const response = await addAnimal(formData);
    if (response) {
      showFeedback('Animal added successfully!');
      await refreshAnimalList();
      const modal = bootstrap.Modal.getInstance(document.getElementById('animalFormModal'));
      modal.hide();
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    showFeedback(error.message);
  }
});

// Add this helper function to show feedback
function showFeedback(message, isError = false) {
  const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
  const messageElement = document.getElementById('feedbackMessage');
  
  messageElement.className = isError ? 'text-danger' : 'text-success';
  messageElement.textContent = message;
  
  // Log error to console if it's an error message
  if (isError) {
    console.error('Feedback Error:', message);
  }
  
  feedbackModal.show();
}

// Add this helper function to refresh the animal list
async function refreshAnimalList() {
  try {
    console.log('Refreshing animal list...');
    const animals = await fetchAnimals();
    
    if (!Array.isArray(animals)) {
      throw new Error('Server did not return an array of animals');
    }
    
    displayAnimals(animals);
    console.log('Successfully refreshed animal list');
  } catch (error) {
    console.error('Error refreshing animal list:', {
      message: error.message,
      stack: error.stack,
      type: error.name
    });
    showFeedback(`Failed to refresh animal list: ${error.message}`, true);
  }
}

// Add this function to display animals
function displayAnimals(animals) {
  const animalList = document.getElementById('animalList');
  animalList.innerHTML = '';
  
  animals.forEach(animal => {
    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';
    
    // Add error handling and fallback for images
    const imageUrl = animal.image_url || 'https://via.placeholder.com/300x200?text=No+Image+Available';
    
    card.innerHTML = `
      <div class="card h-100">
        <div class="card-img-wrapper" style="height: 200px; overflow: hidden;">
          <img src="${imageUrl}" 
               class="card-img-top" 
               alt="${animal.species}"
               style="object-fit: cover; height: 100%; width: 100%;"
               onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Image+Load+Error';">
        </div>
        <div class="card-body">
          <h5 class="card-title">${animal.name}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${animal.species}</h6>
          <div class="mb-2">
            <span class="badge bg-primary">${animal.category}</span>
            <span class="badge bg-secondary">${animal.habitat || 'Unknown habitat'}</span>
          </div>
          <p class="card-text">
            ${animal.funFact ? `<em>"${animal.funFact}"</em>` : ''}
          </p>
          <div class="card-text small text-muted">
            <p class="mb-1">Diet: ${animal.diet || 'Unknown'}</p>
            <p class="mb-1">Lifespan: ${animal.lifespan ? animal.lifespan + ' years' : 'Unknown'}</p>
          </div>
        </div>
        <div class="card-footer bg-transparent border-top-0">
          <div class="btn-group w-100">
            <button class="btn btn-outline-primary" onclick="editAnimal(${animal.id})">
              <i class="bi bi-pencil"></i> Edit
            </button>
            <button class="btn btn-outline-danger" onclick="confirmDelete(${animal.id})">
              <i class="bi bi-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
    
    animalList.appendChild(card);
  });
}

// Add this function to create animal cards
function createAnimalCard(animal) {
  const div = document.createElement('div');
  div.className = 'col-md-4 mb-4';
  div.innerHTML = `
    <div class="card category-${animal.category}">
      <div class="card-body">
        <h5 class="card-title">${animal.name}</h5>
        <h6 class="card-subtitle mb-2 text-muted">${animal.species}</h6>
        <p class="card-text">${animal.funFact}</p>
        <div class="d-flex gap-2">
          <span class="badge bg-primary">${animal.category}</span>
          <span class="badge bg-secondary">${animal.habitat}</span>
          <span class="badge bg-info">${animal.diet}</span>
        </div>
      </div>
    </div>
  `;
  return div;
}

// Add these helper functions for edit and delete functionality
async function editAnimal(id) {
  try {
    const response = await fetch(`${API_URL}/animals/${id}`);
    if (!response.ok) throw new Error('Failed to fetch animal details');
    
    const animal = await response.json();
    
    // Fill the form with animal data
    document.getElementById('animalId').value = animal.id;
    document.getElementById('name').value = animal.name;
    document.getElementById('species').value = animal.species;
    document.getElementById('funFact').value = animal.funFact;
    document.getElementById('diet').value = animal.diet;
    document.getElementById('category').value = animal.category;
    document.getElementById('habitat').value = animal.habitat;
    document.getElementById('lifespan').value = animal.lifespan;
    
    // Update modal title
    document.getElementById('modalTitle').textContent = 'Edit Species';
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('animalFormModal'));
    modal.show();
  } catch (error) {
    console.error('Error:', error);
    showFeedback('Failed to load animal details');
  }
}

function confirmDelete(id) {
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  const confirmButton = document.getElementById('confirmDelete');
  
  // Remove any existing event listeners
  const newConfirmButton = confirmButton.cloneNode(true);
  confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
  
  // Add new event listener
  newConfirmButton.addEventListener('click', async () => {
    try {
      const response = await deleteAnimal(id);
      modal.hide();
      showFeedback(response.message || 'Animal deleted successfully');
      await refreshAnimalList();
    } catch (error) {
      console.error('Error:', error);
      showFeedback('Failed to delete animal');
    }
  });
  
  modal.show();
}

function populateForm(animal) {
  document.getElementById('animalId').value = animal.id;
  document.getElementById('name').value = animal.name;
  document.getElementById('species').value = animal.species;
  document.getElementById('funFact').value = animal.funFact;
  document.getElementById('diet').value = animal.diet;
  document.getElementById('category').value = animal.category;
  document.getElementById('habitat').value = animal.habitat;
  document.getElementById('lifespan').value = animal.lifespan;
  
  document.getElementById('modalTitle').textContent = 'Edit Species';
}

// Also update the details view function
function showAnimalDetails(animal) {
  const detailsModalTitle = document.getElementById('detailsModalTitle');
  const detailsModalBody = document.getElementById('detailsModalBody');
  
  detailsModalTitle.textContent = `${animal.name} (${animal.species})`;
  
  detailsModalBody.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <img src="${animal.image_url || 'https://via.placeholder.com/400x300?text=No+Image+Available'}" 
             class="img-fluid rounded mb-3" 
             alt="${animal.species}"
             onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=Image+Load+Error';">
      </div>
      <div class="col-md-6">
        <dl class="row">
          <dt class="col-sm-4">Category:</dt>
          <dd class="col-sm-8">${animal.category}</dd>
          
          <dt class="col-sm-4">Habitat:</dt>
          <dd class="col-sm-8">${animal.habitat || 'Unknown'}</dd>
          
          <dt class="col-sm-4">Diet:</dt>
          <dd class="col-sm-8">${animal.diet || 'Unknown'}</dd>
          
          <dt class="col-sm-4">Lifespan:</dt>
          <dd class="col-sm-8">${animal.lifespan ? `${animal.lifespan} years` : 'Unknown'}</dd>
        </dl>
        ${animal.funFact ? `
          <div class="alert alert-info">
            <i class="bi bi-info-circle"></i> Fun Fact: ${animal.funFact}
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  const modal = new bootstrap.Modal(document.getElementById('animalDetailsModal'));
  modal.show();
}