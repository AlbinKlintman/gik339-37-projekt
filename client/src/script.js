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
        </div>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 class="card-title mb-0">${animal.name}</h5>
              <p class="text-muted small mb-2 fst-italic">${animal.info?.taxonomy?.scientific_name || 'Unknown'}</p>
            </div>
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