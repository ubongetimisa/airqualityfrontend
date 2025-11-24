// frontend/js/prediction.js
class PredictionManager {
    constructor() {
        this.init();
    }

    async init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = document.getElementById('predictionForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handlePrediction(e);
            });
        }
    }

    async handlePrediction(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Prediction form submitted');
        
        if (!authManager.isAuthenticated()) {
            console.warn('Not authenticated');
            showNotification('Please login to make predictions', 'error');
            showLoginModal();
            return;
        }

        const predictBtn = document.getElementById('predictBtn');
        const originalText = predictBtn.innerHTML;
        
        try {
            predictBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Predicting...';
            predictBtn.disabled = true;

            const formData = new FormData(e.target);
            
            // Validate all required fields
            const validationError = this.validatePredictionData(formData);
            if (validationError) {
                showNotification(validationError, 'error');
                predictBtn.innerHTML = originalText;
                predictBtn.disabled = false;
                return;
            }

            // Build v2 API format - No PM2.5 input (it's the target we're predicting)
            const predictionData = {
                input_data: {
                    city: formData.get('city'),
                    country: formData.get('country'),
                    // NOTE: PM2.5 is NOT included - the v2 API predicts it
                    pm10: parseFloat(formData.get('pm10')),
                    no2: parseFloat(formData.get('no2')),
                    so2: parseFloat(formData.get('so2')),
                    co: parseFloat(formData.get('co')),
                    o3: parseFloat(formData.get('o3')),
                    temperature: parseFloat(formData.get('temperature')),
                    humidity: parseFloat(formData.get('humidity')),
                    wind_speed: parseFloat(formData.get('wind_speed'))
                },
                use_historical_data: false,
                save_to_db: true
            };

            console.log('Sending prediction data (v2 format):', JSON.stringify(predictionData, null, 2));

            const result = await apiService.makePrediction(predictionData);
            console.log('Prediction result:', result);
            this.displayPredictionResults(result);
            showNotification('Prediction completed successfully!', 'success');

        } catch (error) {
            console.error('Prediction failed:', error);
            showNotification(`Prediction failed: ${error.message}`, 'error');
        } finally {
            predictBtn.innerHTML = originalText;
            predictBtn.disabled = false;
        }
    }

    validatePredictionData(formData) {
        // Required fields with validation (PM2.5 is NOT an input - it's predicted)
        const requiredFields = {
            'city': 'City is required',
            'country': 'Country is required',
            'pm10': 'PM10 is required and must be a number',
            'no2': 'NO2 is required and must be a number',
            'so2': 'SO2 is required and must be a number',
            'co': 'CO is required and must be a number',
            'o3': 'O3 is required and must be a number',
            'temperature': 'Temperature is required',
            'humidity': 'Humidity is required and must be 0-100',
            'wind_speed': 'Wind Speed is required and must be non-negative'
        };

        for (const [field, message] of Object.entries(requiredFields)) {
            const value = formData.get(field);
            
            if (!value && value !== '0') {
                return `${message}`;
            }

            // Numeric validation
            if (['pm10', 'no2', 'so2', 'co', 'o3', 'humidity', 'wind_speed'].includes(field)) {
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                    return `${field} must be a valid number`;
                }

                // Range validation
                if (field === 'humidity' && (numValue < 0 || numValue > 100)) {
                    return 'Humidity must be between 0-100%';
                }
                if (['pm10', 'no2', 'so2', 'o3', 'wind_speed'].includes(field) && numValue < 0) {
                    return `${field} cannot be negative`;
                }
            }
        }

        return null;
    }

    displayPredictionResults(result) {
        // Map v2 API response to frontend format
        const container = document.getElementById('resultsContainer');
        
        // Handle v2 API response format
        const healthRisk = result.health_impact || {
            risk_level: "Unknown",
            health_implications: [],
            recommended_actions: []
        };
        
        // Create model predictions object from v2 response
        const modelPredictions = result.base_model_predictions || {};
        modelPredictions.ensemble = result.pm25_predicted;
        
        // Create confidence scores object
        const confidenceScores = {
            ensemble: result.metadata?.confidence_score || 0.5
        };
        
        const healthRiskHtml = this.createHealthRiskDisplay(healthRisk);
        const chartHtml = this.createComparisonChart(modelPredictions);
        const confidenceHtml = this.createConfidenceDisplay(confidenceScores);

        container.innerHTML = `
            <div class="prediction-results-content">
                <div class="results-header">
                    <h4>Prediction Results</h4>
                    <span class="prediction-id">ID: ${result.prediction_id?.slice(-8) || 'N/A'}</span>
                </div>
                
                <div class="main-prediction">
                    <div class="predicted-value">
                        <span class="value">${result.pm25_predicted?.toFixed(2) || 'N/A'}</span>
                        <span class="unit">µg/m³</span>
                    </div>
                    <div class="processing-info">
                        <span>Processing time: ${result.metadata?.processing_time_ms?.toFixed(1) || 'N/A'}ms</span>
                        <span>Confidence: ${(result.metadata?.confidence_score * 100)?.toFixed(1) || 'N/A'}%</span>
                    </div>
                </div>
                
                ${healthRiskHtml}
                
                <div class="model-comparison">
                    <h5>Model Predictions Comparison</h5>
                    ${chartHtml}
                </div>
                
                ${confidenceHtml}
                
                <div class="raw-predictions">
                    <h5>Detailed Predictions</h5>
                    <div class="predictions-grid">
                        ${Object.entries(modelPredictions).map(([model, value]) => `
                            <div class="prediction-item">
                                <span class="model-name">${model}</span>
                                <span class="prediction-value">${typeof value === 'number' ? value.toFixed(2) : 'N/A'} µg/m³</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="metadata-info">
                    <h5>Prediction Metadata</h5>
                    <div class="metadata-grid">
                        <div class="metadata-item">
                            <span class="label">Features Engineered:</span>
                            <span class="value">${result.metadata?.features_engineered || 0}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Model Type:</span>
                            <span class="value">${result.metadata?.model_type || 'Ensemble'}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Timestamp:</span>
                            <span class="value">${new Date(result.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Render Chart.js chart
        this.renderPredictionChart(modelPredictions);
    }

    createComparisonChart(predictions) {
        return `
            <div class="chart-container">
                <canvas id="predictionChart" width="400" height="200"></canvas>
            </div>
        `;
    }

    createHealthRiskDisplay(healthRisk) {
        const riskClass = (healthRisk.risk_level || 'unknown').toLowerCase().replace(/\s+/g, '-');
        const healthImplications = healthRisk.health_implications || [];
        const recommendations = healthRisk.recommended_actions || [];
        
        return `
            <div class="health-risk-assessment risk-${riskClass}">
                <h5>Health Risk Assessment</h5>
                <div class="risk-level">
                    <span class="risk-label">${healthRisk.risk_level || 'Unknown'}</span>
                    <span class="aqi-category">${healthRisk.aqi_category || 'N/A'}</span>
                </div>
                <div class="risk-details">
                    ${healthImplications.length > 0 ? `
                        <div class="health-implications">
                            <strong>Health Implications:</strong>
                            <ul>
                                ${healthImplications.map(imp => `<li>${imp}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${recommendations.length > 0 ? `
                        <div class="recommendations">
                            <strong>Recommendations:</strong>
                            <ul>
                                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createConfidenceDisplay(confidenceScores) {
        return `
            <div class="confidence-scores">
                <h5>Model Confidence Scores</h5>
                <div class="confidence-bars">
                    ${Object.entries(confidenceScores).map(([model, score]) => `
                        <div class="confidence-item">
                            <span class="model-name">${model}</span>
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${score * 100}%"></div>
                            </div>
                            <span class="confidence-value">${(score * 100).toFixed(1)}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderPredictionChart(predictions) {
        const ctx = document.getElementById('predictionChart').getContext('2d');
        
        const models = Object.keys(predictions);
        const values = Object.values(predictions);
        
        // Find the ensemble prediction for reference line
        const ensembleValue = predictions.ensemble || values[0];
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: models,
                datasets: [{
                    label: 'PM2.5 Prediction (µg/m³)',
                    data: values,
                    backgroundColor: models.map(model => 
                        model === 'ensemble' ? '#2c5530' : '#4a7c59'
                    ),
                    borderColor: models.map(model => 
                        model === 'ensemble' ? '#1e3a24' : '#2c5530'
                    ),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'PM2.5 (µg/m³)'
                        }
                    }
                },
                plugins: {
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: ensembleValue,
                                yMax: ensembleValue,
                                borderColor: '#e74c3c',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    display: true,
                                    content: 'Ensemble Average',
                                    position: 'end'
                                }
                            }
                        }
                    }
                }
            }
        });
    }
}

// Initialize prediction manager
document.addEventListener('DOMContentLoaded', () => {
    window.predictionManager = new PredictionManager();
});