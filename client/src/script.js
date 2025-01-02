const API_BASE_URL = 'http://localhost:3000';

// Load animals when page loads
document.addEventListener('DOMContentLoaded', loadAnimals);

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
    showToast('Failed to load animals', 'error');
  } finally {
    showLoading(false);
  }
}

function displayAnimals(animals) {
  const animalList = document.getElementById('animalList');
  animalList.innerHTML = animals.map(animal => `
    <div class="col-sm-6 col-lg-4 mb-4">
      <div class="card h-100 shadow-sm hover-effect">
        <div class="position-relative">
          <img src="${animal.imageUrl || 'https://placehold.co/800x400/e9ecef/adb5bd?text=No+Image'}" 
               class="card-img-top" 
               alt="${animal.name}"
               style="height: 250px; object-fit: cover;">
          <div class="position-absolute top-0 end-0 p-2">
            <span class="badge bg-primary">${animal.info?.taxonomy?.class || 'Unknown'}</span>
          </div>
        </div>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 class="card-title mb-0">${animal.name}</h5>
              <p class="text-muted small mb-2 fst-italic">${animal.info?.taxonomy?.scientific_name || 'Unknown'}</p>
            </div>
          </div>
          
          <div class="animal-details small flex-grow-1">
            ${animal.info?.characteristics ? `
              <div class="mb-3">
                <div class="mb-2">
                  <i class="bi bi-geo-alt text-primary"></i> 
                  <strong>Habitat:</strong> ${animal.info.characteristics.habitat || 'Unknown'}
                </div>
                <div class="mb-2">
                  <i class="bi bi-egg-fried text-primary"></i> 
                  <strong>Diet:</strong> ${animal.info.characteristics.diet || 'Unknown'}
                </div>
                ${animal.info.characteristics.lifespan ? `
                  <div class="mb-2">
                    <i class="bi bi-clock text-primary"></i> 
                    <strong>Lifespan:</strong> ${animal.info.characteristics.lifespan}
                  </div>
                ` : ''}
                ${animal.info.characteristics.weight ? `
                  <div class="mb-2">
                    <i class="bi bi-speedometer2 text-primary"></i> 
                    <strong>Weight:</strong> ${animal.info.characteristics.weight}
                  </div>
                ` : ''}
              </div>
              
              <div class="taxonomy-details bg-light p-2 rounded mb-3 small">
                <div class="fw-bold mb-1">Taxonomy:</div>
                <div>Kingdom: ${animal.info.taxonomy.kingdom || 'Unknown'}</div>
                <div>Family: ${animal.info.taxonomy.family || 'Unknown'}</div>
                <div>Genus: ${animal.info.taxonomy.genus || 'Unknown'}</div>
              </div>
            ` : '<p class="text-muted">No additional information available</p>'}
          </div>

          <div class="card-actions mt-auto">
            <button class="btn btn-primary btn-sm w-100" onclick="showAnimalDetails(${JSON.stringify(animal).replace(/"/g, '&quot;')})">
              <i class="bi bi-info-circle"></i> More Information
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Add new function to show detailed modal
function showAnimalDetails(animal) {
  const modalHtml = `
    <div class="modal fade" id="animalDetailsModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${animal.name}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <img src="${animal.imageUrl}" class="img-fluid rounded mb-3" alt="${animal.name}">
              </div>
              <div class="col-md-6">
                <h6 class="text-primary">Characteristics</h6>
                <ul class="list-unstyled">
                  ${Object.entries(animal.info?.characteristics || {})
                    .filter(([key, value]) => value && !key.includes('_'))
                    .map(([key, value]) => `
                      <li class="mb-2">
                        <strong>${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:</strong> 
                        ${value}
                      </li>
                    `).join('')}
                </ul>
              </div>
            </div>
            
            ${animal.info?.locations ? `
              <div class="mt-3">
                <h6 class="text-primary">Locations</h6>
                <div class="d-flex flex-wrap gap-2">
                  ${animal.info.locations.map(location => `
                    <span class="badge bg-secondary">${location}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          <div class="modal-footer justify-content-between">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-outline-danger" onclick="deleteAnimal(${animal.id})">
              <i class="bi bi-trash"></i> Delete Animal
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