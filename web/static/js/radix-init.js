// Radix UI Theme Initialization
(function() {
    'use strict';

    let radixInitialized = false;

    function initializeRadixUI() {
        if (radixInitialized) {
            console.log('[RADIX] Already initialized, skipping...');
            return;
        }

        console.log('[RADIX] Initializing Radix UI components...');

        try {
            // Check if Radix theme is loaded
            const themeElement = document.querySelector('[data-radix-ui-theme]');
            if (themeElement) {
                console.log('[RADIX] Theme element found, applying configurations...');

                // Apply any custom theme configurations here
                themeElement.setAttribute('data-accent-color', 'blue');
                themeElement.setAttribute('data-gray-color', 'slate');
                themeElement.setAttribute('data-radius', 'medium');
                themeElement.setAttribute('data-scaling', '100%');
            }

            radixInitialized = true;
            console.log('[RADIX] Radix UI components initialized successfully');

        } catch (error) {
            console.error('[RADIX ERROR] Failed to initialize Radix UI:', error);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeRadixUI);
    } else {
        initializeRadixUI();
    }
})();