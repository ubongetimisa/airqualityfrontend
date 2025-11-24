// frontend/js/feedback.js
class FeedbackManager {
    constructor() {
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadUserPredictions();
        await this.loadRecentFeedback();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('feedbackForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Star rating
        const stars = document.querySelectorAll('.rating-stars .star');
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = e.target.dataset.rating;
                document.getElementById('feedbackRating').value = rating;
                this.updateStarDisplay(rating);
            });
        });
    }

    updateStarDisplay(rating) {
        const stars = document.querySelectorAll('.rating-stars .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    async loadUserPredictions() {
        if (!authManager.isAuthenticated()) {
            this.disableFeedbackForm();
            return;
        }

        try {
            const predictions = await apiService.getUserPredictions(50);
            console.log('Raw predictions from API:', predictions);
            
            const select = document.getElementById('predictionSelect');
            
            // Clear existing options (keep placeholder)
            select.innerHTML = '<option value="">Select a prediction</option>';
            
            if (predictions && predictions.length > 0) {
                predictions.forEach(pred => {
                    console.log('Processing prediction:', pred);
                    
                    const option = document.createElement('option');
                    const city = pred.city || 'Unknown';
                    const country = pred.country || 'Unknown';
                    const date = pred.date ? new Date(pred.date).toLocaleDateString() : 'Unknown';
                    
                    // Handle multiple field name variations for PM2.5
                    let pm25 = 0;
                    if (typeof pred.pm25_predicted === 'number') {
                        pm25 = pred.pm25_predicted;
                    } else if (typeof pred.predicted_pm25 === 'number') {
                        pm25 = pred.predicted_pm25;
                    }
                    
                    // Use prediction_id or id as value
                    const predId = pred.prediction_id || pred.id || pred._id || '';
                    
                    option.value = predId;
                    option.textContent = `${city}, ${country} - ${date} (${pm25.toFixed(2)} µg/m³)`;
                    select.appendChild(option);
                    
                    console.log('Added option:', option.textContent, 'Value:', predId);
                });
                
                console.log(`✓ Loaded ${predictions.length} predictions into dropdown`);
            } else {
                console.warn('No predictions returned from API');
            }
        } catch (error) {
            console.error('Failed to load user predictions:', error);
            this.disableFeedbackForm();
        }
    }

    disableFeedbackForm() {
        const form = document.getElementById('feedbackForm');
        if (form) {
            form.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #666;">
                    <p>Please <button type="button" onclick="showLoginModal()" style="color: #2c5530; text-decoration: underline; border: none; cursor: pointer;">login</button> to submit feedback</p>
                </div>
            `;
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!authManager.isAuthenticated()) {
            showNotification('Please login to submit feedback', 'error');
            showLoginModal();
            return;
        }

        const predictionId = document.getElementById('predictionSelect').value;
        const rating = parseInt(document.getElementById('feedbackRating').value);
        const comments = document.getElementById('feedbackComments').value;
        const modelAccuracy = parseInt(document.getElementById('modelAccuracy').value);

        if (!predictionId || !rating || !comments) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            const feedbackData = {
                prediction_id: predictionId,
                rating: rating,
                comments: comments,
                model_accuracy: modelAccuracy
            };

            const result = await apiService.submitFeedback(feedbackData);
            console.log('Feedback submitted:', result);

            showNotification('Feedback submitted successfully!', 'success');
            
            // Reset form
            document.getElementById('feedbackForm').reset();
            document.getElementById('feedbackRating').value = '';
            this.updateStarDisplay(0);

            // Reload feedback list
            await this.loadRecentFeedback();

        } catch (error) {
            console.error('Failed to submit feedback:', error);
            showNotification(`Failed to submit feedback: ${error.message}`, 'error');
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Feedback';
        }
    }

    async loadRecentFeedback() {
        try {
            const feedback = await apiService.getRecentFeedback(10);
            this.displayFeedback(feedback);
        } catch (error) {
            console.error('Failed to load feedback:', error);
            const feedbackList = document.getElementById('feedbackList');
            if (feedbackList) {
                feedbackList.innerHTML = '<p style="color: red;">Failed to load feedback</p>';
            }
        }
    }

    displayFeedback(feedbackList) {
        const container = document.getElementById('feedbackList');
        
        if (!feedbackList || feedbackList.length === 0) {
            container.innerHTML = '<p style="color: #999;">No feedback yet. Be the first to submit!</p>';
            return;
        }

        const feedbackHtml = feedbackList.map(item => `
            <div class="feedback-item">
                <div class="feedback-header">
                    <div class="feedback-user">
                        <strong>${item.user_name || 'Anonymous'}</strong>
                        <div class="feedback-rating">
                            ${this.renderStars(item.rating)}
                        </div>
                    </div>
                    <div class="feedback-meta">
                        <small>${item.model_accuracy_label || 'N/A'}</small>
                        <br>
                        <small style="color: #999;">${new Date(item.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
                <div class="feedback-body">
                    <p>${this.escapeHtml(item.comments)}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = feedbackHtml;
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rating ? '★' : '☆';
        }
        return stars;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize feedback manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.feedbackManager = new FeedbackManager();
});
