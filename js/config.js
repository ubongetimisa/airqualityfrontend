// frontend/js/config.js
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000',
    MAPBOX_ACCESS_TOKEN: 'your_mapbox_token_here', // Replace with actual token
    DEFAULT_MAP_CENTER: [20, 0],
    DEFAULT_MAP_ZOOM: 2
};

// frontend/js/auth.js
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        this.updateUI();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
            });

            if (response.ok) {
                const data = await response.json();
                this.setAuth(data.access_token, { email: data.user_email, id: data.user_id });
                closeModal('loginModal');
                document.getElementById('loginForm').reset();
                this.updateUI();
                showNotification('Login successful!', 'success');
            } else {
                let errorMessage = 'Login failed';
                try {
                    const errorData = await response.json();
                    if (errorData.detail) {
                        errorMessage = errorData.detail;
                    }
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                }
                showNotification(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Login failed. Please check your credentials.', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = {
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            full_name: document.getElementById('regFullName').value,
            affiliation: document.getElementById('regAffiliation').value || ""
        };

        console.log('Registration attempt with data:', formData);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            console.log('Registration response status:', response.status);

            if (response.ok) {
                console.log('Registration successful');
                showNotification('Registration successful! Please login.', 'success');
                closeModal('registerModal');
                document.getElementById('registerForm').reset();
                showLoginModal();
            } else {
                let errorMessage = 'Registration failed';
                try {
                    const errorData = await response.json();
                    console.log('Error response data:', errorData);
                    if (errorData.detail) {
                        // Handle array of validation errors
                        if (Array.isArray(errorData.detail)) {
                            errorMessage = errorData.detail
                                .map(e => `${e.loc?.[1] || 'Field'}: ${e.msg}`)
                                .join(', ');
                        } else {
                            errorMessage = String(errorData.detail);
                        }
                    }
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                }
                console.log('Showing error notification:', errorMessage);
                showNotification(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Registration fetch error:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            showNotification(errorMsg || 'Registration failed', 'error');
        }
    }

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.updateUI();
        showNotification('Logged out successfully', 'success');
    }

    updateUI() {
        const navAuth = document.getElementById('navAuth');
        const navUser = document.getElementById('navUser');
        const userName = document.getElementById('userName');

        if (this.isAuthenticated()) {
            navAuth.style.display = 'none';
            navUser.style.display = 'flex';
            userName.textContent = this.user.email;
        } else {
            navAuth.style.display = 'flex';
            navUser.style.display = 'none';
        }
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUserId() {
        return this.user?.id || null;
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Modal functions
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles for notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 4px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}