// frontend/js/main.js

class AirQualityApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupSmoothScrolling();
        this.initializeComponents();
        this.loadInitialData(); // Call but don't await - it will run in background
    }

    setupNavigation() {
        // Mobile menu toggle
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        navToggle?.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    initializeComponents() {
        // Initialize all component managers
        console.log('Initializing components...');
        
        // Initialize CitiesManager
        if (typeof CitiesManager !== 'undefined') {
            window.citiesManager = new CitiesManager();
            console.log('✓ CitiesManager initialized');
        }
        
        // Initialize DataManager
        if (typeof DataManager !== 'undefined') {
            window.dataManager = new DataManager();
            console.log('✓ DataManager initialized');
        }
        
        // Initialize PredictionManager
        if (typeof PredictionManager !== 'undefined') {
            window.predictionManager = new PredictionManager();
            console.log('✓ PredictionManager initialized');
        }
        
        // Initialize FeedbackManager
        if (typeof FeedbackManager !== 'undefined') {
            window.feedbackManager = new FeedbackManager();
            console.log('✓ FeedbackManager initialized');
        }
        
        console.log('AirQuality AI Application Initialized');
    }

    async loadInitialData() {
        // Load initial dashboard data
        await this.updateHeroStats();
    }

    async updateHeroStats() {
        try {
            const analytics = await apiService.getModelAnalytics();
            
            // Update hero statistics
            const totalPredictions = document.getElementById('totalPredictions');
            const modelCount = document.getElementById('modelCount');
            const citiesCovered = document.getElementById('citiesCovered');
            
            // Total Predictions
            if (totalPredictions) {
                const predictionCount = analytics.total_predictions || 0;
                totalPredictions.textContent = predictionCount.toLocaleString();
                totalPredictions.setAttribute('data-value', predictionCount);
            }
            
            // Model Count - Get from backend analytics
            if (modelCount) {
                const availableModels = analytics.available_models || [];
                const count = availableModels.length || 7;
                modelCount.textContent = count;
                modelCount.setAttribute('data-value', count);
                console.log('✓ Available models:', count, '→', availableModels);
            }
            
            // Cities Covered - Get from cities manager
            if (citiesCovered && window.citiesManager) {
                const cityCount = window.citiesManager.getCityCount();
                citiesCovered.textContent = cityCount;
                citiesCovered.setAttribute('data-value', cityCount);
                citiesCovered.setAttribute('data-cities', `${cityCount}+ Cities Worldwide`);
                console.log('✓ Cities covered:', cityCount);
            }
            
            console.log('✓ Hero stats updated successfully');
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            
            // Fallback values with proper initialization
            const modelCount = document.getElementById('modelCount');
            const citiesCovered = document.getElementById('citiesCovered');
            
            if (modelCount) {
                modelCount.textContent = '7';
                modelCount.setAttribute('data-value', '7');
            }
            
            if (citiesCovered) {
                citiesCovered.textContent = '60';
                citiesCovered.setAttribute('data-value', '60');
            }
            
            console.log('⚠ Using fallback values for hero stats');
        }
    }
}

// Utility functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function openTab(tabName) {
    if (window.dataManager) {
        window.dataManager.openTab(tabName);
    } else {
        console.warn('DataManager not initialized');
    }
}

// Logout function for HTML onclick
function logout() {
    authManager.logout();
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.airQualityApp = new AirQualityApp();
});

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});