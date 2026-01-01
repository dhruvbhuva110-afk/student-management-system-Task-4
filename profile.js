
/**
 * Profile Management Logic
 * Handles avatar uploads and profile updates with localStorage persistence
 */

document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    initializeProfileListeners();
});

function initializeProfileListeners() {
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarUpload = document.getElementById('avatarUpload');
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    // Avatar Upload Trigger
    if (changeAvatarBtn && avatarUpload) {
        changeAvatarBtn.addEventListener('click', () => {
            avatarUpload.click();
        });

        avatarUpload.addEventListener('change', handleAvatarUpload);
    }

    // Save Profile
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfileChanges);
    }
}

/**
 * Handle Avatar File Upload
 */
function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
        const base64String = event.target.result;

        try {
            const response = await fetch('api/update_profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar: base64String })
            });
            const data = await response.json();

            if (data.success) {
                // Update UI
                updateAllAvatars(base64String);
                // Also update session storage if auth.js uses it
                if (typeof updateHeaderProfile === 'function') {
                    updateHeaderProfile(data.user);
                }
                showToast('Avatar updated successfully!', 'success');
            } else {
                showToast(data.message || 'Failed to update avatar', 'error');
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
            showToast('An error occurred while updating avatar', 'error');
        }
    };
    reader.readAsDataURL(file);
}

/**
 * Update all avatar instances on the page
 */
function updateAllAvatars(imageSrc) {
    // Main profile page avatar
    const profilePageAvatar = document.getElementById('profilePageAvatar');
    if (profilePageAvatar) {
        profilePageAvatar.style.backgroundImage = `url('${imageSrc}')`;
        profilePageAvatar.textContent = ''; // Remove text
    }

    // Header and Sidebar avatars
    // These are typically divs with text, we might need to change them to images or background images
    // For consistency with current CSS which uses divs, let's use background-image
    const avatars = document.querySelectorAll('.avatar, #userAvatar, #userAvatarDropdown, #sidebarUserAvatar');
    avatars.forEach(avatar => {
        // Skip profilePageAvatar since we handled it
        if (avatar.id === 'profilePageAvatar') return;

        avatar.style.backgroundImage = `url('${imageSrc}')`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.textContent = '';
    });
}

/**
 * Save Profile Changes
 */
async function saveProfileChanges() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!firstName || !lastName || !phone) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        const response = await fetch('api/update_profile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                phone: phone
            })
        });
        const data = await response.json();

        if (data.success) {
            // Update global user name display
            const fullName = `${firstName} ${lastName}`;
            updateUserNameDisplay(fullName);

            // Update position display on profile card - using system role now
            const roleDisplay = document.getElementById('profileRoleDisplay');
            const userRole = sessionStorage.getItem('userRole') || 'User';
            if (roleDisplay) roleDisplay.textContent = userRole;

            // Sync with other profile elements if necessary
            if (typeof updateHeaderProfile === 'function') {
                updateHeaderProfile(data.user);
            }

            showToast('Profile saved successfully!', 'success');
        } else {
            showToast(data.message || 'Failed to save changes', 'error');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('An error occurred while saving profile', 'error');
    }
}

/**
 * Load Profile Data from LocalStorage and Session
 */
async function loadProfileData() {
    try {
        const response = await fetch('api/check_auth.php');
        const data = await response.json();

        if (data.authenticated && data.user) {
            const user = data.user;

            // Load Avatar
            if (user.avatar) {
                updateAllAvatars(user.avatar);
            }

            // Update fields
            const emailInput = document.getElementById('email');
            const firstNameInput = document.getElementById('firstName');
            const lastNameInput = document.getElementById('lastName');
            const phoneInput = document.getElementById('phone');
            const roleInput = document.getElementById('role');
            const roleDisplay = document.getElementById('profileRoleDisplay');

            if (emailInput) emailInput.value = user.email || '';
            if (firstNameInput) firstNameInput.value = user.first_name || '';
            if (lastNameInput) lastNameInput.value = user.last_name || '';
            if (phoneInput) phoneInput.value = user.phone || '';

            // Handle Name Display
            if (user.first_name || user.last_name) {
                const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                updateUserNameDisplay(fullName || user.username);
            } else {
                updateUserNameDisplay(user.username);
            }

            // Role vs Position display
            // We prioritize the system Role (Admin/User) to ensure it's not spoofed
            const displayRole = user.role || 'User';
            if (roleInput) roleInput.value = displayRole;
            if (roleDisplay) roleDisplay.textContent = displayRole;
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

/**
 * Update User Name in Header/Sidebar
 */
function updateUserNameDisplay(name) {
    const targets = [
        'profileNameDisplay',
        'userName',
        'sidebarUserName',
        'userNameDropdown'
    ];

    targets.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = name;
    });
}
