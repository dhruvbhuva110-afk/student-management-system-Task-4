/**
 * Activity Logs JS
 * Handles loading and displaying activity logs with filtering
 */

let currentPage = 0;
const logsPerPage = 50;
let totalLogs = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkLoginState();

    // Initialize event listeners
    initializeEventListeners();

    // Load initial logs
    loadActivityLogs();
});

function initializeEventListeners() {
    const applyBtn = document.getElementById('applyFiltersBtn');
    const clearBtn = document.getElementById('clearFiltersBtn');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            currentPage = 0;
            loadActivityLogs();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                loadActivityLogs();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if ((currentPage + 1) * logsPerPage < totalLogs) {
                currentPage++;
                loadActivityLogs();
            }
        });
    }
}

async function loadActivityLogs() {
    const tbody = document.getElementById('activityLogsTable');
    const totalCountEl = document.getElementById('totalCount');

    // Show loading state
    tbody.innerHTML = `
        <tr class="loading-row">
            <td colspan="6" class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                Loading activity logs...
            </td>
        </tr>
    `;

    try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append('limit', logsPerPage);
        params.append('offset', currentPage * logsPerPage);

        const action = document.getElementById('filterAction').value;
        const entity = document.getElementById('filterEntity').value;
        const startDate = document.getElementById('filterStartDate').value;
        const endDate = document.getElementById('filterEndDate').value;

        if (action) params.append('action', action);
        if (entity) params.append('entity_type', entity);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await fetch(`api/get_activity_logs.php?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
            totalLogs = result.total;
            displayActivityLogs(result.data);
            updatePagination();

            if (totalCountEl) {
                totalCountEl.textContent = `${result.total} record${result.total !== 1 ? 's' : ''}`;
            }
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Failed to load activity logs: ${result.message}
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading activity logs:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Failed to load activity logs. Please check your connection.
                </td>
            </tr>
        `;
    }
}

function displayActivityLogs(logs) {
    const tbody = document.getElementById('activityLogsTable');

    if (logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox me-2"></i>
                    No activity logs found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = logs.map(log => {
        const actionBadge = getActionBadge(log.action);
        const formattedDate = formatDateTime(log.created_at);

        return `
            <tr>
                <td>
                    <small class="text-muted">${formattedDate}</small>
                </td>
                <td>
                    <div>
                        <strong>${escapeHtml(log.username)}</strong>
                        <br>
                        <small class="text-muted">${escapeHtml(log.user_email)}</small>
                    </div>
                </td>
                <td>${actionBadge}</td>
                <td>
                    <span class="badge bg-secondary bg-opacity-10 text-secondary">
                        ${escapeHtml(log.entity_type)}
                    </span>
                </td>
                <td>${escapeHtml(log.description)}</td>
                <td>
                    <small class="text-muted">${escapeHtml(log.ip_address || 'N/A')}</small>
                </td>
            </tr>
        `;
    }).join('');
}

function getActionBadge(action) {
    const badges = {
        'CREATE': '<span class="badge badge-saas bg-success bg-opacity-10 text-success"><i class="bi bi-plus-circle-fill me-1"></i>Create</span>',
        'UPDATE': '<span class="badge badge-saas bg-warning bg-opacity-10 text-warning"><i class="bi bi-pencil-fill me-1"></i>Update</span>',
        'DELETE': '<span class="badge badge-saas bg-danger bg-opacity-10 text-danger"><i class="bi bi-trash-fill me-1"></i>Delete</span>',
        'LOGIN': '<span class="badge badge-saas bg-info bg-opacity-10 text-info"><i class="bi bi-box-arrow-in-right me-1"></i>Login</span>',
        'LOGOUT': '<span class="badge badge-saas bg-secondary bg-opacity-10 text-secondary"><i class="bi bi-box-arrow-right me-1"></i>Logout</span>'
    };

    return badges[action] || `<span class="badge bg-secondary">${action}</span>`;
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updatePagination() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const paginationInfo = document.getElementById('paginationInfo');

    // Update buttons state
    if (prevBtn) prevBtn.disabled = currentPage === 0;
    if (nextBtn) nextBtn.disabled = (currentPage + 1) * logsPerPage >= totalLogs;

    // Update pagination info
    if (paginationInfo) {
        const start = currentPage * logsPerPage + 1;
        const end = Math.min((currentPage + 1) * logsPerPage, totalLogs);
        paginationInfo.textContent = `Showing ${start}-${end} of ${totalLogs}`;
    }
}

function clearFilters() {
    document.getElementById('filterAction').value = '';
    document.getElementById('filterEntity').value = '';
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    currentPage = 0;
    loadActivityLogs();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
