/**
 * MILINDWEB Header & Footer Include Script
 * This script loads both header.html and footer.html files and initializes all functionality
 * Usage: Include this script in any page where you want header and footer
 */

// Configuration
const MILINDWEB_CONFIG = {
    header: {
        file: 'header.html',
        placeholderId: 'header-placeholder',
        enabled: true
    },
    footer: {
        file: 'footer.html',
        placeholderId: 'footer-placeholder',
        enabled: true
    },
    retryAttempts: 3,
    retryDelay: 1000,
    debug: true
};

/**
 * Utility function for logging
 */
function log(message, type = 'info') {
    if (!MILINDWEB_CONFIG.debug) return;
    
    const emoji = {
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'loading': '🔄'
    };
    
    console.log(`${emoji[type]} MilindWeb: ${message}`);
}

/**
 * Load component with retry mechanism
 */
async function loadComponent(componentType, attempt = 1) {
    const config = MILINDWEB_CONFIG[componentType];
    
    if (!config.enabled) {
        log(`${componentType} loading is disabled`);
        return;
    }
    
    try {
        log(`Loading ${componentType}... (attempt ${attempt})`, 'loading');
        
        const response = await fetch(config.file);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        const placeholder = document.getElementById(config.placeholderId);
        
        if (!placeholder) {
            throw new Error(`${componentType} placeholder element with ID '${config.placeholderId}' not found`);
        }
        
        // Insert HTML
        placeholder.innerHTML = html;
        
        // Initialize functionality after DOM is updated
        setTimeout(() => {
            if (componentType === 'header') {
                initializeHeader();
            } else if (componentType === 'footer') {
                initializeFooter();
            }
        }, 100);
        
        log(`${componentType} loaded successfully`, 'success');
        
    } catch (error) {
        log(`Error loading ${componentType} (attempt ${attempt}): ${error.message}`, 'error');
        
        // Retry mechanism
        if (attempt < MILINDWEB_CONFIG.retryAttempts) {
            log(`Retrying ${componentType} in ${MILINDWEB_CONFIG.retryDelay}ms...`, 'loading');
            setTimeout(() => {
                loadComponent(componentType, attempt + 1);
            }, MILINDWEB_CONFIG.retryDelay);
        } else {
            log(`Failed to load ${componentType} after all retry attempts`, 'error');
            showComponentError(componentType);
        }
    }
}

/**
 * Initialize header functionality
 */
function initializeHeader() {
    try {
        // Get header elements
        const mobileToggle = document.querySelector('.mobile-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        const mobileOverlay = document.querySelector('.mobile-overlay');
        const header = document.querySelector('.header');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        const dropdown = document.querySelector('.dropdown-content');
        
        if (!mobileToggle || !mobileMenu || !mobileOverlay || !header) {
            throw new Error('Required header elements not found');
        }
        
        // Mobile menu toggle functionality
        mobileToggle.addEventListener('click', () => {
            toggleMobileMenu();
        });
        
        // Close mobile menu when clicking overlay
        mobileOverlay.addEventListener('click', () => {
            closeMobileMenu();
        });
        
        // Close mobile menu when clicking on a link
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });
        
        // Header scroll effect
        window.addEventListener('scroll', () => {
            handleScroll();
        });
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                handleSmoothScroll(e, this);
            });
        });
        
        // Prevent dropdown from closing when clicking inside
        if (dropdown) {
            dropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            handleKeyboard(e);
        });
        
        // Set active page highlighting
        highlightCurrentPage();
        
        log('Header functionality initialized', 'success');
        
    } catch (error) {
        log(`Error initializing header: ${error.message}`, 'error');
    }
}

/**
 * Initialize footer functionality
 */
function initializeFooter() {
    try {
        // Footer-specific functionality can be added here
        // For now, just highlight current page in footer links
        highlightCurrentPageInFooter();
        
        // Add smooth scrolling to footer links
        const footerLinks = document.querySelectorAll('.footer-links a[href^="#"]');
        footerLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                handleSmoothScroll(e, this);
            });
        });
        
        // Add analytics tracking for social media clicks (optional)
        const socialIcons = document.querySelectorAll('.social-icon');
        socialIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                const platform = icon.title || 'Unknown';
                log(`Social media click: ${platform}`, 'info');
                // You can add analytics tracking here
            });
        });
        
        log('Footer functionality initialized', 'success');
        
    } catch (error) {
        log(`Error initializing footer: ${error.message}`, 'error');
    }
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileOverlay = document.querySelector('.mobile-overlay');
    
    mobileToggle.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    mobileOverlay.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileOverlay = document.querySelector('.mobile-overlay');
    
    mobileToggle?.classList.remove('active');
    mobileMenu?.classList.remove('active');
    mobileOverlay?.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Handle scroll effects
 */
function handleScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add scrolled class for backdrop blur effect
    if (scrollTop > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

/**
 * Handle smooth scrolling for anchor links
 */
function handleSmoothScroll(e, element) {
    e.preventDefault();
    const targetId = element.getAttribute('href');
    const target = document.querySelector(targetId);
    
    if (target) {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Handle keyboard navigation
 */
function handleKeyboard(e) {
    if (e.key === 'Escape') {
        closeMobileMenu();
    }
}

/**
 * Highlight current page in navigation
 */
function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Desktop navigation
    const navLinks = document.querySelectorAll('.nav-link, .dropdown-item');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active-page');
        }
    });
    
    // Mobile navigation
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active-page');
        }
    });
}

/**
 * Highlight current page in footer
 */
function highlightCurrentPageInFooter() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    const footerLinks = document.querySelectorAll('.footer-links a');
    footerLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active-footer-page');
        }
    });
}

/**
 * Show error message if component fails to load
 */
function showComponentError(componentType) {
    const config = MILINDWEB_CONFIG[componentType];
    const placeholder = document.getElementById(config.placeholderId);
    
    if (placeholder) {
        const errorMessage = componentType === 'header' 
            ? '⚠️ Header could not be loaded. Please refresh the page.'
            : '⚠️ Footer could not be loaded. Please refresh the page.';
            
        placeholder.innerHTML = `
            <div style="background: #dc2626; color: white; padding: 1rem; text-align: center; margin: 0.5rem 0;">
                ${errorMessage}
            </div>
        `;
    }
}

/**
 * Add CSS for active page styling
 */
function addActivePageStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Header active page styles */
        .nav-link.active-page,
        .dropdown-item.active-page,
        .mobile-nav-link.active-page {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.15)) !important;
            color: #ffffff !important;
            border-color: rgba(96, 165, 250, 0.4) !important;
        }
        
        .dropdown-item.active-page::before,
        .mobile-nav-link.active-page::before {
            transform: scaleY(1) !important;
        }
        
        /* Footer active page styles */
        .footer-links a.active-footer-page {
            color: #93c5fd !important;
            font-weight: 600;
        }
        
        .footer-links a.active-footer-page::before {
            opacity: 1 !important;
            left: -12px !important;
        }
        
        /* Loading animations */
        .header-loading,
        .footer-loading {
            background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
            background-size: 200% 100%;
            animation: milindweb-loading 1.5s infinite;
        }
        
        .header-loading {
            height: 80px;
        }
        
        .footer-loading {
            height: 200px;
            margin-top: auto;
        }
        
        @keyframes milindweb-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        /* Ensure footer stays at bottom */
        html, body {
            height: 100%;
        }
        
        body {
            display: flex;
            flex-direction: column;
        }
        
        main {
            flex: 1;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Load both header and footer
 */
async function loadComponents() {
    const promises = [];
    
    if (MILINDWEB_CONFIG.header.enabled) {
        promises.push(loadComponent('header'));
    }
    
    if (MILINDWEB_CONFIG.footer.enabled) {
        promises.push(loadComponent('footer'));
    }
    
    try {
        await Promise.allSettled(promises);
        log('All components loading completed', 'success');
    } catch (error) {
        log(`Error in loading components: ${error.message}`, 'error');
    }
}

/**
 * Initialize everything when DOM is ready
 */
function init() {
    log('Initializing MilindWeb components...', 'info');
    
    // Add active page and loading styles
    addActivePageStyles();
    
    // Load components
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadComponents);
    } else {
        loadComponents();
    }
}

// Auto-initialize
init();

// Export functions for manual use if needed
window.MilindWeb = {
    header: {
        load: () => loadComponent('header'),
        init: initializeHeader,
        toggleMobile: toggleMobileMenu,
        closeMobile: closeMobileMenu
    },
    footer: {
        load: () => loadComponent('footer'),
        init: initializeFooter
    },
    config: MILINDWEB_CONFIG,
    loadAll: loadComponents,
    log: log
};
