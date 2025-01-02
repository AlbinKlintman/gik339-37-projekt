const API_BASE_URL = 'http://localhost:3000';

// Load animals when page loads
document.addEventListener('DOMContentLoaded', loadAnimals);

document.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

function showLoading(show = true) {
  const spinner = document.getElementById('loadingSpinner');
  spinner.classList.toggle('d-none', !show);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('notificationToast');
  const toastMessage = document.getElementById('toastMessage');
  
  toast.classList.remove('bg-success', 'bg-danger');
  toast.classList.add(type === 'success' ? 'bg-success' : 'bg-danger');
  toastMessage.textContent = message;
  
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

async function loadAnimals() {
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/animals`);
    if (!response.ok) throw new Error('Failed to fetch animals');
    
    const animals = await response.json();
    
    // Load details for each animal
    const animalDetails = await Promise.all(
      animals.map(async animal => {
        try {
          const infoResponse = await fetch(`${API_BASE_URL}/animal-info/${encodeURIComponent(animal.name)}`);
          if (!infoResponse.ok) throw new Error(`Failed to fetch info for ${animal.name}`);
          
          const details = await infoResponse.json();
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
    showToast('Failed to load animals', 'error');
  } finally {
    showLoading(false);
  }
}

async function displayAnimals(animals) {
  const carouselInner = document.getElementById('carouselInner');
  const animalDetails = document.getElementById('animalDetails');
  
  // Create carousel items
  carouselInner.innerHTML = animals.map((animal, index) => `
    <div class="carousel-item ${index === 0 ? 'active' : ''}">
      <img src="${animal.imageUrl}" class="d-block w-100" alt="${animal.name}">
    </div>
  `).join('');

  // Add carousel indicators
  const indicators = document.querySelector('.carousel-indicators');
  indicators.innerHTML = animals.map((_, index) => `
    <button type="button" 
            data-bs-target="#animalCarousel" 
            data-bs-slide-to="${index}" 
            ${index === 0 ? 'class="active" aria-current="true"' : ''} 
            aria-label="Slide ${index + 1}">
    </button>
  `).join('');

  // Create details section
  updateAnimalDetails(animals[0]);

  // Add carousel event listener
  const carousel = document.getElementById('animalCarousel');
  carousel.addEventListener('slide.bs.carousel', (event) => {
    const animal = animals[event.to];
    updateAnimalDetails(animal);
  });
}

function updateAnimalDetails(animal) {
  const animalDetails = document.getElementById('animalDetails');
  animalDetails.innerHTML = `
    <div class="row">
      <div class="col-lg-8">
        <h1 class="animal-title">${animal.name}</h1>
        <div class="animal-scientific-name">${animal.info?.taxonomy?.scientific_name || 'Scientific name unknown'}</div>
        
        <div class="animal-info">
          ${animal.info?.characteristics?.habitat ? `
            <p>${animal.info.characteristics.habitat}</p>
          ` : ''}
          
          ${animal.info?.characteristics?.diet ? `
            <p>${animal.info.characteristics.diet}</p>
          ` : ''}
        </div>
      </div>
      
      <div class="col-lg-4">
        ${animal.info?.locations ? `
          <div class="characteristic-item">
            <h6 class="text-uppercase mb-2">Locations</h6>
            <div class="d-flex flex-wrap gap-2">
              ${animal.info.locations.map(location => `
                <span class="badge bg-light text-dark">${location}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${animal.info?.taxonomy ? `
          <div class="characteristic-item">
            <h6 class="text-uppercase mb-2">Taxonomy</h6>
            <div class="small">
              ${Object.entries(animal.info.taxonomy)
                .filter(([key, value]) => value && key !== 'scientific_name')
                .map(([key, value]) => `
                  <div class="mb-1">
                    <span class="text-muted">${key}:</span> ${value}
                  </div>
                `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Add new function to show detailed modal
function showAnimalDetails(animal) {
  const modalHtml = `
    <div class="modal fade" id="animalDetailsModal" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title mb-1">${animal.name}</h5>
              <p class="text-muted small mb-0 fst-italic">${animal.info?.taxonomy?.scientific_name || 'Scientific name unknown'}</p>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-4">
              <div class="col-lg-5">
                <img src="${animal.imageUrl}" 
                     class="img-fluid rounded shadow-sm" 
                     alt="${animal.name}"
                     style="width: 100%; height: 400px; object-fit: cover;">
              </div>
              <div class="col-lg-7">
                <div class="row g-3">
                  <div class="col-md-7">
                    <div class="taxonomy-details p-3 rounded h-100">
                      <h6 class="text-primary d-flex align-items-center mb-3">
                        <i class="bi bi-diagram-3 me-2"></i>Taxonomy
                      </h6>
                      <div class="row g-2">
                        <div class="col-6">
                          <div class="small text-muted">Kingdom</div>
                          <div>${animal.info?.taxonomy?.kingdom || 'Unknown'}</div>
                        </div>
                        <div class="col-6">
                          <div class="small text-muted">Class</div>
                          <div>${animal.info?.taxonomy?.class || 'Unknown'}</div>
                        </div>
                        <div class="col-6">
                          <div class="small text-muted">Order</div>
                          <div>${animal.info?.taxonomy?.order || 'Unknown'}</div>
                        </div>
                        <div class="col-6">
                          <div class="small text-muted">Family</div>
                          <div>${animal.info?.taxonomy?.family || 'Unknown'}</div>
                        </div>
                        <div class="col-6">
                          <div class="small text-muted">Genus</div>
                          <div>${animal.info?.taxonomy?.genus || 'Unknown'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-5">
                    ${animal.info?.locations ? `
                      <div class="locations-details p-3 rounded mb-3">
                        <h6 class="text-primary d-flex align-items-center mb-2">
                          <i class="bi bi-geo-alt me-2"></i>Locations
                        </h6>
                        <div class="d-flex flex-wrap gap-2">
                          ${animal.info.locations.map(location => `
                            <span class="badge bg-light text-dark border">${location}</span>
                          `).join('')}
                        </div>
                      </div>
                    ` : ''}
                  </div>

                  ${animal.info?.characteristics ? `
                    <div class="col-12">
                      <div class="characteristics-details p-3 rounded bg-light">
                        <h6 class="text-primary d-flex align-items-center mb-3">
                          <i class="bi bi-list-check me-2"></i>Key Characteristics
                        </h6>
                        <div class="row g-2">
                          ${Object.entries(animal.info.characteristics)
                            .filter(([key, value]) => value && !key.includes('_'))
                            .map(([key, value]) => `
                              <div class="col-md-6">
                                <div class="p-2 rounded characteristic-item">
                                  <div class="small text-muted">${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}</div>
                                  <div class="small">${value}</div>
                                </div>
                              </div>
                            `).join('')}
                        </div>
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-outline-danger" onclick="deleteAnimal(${animal.id})">
              <i class="bi bi-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById('animalDetailsModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Add new modal to DOM
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Show the modal
  const modal = new bootstrap.Modal(document.getElementById('animalDetailsModal'));
  modal.show();
}

async function addAnimal(event) {
  event.preventDefault();
  const form = event.target;
  const name = form.animalName.value;
  
  try {
    const response = await fetch(`${API_BASE_URL}/animals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    if (!response.ok) throw new Error('Failed to add animal');
    
    form.reset();
    bootstrap.Modal.getInstance(document.getElementById('addAnimalModal')).hide();
    showToast(`Successfully added ${name}!`);
    await loadAnimals();
  } catch (error) {
    showToast('Failed to add animal', 'error');
  }
}

async function deleteAnimal(id) {
  if (!confirm('Are you sure you want to delete this animal?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/animals/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete animal');
    
    showToast('Animal deleted successfully');
    await loadAnimals();
  } catch (error) {
    showToast('Failed to delete animal', 'error');
  }
}

async function deleteLastAnimal() {
  try {
    // Get all animals
    const response = await fetch(`${API_BASE_URL}/animals`);
    if (!response.ok) throw new Error('Failed to fetch animals');
    
    const animals = await response.json();
    if (animals.length === 0) {
      showToast('No animals to delete', 'error');
      return;
    }
    
    // Get the last animal
    const lastAnimal = animals[animals.length - 1];
    
    if (!confirm(`Are you sure you want to delete ${lastAnimal.name}?`)) return;
    
    // Delete the last animal
    const deleteResponse = await fetch(`${API_BASE_URL}/animals/${lastAnimal.id}`, {
      method: 'DELETE'
    });
    
    if (!deleteResponse.ok) throw new Error('Failed to delete animal');
    
    showToast(`Successfully deleted ${lastAnimal.name}`);
    await loadAnimals();
  } catch (error) {
    console.error('Error deleting last animal:', error);
    showToast('Failed to delete animal', 'error');
  }
} 