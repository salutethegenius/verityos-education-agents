
// Radix UI Theme Initialization
(function() {
    'use strict';

    // Use sessionStorage to persist initialization state across page loads
    const RADIX_INIT_KEY = 'radix_ui_initialized';
    
    function isRadixInitialized() {
        return sessionStorage.getItem(RADIX_INIT_KEY) === 'true';
    }

    function markRadixInitialized() {
        sessionStorage.setItem(RADIX_INIT_KEY, 'true');
    }

    function initializeRadixUI() {
        if (isRadixInitialized()) {
            console.log('[RADIX] Already initialized in this session, skipping...');
            return;
        }

        console.log('[RADIX] Initializing Radix UI components...');

        try {
            // Check if Radix theme is loaded
            const themeElement = document.querySelector('[data-radix-ui-theme]') || 
                                document.querySelector('.radix-themes');
            
            if (themeElement) {
                console.log('[RADIX] Theme element found, applying configurations...');

                // Apply theme configurations only once
                if (!themeElement.hasAttribute('data-radix-configured')) {
                    themeElement.setAttribute('data-accent-color', 'blue');
                    themeElement.setAttribute('data-gray-color', 'slate');
                    themeElement.setAttribute('data-radius', 'medium');
                    themeElement.setAttribute('data-scaling', '100%');
                    themeElement.setAttribute('data-radix-configured', 'true');
                }
            }

            markRadixInitialized();
            console.log('[RADIX] Radix UI components initialized successfully');

        } catch (error) {
            console.error('[RADIX ERROR] Failed to initialize Radix UI:', error);
        }
    }

    // Only initialize once when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeRadixUI, { once: true });
    } else {
        // Use timeout to ensure this only runs once
        setTimeout(initializeRadixUI, 0);
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        // Keep the flag for this session but clear on browser close
    });
})();
