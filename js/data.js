// frontend/js/data.js
class DataManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Get the corresponding tab ID based on button text
                const buttonText = e.target.textContent.trim();
                let tabId = '';
                
                if (buttonText === 'Training Data') {
                    tabId = 'trainingData';
                } else if (buttonText === 'Prediction History') {
                    tabId = 'predictionHistory';
                } else if (buttonText === 'Public Predictions') {
                    tabId = 'publicPredictions';
                }
                
                if (tabId) {
                    this.openTab(tabId, e.target);
                }
            });
        });
    }

    openTab(tabId, buttonElement) {
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show specific tab content
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.classList.add('active');
        }
        
        // Highlight the clicked button
        if (buttonElement) {
            buttonElement.classList.add('active');
        }

        // Load tab-specific data
        switch(tabId) {
            case 'trainingData':
                this.loadTrainingData();
                break;
            case 'predictionHistory':
                this.loadUserPredictions();
                break;
            case 'publicPredictions':
                this.loadPublicPredictions();
                break;
        }
    }

    async loadInitialData() {
        await this.loadTrainingData();
        await this.updateDashboardStats();
    }

    async loadTrainingData() {
        try {
            const data = await apiService.getTrainingData();
            this.renderTrainingData(data);
        } catch (error) {
            console.error('Failed to load training data:', error);
        }
    }

    renderTrainingData(data) {
        const tbody = document.getElementById('trainingDataBody');
        tbody.innerHTML = '';

        data.slice(0, 50).forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.City || 'N/A'}</td>
                <td>${item.Country || 'N/A'}</td>
                <td>${item.Date ? new Date(item.Date).toLocaleDateString() : 'N/A'}</td>
                <td>${item['PM2.5'] !== undefined ? parseFloat(item['PM2.5']).toFixed(2) : 'N/A'}</td>
                <td>${item.PM10 !== undefined ? parseFloat(item.PM10).toFixed(2) : 'N/A'}</td>
                <td>${item.NO2 !== undefined ? parseFloat(item.NO2).toFixed(2) : 'N/A'}</td>
                <td>${item.SO2 !== undefined ? parseFloat(item.SO2).toFixed(2) : 'N/A'}</td>
                <td>${item.CO !== undefined ? parseFloat(item.CO).toFixed(2) : 'N/A'}</td>
                <td>${item.O3 !== undefined ? parseFloat(item.O3).toFixed(2) : 'N/A'}</td>
                <td>${item.Temperature !== undefined ? parseFloat(item.Temperature).toFixed(2) : 'N/A'}</td>
                <td>${item.Humidity !== undefined ? parseFloat(item.Humidity).toFixed(2) : 'N/A'}</td>
                <td>${item['Wind Speed'] !== undefined ? parseFloat(item['Wind Speed']).toFixed(2) : 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadUserPredictions() {
        if (!authManager.isAuthenticated()) {
            const container = document.getElementById('userPredictionsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="login-prompt">
                        <p>Please login to view your prediction history</p>
                        <button onclick="showLoginModal()" class="btn-login">Login</button>
                    </div>
                `;
            }
            return;
        }

        const container = document.getElementById('userPredictionsContainer');
        if (container) {
            container.innerHTML = '<p style="padding: 20px; text-align: center;">Loading predictions...</p>';
        }

        try {
            console.log('🔍 Fetching user predictions...');
            const predictions = await apiService.getUserPredictions(20);
            console.log('✓ User predictions received:', predictions);
            console.log(`Total predictions received: ${predictions.length}`);
            this.renderUserPredictions(predictions);
        } catch (error) {
            console.error('❌ Failed to load user predictions:', error);
            if (container) {
                container.innerHTML = `<p style="padding: 20px; text-align: center; color: red;">Error loading predictions: ${error.message}</p>`;
            }
        }
    }

    renderUserPredictions(predictions) {
        const container = document.getElementById('userPredictionsContainer');
        
        if (!predictions || predictions.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center;">No predictions found. Make your first prediction!</p>';
            return;
        }

        // Build table HTML for user predictions (similar to training data)
        const rows = predictions.map(pred => {
            try {
                // Handle both v2 response format and old format
                const pmValue = pred.pm25_predicted || pred.predicted_pm25 || 0;
                const riskLevel = pred.health_impact?.risk_level || pred.health_risk_level || 'N/A';
                const confidence = pred.metadata?.confidence_score || pred.confidence_score || 0;
                const processingTime = pred.metadata?.processing_time_ms || pred.processing_time_ms || 0;
                const createdAt = pred.created_at || new Date().toISOString();
                
                return `
                    <tr>
                        <td>${pred.city || 'N/A'}</td>
                        <td>${pred.country || 'N/A'}</td>
                        <td>${pred.date || 'N/A'}</td>
                        <td>${typeof pmValue === 'number' ? pmValue.toFixed(2) : pmValue} µg/m³</td>
                        <td><span class="risk-badge">${riskLevel}</span></td>
                        <td>${typeof confidence === 'number' ? (confidence * 100).toFixed(1) : confidence}%</td>
                        <td>${typeof processingTime === 'number' ? processingTime.toFixed(2) : processingTime}</td>
                        <td>${new Date(createdAt).toLocaleString()}</td>
                    </tr>
                `;
            } catch (err) {
                console.error('Error rendering prediction row:', err, pred);
                return '';
            }
        }).join('');

        container.innerHTML = `
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>City</th>
                            <th>Country</th>
                            <th>Date</th>
                            <th>Predicted PM2.5</th>
                            <th>Health Risk</th>
                            <th>Confidence</th>
                            <th>Processing Time (ms)</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    async loadPublicPredictions() {
        const container = document.getElementById('publicPredictionsContainer');
        if (container) {
            container.innerHTML = '<p style="padding: 20px; text-align: center;">Loading predictions...</p>';
        }

        try {
            console.log('Fetching public predictions...');
            const predictions = await apiService.getPublicPredictions();
            console.log('Public predictions received:', predictions);
            this.renderPublicPredictions(predictions);
        } catch (error) {
            console.error('Failed to load public predictions:', error);
            if (container) {
                container.innerHTML = `<p style="padding: 20px; text-align: center; color: red;">Error loading predictions: ${error.message}</p>`;
            }
        }
    }

    renderPublicPredictions(predictions) {
        const container = document.getElementById('publicPredictionsContainer');
        
        if (!predictions || predictions.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center;">No public predictions available yet.</p>';
            return;
        }

        // Build table HTML for public predictions (similar to training data)
        const rows = predictions.map(pred => {
            try {
                // Handle both v2 response format and old format
                const pmValue = pred.pm25_predicted || pred.predicted_pm25 || 0;
                const riskLevel = pred.health_impact?.risk_level || pred.health_risk_level || 'N/A';
                const confidence = pred.metadata?.confidence_score || pred.confidence_score || 0;
                const processingTime = pred.metadata?.processing_time_ms || pred.processing_time_ms || 0;
                const createdAt = pred.created_at || new Date().toISOString();
                
                return `
                    <tr>
                        <td>${pred.city || 'N/A'}</td>
                        <td>${pred.country || 'N/A'}</td>
                        <td>${pred.date || 'N/A'}</td>
                        <td>${typeof pmValue === 'number' ? pmValue.toFixed(2) : pmValue} µg/m³</td>
                        <td><span class="risk-badge">${riskLevel}</span></td>
                        <td>${typeof confidence === 'number' ? (confidence * 100).toFixed(1) : confidence}%</td>
                        <td>${typeof processingTime === 'number' ? processingTime.toFixed(2) : processingTime}</td>
                        <td>${new Date(createdAt).toLocaleString()}</td>
                    </tr>
                `;
            } catch (err) {
                console.error('Error rendering prediction row:', err, pred);
                return '';
            }
        }).join('');

        container.innerHTML = `
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>City</th>
                            <th>Country</th>
                            <th>Date</th>
                            <th>Predicted PM2.5</th>
                            <th>Health Risk</th>
                            <th>Confidence</th>
                            <th>Processing Time (ms)</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    async updateDashboardStats() {
        try {
            const analytics = await apiService.getModelAnalytics();
            
            document.getElementById('totalPredictions').textContent = 
                analytics.total_predictions?.toLocaleString() || '0';
            document.getElementById('modelCount').textContent = 
                analytics.available_models?.length || '0';
            document.getElementById('citiesCovered').textContent = 
                '50+'; // This would come from actual data
                
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
    }
}

// frontend/js/feedback.js
class FeedbackManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadRecentFeedback();
        this.loadUserPredictionsForFeedback();
    }

    setupEventListeners() {
        // Star rating
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => this.setRating(e));
        });

        // Feedback form submission
        document.getElementById('feedbackForm')?.addEventListener('submit', (e) => this.submitFeedback(e));
    }

    setRating(event) {
        const rating = parseInt(event.target.dataset.rating);
        const stars = document.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
        
        document.getElementById('feedbackRating').value = rating;
    }

    async loadUserPredictionsForFeedback() {
        if (!authManager.isAuthenticated()) return;

        try {
            const predictions = await apiService.getUserPredictions(50);
            this.populatePredictionSelect(predictions);
        } catch (error) {
            console.error('Failed to load predictions for feedback:', error);
        }
    }

    populatePredictionSelect(predictions) {
        const select = document.getElementById('predictionSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select a prediction</option>';
        
        if (!Array.isArray(predictions)) {
            console.warn('Predictions is not an array:', predictions);
            return;
        }
        
        predictions.forEach(pred => {
            const option = document.createElement('option');
            // Handle both v2 and old response formats
            const predId = pred.prediction_id || pred._id || pred.id;
            const city = pred.input_location?.city || pred.city || pred.input_data?.city || 'Unknown';
            const country = pred.input_location?.country || pred.country || pred.input_data?.country || 'Unknown';
            const date = pred.input_location?.date || pred.date || pred.created_at || new Date().toISOString();
            
            option.value = predId;
            option.textContent = `${city}, ${country} - ${new Date(date).toLocaleDateString()}`;
            select.appendChild(option);
        });
    }

    async submitFeedback(e) {
        e.preventDefault();
        
        if (!authManager.isAuthenticated()) {
            showNotification('Please login to submit feedback', 'error');
            return;
        }

        const formData = new FormData(e.target);
        const feedbackData = {
            prediction_id: formData.get('predictionSelect'),
            rating: parseInt(formData.get('rating')),
            model_accuracy: parseInt(formData.get('model_accuracy')),
            comments: formData.get('comments')
        };

        try {
            await apiService.submitFeedback(feedbackData);
            showNotification('Feedback submitted successfully!', 'success');
            e.target.reset();
            this.loadRecentFeedback();
        } catch (error) {
            showNotification('Failed to submit feedback', 'error');
        }
    }

    async loadRecentFeedback() {
        // This would typically come from an API endpoint
        // For now, we'll show a placeholder
        const container = document.getElementById('feedbackList');
        container.innerHTML = `
            <div class="feedback-item">
                <div class="feedback-header">
                    <span class="user">Ubong Isaiah</span>
                    <div class="rating">
                        ${'★'.repeat(5)}
                    </div>
                </div>
                <p class="feedback-comment">
                    The ensemble model shows excellent performance across different geographic regions.
                    Particularly impressed with the health risk assessment accuracy.
                </p>
                <span class="feedback-date">2 days ago</span>
            </div>
        `;
    }
}

// Initialize data and feedback managers
document.addEventListener('DOMContentLoaded', () => {
    window.dataManager = new DataManager();
    window.feedbackManager = new FeedbackManager();
});