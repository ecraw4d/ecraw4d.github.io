// Wait until the webpage is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    
    // Select the button and the gallery container
    const layoutToggleBtn = document.getElementById('layout-toggle');
    const mapGallery = document.getElementById('map-gallery');

    // Check if we are actually on the maps page (so this doesn't error out on index.html)
    if (layoutToggleBtn && mapGallery) {
        
        layoutToggleBtn.addEventListener('click', () => {
            // Check current layout
            if (mapGallery.classList.contains('gallery-grid')) {
                // Switch to List View
                mapGallery.classList.remove('gallery-grid');
                mapGallery.classList.add('gallery-list');
                layoutToggleBtn.textContent = 'Switch to Grid View';
            } else {
                // Switch to Grid View
                mapGallery.classList.remove('gallery-list');
                mapGallery.classList.add('gallery-grid');
                layoutToggleBtn.textContent = 'Switch to List View';
            }
        });
    }
    
});