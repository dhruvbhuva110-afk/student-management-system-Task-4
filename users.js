/**
 * User Management Logic
 * Handles user listing, status updates, and role changes
 */

const API_USERS = 'api/users.php';
const API_USER_STATS = 'api/user_stats.php';

document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    initUserManagement();

    // Refresh button
    const refreshBtn = document.getElementById('refreshUsersBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadUsers();
            loadUserStats();
        });
    }
});

async function initUserManagement() {
    // Check auth first (handled by auth.js but we ensure)
    const user = await checkLoginState();
    if (!user || user.role !== 'Admin') {
        window.location.href = 'index.html?error=access_denied';
        return;
    }

    loadUsers();
    loadUserStats();
}

async function loadUsers() {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    try {
        const response = await fetch(API_USERS);
        const result = await response.json();

        if (result.success) {
            renderUsers(result.data);
        } else {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${result.message || 'Failed to load users'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error loading users:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Connection error</td></tr>`;
    }
}

async function loadUserStats() {
    try {
        const response = await fetch(API_USER_STATS);
        const result = await response.json();

        if (result.success) {
            document.getElementById('statTotalUsers').textContent = result.data.totalUsers;
            document.getElementById('statPendingUsers').textContent = result.data.pendingApproval;
            document.getElementById('statActiveUsers').textContent = result.data.activeUsers;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function renderUsers(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    if (!users || users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No users found</td></tr>`;
        return;
    }

    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar avatar-sm me-3" style="width: 32px; height: 32px; font-size: 0.8rem;">
                        ${user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div class="fw-bold">${user.username}</div>
                        <div class="text-secondary small">ID: #${user.id}</div>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td>
                <select class="form-select form-select-sm bg-dark text-white border-secondary w-auto" 
                    onchange="updateUserRole(${user.id}, this.value)">
                    <option value="User" ${user.role === 'User' ? 'selected' : ''}>User</option>
                    <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                </select>
            </td>
            <td>
                <span class="status-badge status-${user.status.toLowerCase()}">
                    ${user.status}
                </span>
            </td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    ${user.status === 'Pending' ? `
                        <button class="btn btn-outline-success" onclick="updateUserStatus(${user.id}, 'Approved')" title="Approve">
                            <i class="bi bi-check-lg"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="updateUserStatus(${user.id}, 'Rejected')" title="Reject">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    ` : ''}
                    
                    ${user.status === 'Approved' ? `
                        <button class="btn btn-outline-warning" onclick="updateUserStatus(${user.id}, 'Banned')" title="Ban">
                            <i class="bi bi-slash-circle"></i>
                        </button>
                    ` : ''}
                    
                    ${user.status === 'Banned' || user.status === 'Rejected' ? `
                        <button class="btn btn-outline-success" onclick="updateUserStatus(${user.id}, 'Approved')" title="Re-activate">
                            <i class="bi bi-arrow-counterclockwise"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

async function updateUserStatus(userId, status) {
    try {
        const response = await fetch(API_USERS, {
            method: 'POST',
            body: JSON.stringify({ id: userId, status: status })
        });
        const result = await response.json();

        if (result.success) {
            showToast(`User ${status.toLowerCase()} successfully`);
            loadUsers();
            loadUserStats();
        } else {
            showToast(result.message || 'Operation failed', 'error');
        }
    } catch (error) {
        showToast('Connection error', 'error');
    }
}

async function updateUserRole(userId, role) {
    try {
        const response = await fetch(API_USERS, {
            method: 'POST',
            body: JSON.stringify({ id: userId, role: role })
        });
        const result = await response.json();

        if (result.success) {
            showToast(`User role updated to ${role}`);
            loadUsers();
        } else {
            showToast(result.message || 'Operation failed', 'error');
            loadUsers(); // refresh to reset select
        }
    } catch (error) {
        showToast('Connection error', 'error');
        loadUsers();
    }
}
