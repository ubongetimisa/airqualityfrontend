// frontend/js/api.js

class APIService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: authManager.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                authManager.logout();
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Prediction methods - Updated to use v2 API
    async makePrediction(predictionData) {
        // Transform frontend data to v2 API format
        const v2Request = {
            location: {
                city: predictionData.input_data.city,
                country: predictionData.input_data.country,
                date: new Date().toISOString().split('T')[0]  // YYYY-MM-DD format
            },
            air_quality: {
                pm10: predictionData.input_data.pm10,
                no2: predictionData.input_data.no2,
                so2: predictionData.input_data.so2,
                co: predictionData.input_data.co,
                o3: predictionData.input_data.o3,
                temperature: predictionData.input_data.temperature,
                humidity: predictionData.input_data.humidity,
                wind_speed: predictionData.input_data.wind_speed
            },
            model: "ensemble",
            confidence_threshold: 0.0,  // Accept all predictions
            user_id: authManager.getUserId()  // Add user_id from auth manager
        };
        
        return await this.request('/api/v2/predictions/predict', {
            method: 'POST',
            body: JSON.stringify(v2Request)
        });
    }

    async getUserPredictions(limit = 10, offset = 0) {
        return await this.request(`/predictions?limit=${limit}&offset=${offset}`);
    }

    async getPublicPredictions(limit = 20) {
        return await this.request(`/public/predictions?limit=${limit}`);
    }

    // Data methods
    async getTrainingData(limit = 100) {
        return await this.request(`/data/training?limit=${limit}`);
    }

    async getCitiesGeoData() {
        return await this.request('/cities/geodata');
    }

    // Analytics methods
    async getModelAnalytics() {
        return await this.request('/analytics/models');
    }

    // Feedback methods
    async submitFeedback(feedbackData) {
        return await this.request('/feedback', {
            method: 'POST',
            body: JSON.stringify(feedbackData)
        });
    }

    async getRecentFeedback(limit = 10) {
        return await this.request(`/feedback/recent?limit=${limit}`);
    }
}

// Initialize API service
const apiService = new APIService();