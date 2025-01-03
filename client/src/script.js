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
    lifespan: parseInt(document.getElementById('lifespan').value),
    imageUrl: document.getElementById('imageUrl').value
  };

  try {
    const response = await addAnimal(formData);
    if (response.message) {
      // Show success message
      showFeedback('Animal added successfully!');
      // Clear form
      document.getElementById('animalForm').reset();
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('animalFormModal'));
      modal.hide();
      // Refresh animal list
      await refreshAnimalList();
    }
  } catch (error) {
    console.error('Error adding animal:', error);
    showFeedback('Failed to add animal. Please try again.');
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
    card.className = `card category-${animal.category.toLowerCase()}`;
    
    const imageHtml = animal.image_url 
      ? `<img src="${animal.image_url}" class="card-img-top animal-image" alt="${animal.species}" 
          onerror="this.src='https://via.placeholder.com/300x200?text=No+Image+Available'">`
      : '<img src="https://via.placeholder.com/300x200?text=No+Image+Available" class="card-img-top animal-image">';

    card.innerHTML = `
      ${imageHtml}
      <div class="card-body">
        <h5 class="card-title">${animal.name}</h5>
        <p class="card-text">
          <span class="badge bg-secondary">${animal.species}</span>
          <span class="badge bg-info">${animal.category}</span>
        </p>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-primary view-details" data-id="${animal.id}">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-animal" data-id="${animal.id}">
            <i class="bi bi-trash"></i>
          </button>
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
    document.getElementById('imageUrl').value = animal.imageQuery;
    
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