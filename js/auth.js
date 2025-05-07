// DOM Elements
const signupForm = document.getElementById('signupForm');
const otpForm = document.getElementById('otpForm');
const signinForm = document.getElementById('signinForm');
const changePasswordForm = document.getElementById('changePasswordForm');
const logoutLink = document.getElementById('logoutLink');
const changePasswordLink = document.getElementById('changePasswordLink');
const passwordInputs = document.querySelectorAll('input[type="password"]');
const togglePasswordButtons = document.querySelectorAll('.toggle-password');

// API Base URL (Replace with your Render backend URL)
const API_BASE_URL = 'https://your-render-app.onrender.com/api';

// Toggle Password Visibility
togglePasswordButtons.forEach(button => {
    button.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });
});

// Sign Up Functionality
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Show OTP section
                document.getElementById('otpSection').classList.remove('hidden');
                signupForm.classList.add('hidden');
                
                // Store email for verification
                localStorage.setItem('tempEmail', email);
            } else {
                alert(data.message || 'Signup failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during signup');
        }
    });
}

// OTP Verification
if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const otp = document.getElementById('otp').value;
        const email = localStorage.getItem('tempEmail');
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Account created successfully! Please sign in.');
                window.location.href = '/signin.html';
                localStorage.removeItem('tempEmail');
            } else {
                alert(data.message || 'OTP verification failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during OTP verification');
        }
    });
}

// Sign In Functionality
if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token and user data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirect to dashboard
                window.location.href = '/dashboard.html';
            } else {
                alert(data.message || 'Signin failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during signin');
        }
    });
}

// Logout Functionality
if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/signin.html';
    });
}

// Change Password Modal
if (changePasswordLink) {
    changePasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('changePasswordModal').classList.remove('hidden');
    });
}

// Close Modal
const closeModal = document.querySelector('.close-modal');
if (closeModal) {
    closeModal.addEventListener('click', () => {
        document.getElementById('changePasswordModal').classList.add('hidden');
    });
}

// Change Password Functionality
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match');
            return;
        }
        
        const token = localStorage.getItem('authToken');
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Password changed successfully!');
                document.getElementById('changePasswordModal').classList.add('hidden');
                changePasswordForm.reset();
            } else {
                alert(data.message || 'Password change failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during password change');
        }
    });
}

// Check authentication on dashboard load
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) {
            window.location.href = '/signin.html';
        } else {
            // Display user info
            document.getElementById('usernameDisplay').textContent = user.name;
        }
    }
});