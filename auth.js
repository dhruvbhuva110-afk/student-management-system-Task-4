/**
 * Authentication Logic
 * Handles login, registration, and logout operations
 */

const API_AUTH = {
    login: 'api/login.php',
    register: 'api/register.php',
    logout: 'api/logout.php',
    check: 'api/check_auth.php'
};

/**
 * Check current login state
 * @param {boolean} redirectIfLoggedIn - Whether to redirect to index.html if already logged in
 */
async function checkLoginState(redirectIfLoggedIn = false) {
    try {
        const response = await fetch(API_AUTH.check);
        const data = await response.json();

        if (data.authenticated) {
            if (redirectIfLoggedIn) {
                window.location.href = 'index.html';
            }
            // Update UI with user info
            updateUserProfile(data.user);
            return data.user;
        } else {
            if (!redirectIfLoggedIn && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html') && !window.location.pathname.includes('forgot-password.html')) {
                window.location.href = 'login.html';
            }
            return null;
        }
    } catch (error) {
        console.error('Auth Check Error:', error);
        return null;
    }
}

/**
 * Get current user role
 * Defaults to 'Viewer' if not found
 */
function getUserRole() {
    return sessionStorage.getItem('userRole') || 'User';
}

/**
 * Update user profile display elements
 * @param {Object} user - User object with username, email, role, status
 */
function updateUserProfile(user) {
    if (!user || !user.username) return;

    // Save role and status to session storage for easy access
    sessionStorage.setItem('userId', user.id);
    sessionStorage.setItem('userName', user.username);
    sessionStorage.setItem('userEmail', user.email);
    sessionStorage.setItem('userRole', user.role || 'User');
    sessionStorage.setItem('userStatus', user.status || 'Pending');
    sessionStorage.setItem('firstName', user.first_name || '');
    sessionStorage.setItem('lastName', user.last_name || '');
    sessionStorage.setItem('userPhone', user.phone || '');
    sessionStorage.setItem('userAvatarData', user.avatar || '');
    sessionStorage.setItem('userPosition', user.position || '');

    // Construct display name: try First Last, then Username
    let finalUsername = user.username;
    if (user.first_name || user.last_name) {
        finalUsername = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }

    const savedAvatar = user.avatar; // Use only database avatar for new users

    // Get initials
    const getInitials = (name) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const initials = getInitials(finalUsername);

    // Update all avatar elements
    const avatarElements = document.querySelectorAll('#userAvatar, #userAvatarDropdown, .avatar, #sidebarUserAvatar');
    avatarElements.forEach(el => {
        if (!el) return;
        if (savedAvatar) {
            el.style.backgroundImage = `url('${savedAvatar}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            el.textContent = '';
        } else {
            el.textContent = initials;
            el.style.backgroundImage = 'none';
        }
    });

    // Update username elements
    const usernameElements = document.querySelectorAll('#userName, #userNameDropdown, #sidebarUserName, #userNameDropdownHeader, #profileNameDisplay');
    usernameElements.forEach(el => {
        if (el) el.textContent = finalUsername;
    });

    // Update sidebar name specifically if it exists
    const sidebarName = document.getElementById('sidebarUserName');
    if (sidebarName) sidebarName.textContent = finalUsername;

    // Update sidebar email specifically if it exists
    const sidebarEmail = document.getElementById('sidebarUserEmail');
    if (sidebarEmail) sidebarEmail.textContent = user.email || 'user@example.com';

    // Update email in dropdown
    const emailEl = document.getElementById('userEmailDropdown');
    if (emailEl) emailEl.textContent = user.email || 'user@example.com';

    // Role-based UI visibility
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    adminOnlyElements.forEach(el => {
        if (user.role === 'Admin') {
            el.classList.remove('d-none');
        } else {
            el.classList.add('d-none');
        }
    });

    // Page-level protection
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const adminPages = ['users.html', 'activity-logs.html'];
    if (adminPages.includes(currentPage) && user.role !== 'Admin') {
        window.location.href = 'index.html?error=access_denied';
    }

    // Show user controls
    const userControls = document.getElementById('userControls');
    if (userControls) userControls.style.display = 'flex';
}

/**
 * Handle Login Form Submission
 */
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    setLoading(btn, true, 'Logging in...');

    try {
        const response = await fetch(API_AUTH.login, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();

        if (result.success) {
            showToast('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'redirect.html';
            }, 1000);
        } else {
            showToast(result.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        showToast('Connection error', 'error');
        console.error(error);
    } finally {
        setLoading(btn, false, 'Log In');
    }
}

/**
 * Handle Register Form Submission
 */
async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('registerBtn');
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    setLoading(btn, true, 'Creating account...');

    try {
        const response = await fetch(API_AUTH.register, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                username,
                email,
                password
            })
        });
        const result = await response.json();

        if (result.success) {
            showToast('Registration successful! Please login.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showToast(result.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('Connection error', 'error');
        console.error(error);
    } finally {
        setLoading(btn, false, 'Create Account');
    }
}

/**
 * Handle Logout
 */
async function handleLogout() {
    try {
        const response = await fetch(API_AUTH.logout);
        const result = await response.json();
        if (result.success) {
            sessionStorage.clear();
            // Optional: clear non-persistent localStorage if needed
            // localStorage.removeItem('userAvatar'); 
            // localStorage.removeItem('userProfile');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

/**
 * Helper to show toast using Bootstrap 5
 */
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('toast');
    if (!toastEl) return;

    const toastMessage = document.getElementById('toastMessage');
    if (toastMessage) toastMessage.textContent = message;

    // Set color based on type
    toastEl.className = 'toast align-items-center border-0';
    if (type === 'success') {
        toastEl.classList.add('text-bg-success');
    } else {
        toastEl.classList.add('text-bg-danger');
    }

    // Create bootstrap toast instance
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

function setLoading(btn, isLoading, text) {
    if (!btn) return;
    btn.disabled = isLoading;
    // Handle both cases: button with span or plain text
    const span = btn.querySelector('span');
    if (span) {
        span.textContent = text;
    } else {
        btn.textContent = text;
    }
}

/**
 * Get currently logged in user info from session storage
 */
function getLoggedInUser() {
    return {
        id: sessionStorage.getItem('userId'),
        username: sessionStorage.getItem('userName'),
        email: sessionStorage.getItem('userEmail'),
        role: sessionStorage.getItem('userRole'),
        status: sessionStorage.getItem('userStatus'),
        first_name: sessionStorage.getItem('firstName'),
        last_name: sessionStorage.getItem('lastName'),
        phone: sessionStorage.getItem('userPhone'),
        avatar: sessionStorage.getItem('userAvatarData'),
        position: sessionStorage.getItem('userPosition')
    };
}

/**
 * Initialize Auth Event Listeners
 */
document.addEventListener('DOMContentLoaded', () => {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Logout Buttons (Delegate to handle all instances)
    document.addEventListener('click', (e) => {
        // Check if clicked element or its parent has logout-btn class
        const logoutBtn = e.target.closest('.logout-btn');
        if (logoutBtn) {
            e.preventDefault();
            handleLogout();
        }
    });

    // Check login state on page load
    // Skip for auth pages to avoid loop
    if (!window.location.pathname.includes('login.html') &&
        !window.location.pathname.includes('register.html') &&
        !window.location.pathname.includes('forgot-password.html')) {
        checkLoginState();
    }
});
