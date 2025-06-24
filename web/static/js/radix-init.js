
// Radix UI initialization and theme management
document.addEventListener('DOMContentLoaded', function() {
    console.log('[RADIX] Initializing Radix UI components...');
    
    // Initialize theme with enhanced styling
    const themeElement = document.querySelector('.radix-themes');
    if (themeElement) {
        console.log('[RADIX] Theme element found, applying configurations...');
        
        // Apply consistent theme properties
        themeElement.setAttribute('data-has-background', 'false');
        themeElement.setAttribute('data-panel-background', 'solid');
        
        // Enhanced appearance
        themeElement.style.setProperty('--default-font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
    }
    
    // Enhance existing buttons with Radix UI classes and proper variants
    const buttons = document.querySelectorAll('button:not(.rt-button)');
    buttons.forEach(button => {
        if (!button.classList.contains('rt-button')) {
            button.classList.add('rt-button');
            
            // Apply different variants based on button purpose
            if (button.id === 'send-button' || button.classList.contains('primary')) {
                button.setAttribute('data-variant', 'solid');
                button.setAttribute('data-size', '3');
            } else if (button.id === 'new-chat-btn') {
                button.setAttribute('data-variant', 'solid');
                button.setAttribute('data-size', '2');
            } else {
                button.setAttribute('data-variant', 'soft');
                button.setAttribute('data-size', '2');
            }
        }
    });
    
    // Enhance select elements with Radix UI styling
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        if (!select.classList.contains('rt-select-trigger')) {
            select.classList.add('rt-select-trigger');
            select.setAttribute('data-size', '2');
        }
    });
    
    // Add smooth transitions to interactive elements
    const interactiveElements = document.querySelectorAll('button, select, input, textarea');
    interactiveElements.forEach(element => {
        element.style.transition = 'all 150ms cubic-bezier(0.22, 1, 0.36, 1)';
    });
    
    // Enhanced Radix UI styling
    const style = document.createElement('style');
    style.textContent = `
        .rt-button:focus-visible,
        .rt-select-trigger:focus-visible,
        input:focus-visible,
        textarea:focus-visible {
            outline: 2px solid var(--accent-8);
            outline-offset: 2px;
        }
        
        .rt-button[data-variant="solid"] {
            font-weight: var(--font-weight-medium);
            box-shadow: var(--shadow-2);
        }
        
        .rt-button[data-variant="soft"] {
            background: var(--accent-3);
            color: var(--accent-11);
        }
        
        .rt-button[data-variant="soft"]:hover {
            background: var(--accent-4);
        }
        
        .rt-select-trigger {
            background: var(--color-surface);
            border: 1px solid var(--gray-7);
            border-radius: var(--radius-2);
            font-size: var(--font-size-2);
        }
        
        .rt-text[data-size="2"] {
            font-size: var(--font-size-2);
            line-height: var(--line-height-3);
        }
        
        .rt-text[data-size="3"] {
            font-size: var(--font-size-3);
            line-height: var(--line-height-3);
        }
        
        .rt-heading[data-size="3"] {
            font-size: var(--font-size-4);
            font-weight: var(--font-weight-bold);
            line-height: var(--line-height-2);
        }
        
        .rt-heading[data-size="4"] {
            font-size: var(--font-size-5);
            font-weight: var(--font-weight-bold);
            line-height: var(--line-height-2);
        }
        
        .rt-heading[data-size="6"] {
            font-size: var(--font-size-7);
            font-weight: var(--font-weight-bold);
            line-height: var(--line-height-1);
        }
    `;
    document.head.appendChild(style);
    
    console.log('[RADIX] Radix UI components initialized successfully');
});
