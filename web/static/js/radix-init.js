
// Radix UI initialization and theme management
document.addEventListener('DOMContentLoaded', function() {
    console.log('[RADIX] Initializing Radix UI components...');
    
    // Initialize theme
    const themeElement = document.querySelector('.radix-themes');
    if (themeElement) {
        console.log('[RADIX] Theme element found, applying configurations...');
        
        // You can dynamically change themes here
        // Example: themeElement.setAttribute('data-accent-color', 'blue');
    }
    
    // Enhance existing buttons with Radix UI classes
    const buttons = document.querySelectorAll('button:not(.rt-button)');
    buttons.forEach(button => {
        if (!button.classList.contains('rt-button')) {
            button.classList.add('rt-button');
            button.setAttribute('data-variant', 'soft');
        }
    });
    
    // Enhance select elements
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        select.classList.add('rt-select-trigger');
    });
    
    console.log('[RADIX] Radix UI components initialized successfully');
});
