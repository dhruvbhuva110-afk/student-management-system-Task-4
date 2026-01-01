/**
 * Student Management System - Main Application Logic
 * Handles all CRUD operations and UI interactions
 */

// API Configuration
const API_BASE = 'api/';
const API_ENDPOINTS = {
    create: `${API_BASE}create.php`,
    read: `${API_BASE}read.php`,
    update: `${API_BASE}update.php`,
    delete: `${API_BASE}delete.php`
};

// Global state
let allStudents = [];
let allCourses = [];
let isEditMode = false;
let currentEditId = null;
let studentModalInstance = null;
let bsToast = null;

// DOM Elements
const studentsTableBody = document.getElementById('studentsTableBody');
const recentStudentsTable = document.getElementById('recentStudentsTable');
const addStudentBtn = document.getElementById('addStudentBtn');
const searchInput = document.getElementById('searchInput');
const topSearchInput = document.getElementById('topSearchInput');
const courseFilter = document.getElementById('courseFilter');
const studentModal = document.getElementById('studentModal');
const studentForm = document.getElementById('studentForm');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('submitBtn');
const logoutBtn = document.getElementById('logoutBtn');
const totalStudentsEl = document.getElementById('totalStudents');
const emptyState = document.getElementById('emptyState');
const submitBtnText = document.getElementById('submitBtnText');

// Initialize app on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Verify authentication
    const user = await checkLoginState();
    if (user) {
        // Show user info
        const userControls = document.getElementById('userControls');
        if (userControls) userControls.style.display = 'flex';

        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            const fullName = (user.first_name || user.last_name)
                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                : user.username;
            userNameEl.textContent = fullName;
        }


        // Initialize Bootstrap Components
        if (studentModal) {
            studentModalInstance = new bootstrap.Modal(studentModal);
        }

        // Initialize App
        loadStudents();
        initializeEventListeners();

        // RBAC: Show Read-Only/Limited Access Banner if not Admin
        const role = getUserRole();
        if (role !== 'Admin') {
            // We allow Users to Add, but not Edit/Delete.
            // So we DO NOT hide addStudentBtn anymore.

            // Show Limited Access Banner
            const banner = document.getElementById('readOnlyBanner');
            if (banner) {
                banner.classList.remove('d-none');
            }
        }
    }
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Add event listeners
    if (addStudentBtn) addStudentBtn.addEventListener('click', () => openAddModal());

    // Manually handle close buttons if needed, but Bootstrap data-bs-dismiss usually handles it
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

    if (studentForm) studentForm.addEventListener('submit', handleFormSubmit);
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (topSearchInput) topSearchInput.addEventListener('input', handleGlobalSearch);
    if (courseFilter) courseFilter.addEventListener('change', handleFilterChange);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Handle all logout buttons (since we have one in sidebar and one in dropdown)
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    });

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', handleExportCSV);

    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', handleExportPDF);

    // Bulk import handlers
    const importPdfBtn = document.getElementById('importPdfBtn');
    if (importPdfBtn) importPdfBtn.addEventListener('click', openPdfImportModal);

    const pdfFileInput = document.getElementById('pdfFileInput');
    if (pdfFileInput) pdfFileInput.addEventListener('change', handlePdfFileSelect);

    const confirmPdfImportBtn = document.getElementById('confirmPdfImportBtn');
    if (confirmPdfImportBtn) confirmPdfImportBtn.addEventListener('click', handlePdfBulkImport);

    const importBtn = document.getElementById('importStudentsBtn');
    if (importBtn) importBtn.addEventListener('click', () => openImportModal());

    const csvFileInput = document.getElementById('csvFileInput');
    if (csvFileInput) csvFileInput.addEventListener('change', handleCSVFileSelect);

    const confirmImportBtn = document.getElementById('confirmImportBtn');
    if (confirmImportBtn) confirmImportBtn.addEventListener('click', handleBulkImport);

    // Initialize charts after stats are loaded
    if (typeof initializeCharts === 'function') {
        setTimeout(initializeCharts, 100);
    }
}

/**
 * Handle CSV Export
 */
function handleExportCSV() {
    if (!allStudents || allStudents.length === 0) {
        showToast('No data to export', 'error');
        return;
    }

    // CSV Header
    const headers = ['Student ID', 'Name', 'Email', 'Phone', 'Course', 'Enrollment Date'];

    // Convert data to CSV format
    const csvContent = [
        headers.join(','), // Header row
        ...allStudents.map(student => [
            student.student_id,
            `"${student.name}"`, // Quote name to handle commas
            student.email,
            student.phone,
            `"${student.course}"`,
            student.enrollment_date
        ].join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Export started successfully', 'success');
}

/**
 * Handle PDF Export
 * Uses jsPDF and jsPDF-AutoTable
 */
function handleExportPDF() {
    if (!allStudents || allStudents.length === 0) {
        showToast('No data to export', 'error');
        return;
    }

    // Get current filtered students (same logic as applyFilters)
    let filtered = allStudents;
    const selectedCourse = courseFilter ? courseFilter.value : 'all';
    if (selectedCourse !== 'all') {
        filtered = filtered.filter(student => student.course === selectedCourse);
    }
    const term = (searchInput ? searchInput.value : '').toLowerCase().trim();
    if (term) {
        filtered = filtered.filter(student => {
            return student.student_id.toLowerCase().includes(term) ||
                student.name.toLowerCase().includes(term) ||
                student.email.toLowerCase().includes(term) ||
                student.phone.includes(term) ||
                student.course.toLowerCase().includes(term);
        });
    }

    if (filtered.length === 0) {
        showToast('No visible data to export', 'error');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add Header
        doc.setFontSize(22);
        doc.setTextColor(40, 44, 52);
        doc.text('Student Management System', 14, 22);

        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text('Student List Report', 14, 30);

        // Add metadata
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);
        doc.text(`Total Records: ${filtered.length}`, 14, 45);

        // Define table columns
        const columns = [
            { header: 'Student ID', dataKey: 'student_id' },
            { header: 'Full Name', dataKey: 'name' },
            { header: 'Email Address', dataKey: 'email' },
            { header: 'Phone', dataKey: 'phone' },
            { header: 'Course', dataKey: 'course' },
            { header: 'Enrollment Date', dataKey: 'enrollment_date' }
        ];

        // Format data for AutoTable
        const tableData = filtered.map(student => ({
            student_id: student.student_id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            course: student.course,
            enrollment_date: student.enrollment_date
        }));

        // Generate table
        doc.autoTable({
            columns: columns,
            body: tableData,
            startY: 55,
            theme: 'grid',
            headStyles: {
                fillColor: [67, 97, 238],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 247, 251]
            },
            styles: {
                fontSize: 9,
                cellPadding: 3
            },
            margin: { top: 55 }
        });

        // Save PDF
        const filename = `student_report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        showToast('PDF Report exported successfully!', 'success');

    } catch (error) {
        console.error('PDF Export Error:', error);
        showToast('Failed to generate PDF. Please try again.', 'error');
    }
}

/**
 * Load all students from API
 */
async function loadStudents() {
    try {
        const response = await fetch(API_ENDPOINTS.read);
        const data = await response.json();

        if (data.success) {
            allStudents = data.data;
            allCourses = data.courses || [];
            updateCourseFilter();

            // Render specific views based on page
            if (studentsTableBody) renderStudents(allStudents);
            if (recentStudentsTable) renderRecentStudents(allStudents);

            updateStats();
        } else {
            showToast('Failed to load students', 'error');
        }
    } catch (error) {
        console.error('Error loading students:', error);
        // Silent fail or minimal UI update
    }
}

/**
 * Render main students table (full list)
 */
function renderStudents(students) {
    if (!studentsTableBody) return;

    if (students.length === 0) {
        studentsTableBody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    const userRole = getUserRole();
    const canEdit = userRole === 'Admin';
    const canDelete = userRole === 'Admin';

    studentsTableBody.innerHTML = students.map(student => `
        <tr data-id="${student.id}">
            <td><span class="badge-tag" style="background: rgba(255,255,255,0.1);">${escapeHtml(student.student_id)}</span></td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar me-2" style="width: 32px; height: 32px; font-size: 0.8rem; background: var(--gradient-primary);">
                        ${student.name.charAt(0).toUpperCase()}
                    </div>
                    ${escapeHtml(student.name)}
                </div>
            </td>
            <td>${escapeHtml(student.email)}</td>
            <td class="d-none d-md-table-cell">${escapeHtml(student.phone)}</td>
            <td><span class="badge-tag badge-blue">${escapeHtml(student.course)}</span></td>
            <td class="d-none d-lg-table-cell text-muted">${formatDate(student.enrollment_date)}</td>
            <td>
                <div class="d-flex gap-2">
                    ${canEdit ? `
                    <button class="btn btn-sm btn-outline-primary" style="padding: 0.25rem 0.5rem;" onclick="window.editStudent(${student.id})">
                        <i class="bi bi-pencil"></i>
                    </button>` : ''}
                    ${canDelete ? `
                    <button class="btn btn-sm btn-outline-danger" style="padding: 0.25rem 0.5rem;" onclick="window.deleteStudent(${student.id}, '${escapeHtml(student.name).replace(/'/g, "\\'")}')">
                        <i class="bi bi-trash"></i>
                    </button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Render recent students (Dashboard view)
 */
function renderRecentStudents(students) {
    if (!recentStudentsTable) return;

    // Take last 5
    const recent = students.slice(-5).reverse();

    recentStudentsTable.innerHTML = recent.map(student => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar me-2" style="width: 32px; height: 32px; font-size: 0.8rem; background: var(--bg-input); border: 1px solid rgba(255,255,255,0.1);">
                        ${student.name.charAt(0).toUpperCase()}
                    </div>
                    ${escapeHtml(student.name)}
                </div>
            </td>
            <td class="text-secondary">${escapeHtml(student.email)}</td>
            <td><span class="badge-tag badge-blue">${escapeHtml(student.course)}</span></td>
            <td class="text-secondary">${escapeHtml(student.phone)}</td>
            <td class="text-secondary">${formatDate(student.enrollment_date)}</td>
        </tr>
    `).join('');
}

/**
 * Update course filter dropdown
 */
function updateCourseFilter() {
    if (!courseFilter) return;

    const currentValue = courseFilter.value;
    // Keep the first 'All Courses' option
    courseFilter.innerHTML = '<option value="all">All Courses</option>';

    allCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        courseFilter.appendChild(option);
    });

    courseFilter.value = currentValue;
}

/**
 * Update all dashboard statistics
 */
function updateStats() {
    // Total students
    if (totalStudentsEl) totalStudentsEl.textContent = allStudents.length;
    const dashTotalEl = document.getElementById('dashTotalStudents');
    if (dashTotalEl) dashTotalEl.textContent = allStudents.length;

    // Students this month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonthCount = allStudents.filter(s => {
        const enrollDate = new Date(s.enrollment_date);
        return enrollDate.getMonth() === currentMonth && enrollDate.getFullYear() === currentYear;
    }).length;
    const studentChangeEl = document.getElementById('studentChange');
    if (studentChangeEl) {
        studentChangeEl.innerHTML = `<i class="bi bi-arrow-up-short"></i> +${thisMonthCount} this month`;
        studentChangeEl.className = 'trend up';
    }

    // Active courses
    const totalCoursesEl = document.getElementById('totalCourses');
    if (totalCoursesEl) totalCoursesEl.textContent = allCourses.length;

    // Recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = allStudents.filter(s => {
        return new Date(s.enrollment_date) >= thirtyDaysAgo;
    }).length;
    const recentEl = document.getElementById('recentEnrollments');
    if (recentEl) recentEl.textContent = recentCount;

    // Average per course
    const avgEl = document.getElementById('avgPerCourse');
    if (avgEl && allCourses.length > 0) {
        const avg = Math.round(allStudents.length / allCourses.length);
        avgEl.textContent = avg;
    }

    // Update charts if they exist
    if (typeof updateCharts === 'function') {
        updateCharts();
    }
}

/**
 * Open add student modal
 */
function openAddModal() {
    if (!studentModalInstance) return;

    isEditMode = false;
    currentEditId = null;
    if (modalTitle) modalTitle.textContent = 'Add New Student';
    if (submitBtn) submitBtn.textContent = 'Add Student';
    if (studentForm) studentForm.reset();

    // Auto-generate Student ID
    const nextId = generateStudentId();
    const idInput = document.getElementById('studentIdInput');
    if (idInput) {
        idInput.value = nextId;
        idInput.readOnly = true;
    }

    // Set default enrollment date to today
    const dateInput = document.getElementById('studentEnrollmentDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // Set default phone prefix
    const phoneInput = document.getElementById('studentPhone');
    if (phoneInput) {
        phoneInput.value = '+91';
    }

    studentModalInstance.show();
}

/**
 * Hide Modal
 */
function hideModal() {
    if (studentModalInstance) {
        studentModalInstance.hide();
    }
}

/**
 * Open edit student modal
 */
function editStudent(id) {
    if (!studentModalInstance) return;

    const student = allStudents.find(s => s.id == id);
    if (!student) return;

    isEditMode = true;
    currentEditId = id;
    if (modalTitle) modalTitle.textContent = 'Edit Student';
    if (submitBtn) submitBtn.textContent = 'Update Student';

    // Populate form
    const idInput = document.getElementById('studentIdInput');
    if (idInput) idInput.value = student.student_id;

    document.getElementById('studentName').value = student.name;
    document.getElementById('studentEmail').value = student.email;
    document.getElementById('studentPhone').value = student.phone;
    document.getElementById('studentCourse').value = student.course;
    document.getElementById('studentEnrollmentDate').value = student.enrollment_date;

    studentModalInstance.show();
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    // Get Raw Phone
    let phoneVal = document.getElementById('studentPhone').value.trim();

    // Normalize Phone: Remove non-digits
    let phoneDigits = phoneVal.replace(/\D/g, '');

    // Auto-add 91 if only 10 digits provided
    if (phoneDigits.length === 10) {
        phoneDigits = '91' + phoneDigits;
    }

    // Format as +91XXXXXXXXXX
    const finalPhone = '+' + phoneDigits;

    const formData = {
        student_id: document.getElementById('studentIdInput').value.trim(),
        name: document.getElementById('studentName').value.trim(),
        email: document.getElementById('studentEmail').value.trim(),
        phone: finalPhone,
        course: document.getElementById('studentCourse').value.trim(),
        enrollment_date: document.getElementById('studentEnrollmentDate').value
    };

    // Validate form data
    if (!validateForm(formData)) {
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = isEditMode ? 'Updating...' : 'Adding...';
    }

    try {
        if (isEditMode) {
            await updateStudent(currentEditId, formData);
        } else {
            await createStudent(formData);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = isEditMode ? 'Update Student' : 'Add Student';
        }
    }
}

/**
 * Validate form data
 */
function validateForm(data) {
    // Check required fields
    for (let key in data) {
        if (!data[key]) {
            showToast(`Please fill in ${key.replace('_', ' ')}`, 'error');
            return false;
        }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showToast('Please enter a valid email address (e.g. user@example.com)', 'error');
        return false;
    }

    // Validate phone: Must start with +91 and have exactly 10 digits after that
    const phonePattern = /^\+91\d{10}$/;
    if (!phonePattern.test(data.phone)) {
        showToast('Phone number must be in format: +91 followed by 10 digits (e.g., +919876543210)', 'error');
        return false;
    }

    return true;
}

/**
 * Create new student
 */
async function createStudent(data) {
    try {
        const response = await fetch(API_ENDPOINTS.create, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('Server response not JSON:', responseText);
            alert('Server Error: ' + responseText.substring(0, 200)); // Show user the PHP error
            throw new Error('Invalid JSON response');
        }

        if (result.success) {
            showToast('Student added successfully!', 'success');
            hideModal();
            loadStudents();
        } else {
            showToast(result.message || 'Failed to add student', 'error');
        }
    } catch (error) {
        console.error('Error creating student:', error);
        if (error.message !== 'Invalid JSON response') {
            showToast('Error connecting to server: ' + error.message, 'error');
        }
    }
}

/**
 * Update existing student
 */
async function updateStudent(id, data) {
    try {
        const response = await fetch(API_ENDPOINTS.update, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...data, id: id })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Student updated successfully!', 'success');
            hideModal();
            loadStudents();
        } else {
            showToast(result.message || 'Failed to update student', 'error');
        }
    } catch (error) {
        console.error('Error updating student:', error);
        showToast('Error connecting to server', 'error');
    }
}

/**
 * Delete student
 */
async function deleteStudent(id, name) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
        return;
    }

    try {
        const response = await fetch(API_ENDPOINTS.delete, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Student deleted successfully!', 'success');
            loadStudents();
        } else {
            showToast(result.message || 'Failed to delete student', 'error');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        showToast('Error connecting to server', 'error');
    }
}

/**
 * Handle search input
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    if (!searchTerm) {
        applyFilters();
        return;
    }

    // Simple frontend search for demo
    // Ideally this should trigger applyFilters
    applyFilters();
}

/**
 * Handle global search (top bar)
 */
function handleGlobalSearch(e) {
    // If on dashboard, maybe redirect to students? 
    // For now, if we are on students page, sync with searchInput
    if (searchInput) {
        searchInput.value = e.target.value;
        applyFilters();
    }
}

/**
 * Handle course filter
 */
function handleFilterChange() {
    applyFilters();
}

/**
 * Apply all active filters
 */
function applyFilters() {
    let filtered = allStudents;

    // Course filter
    const selectedCourse = courseFilter ? courseFilter.value : 'all';
    if (selectedCourse !== 'all') {
        filtered = filtered.filter(student => student.course === selectedCourse);
    }

    // Search filter
    const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (term) {
        filtered = filtered.filter(student => {
            return student.student_id.toLowerCase().includes(term) ||
                student.name.toLowerCase().includes(term) ||
                student.email.toLowerCase().includes(term) ||
                student.phone.includes(term) ||
                student.course.toLowerCase().includes(term);
        });
    }

    if (studentsTableBody) renderStudents(filtered);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('toast');
    if (!toastEl) return;

    const toastMessage = document.getElementById('toastMessage');
    if (toastMessage) toastMessage.textContent = message;

    // If using Bootstrap toast
    if (!bsToast) {
        bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
    }
    bsToast.show();
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Generate next sequential Student ID
 */
function generateStudentId() {
    if (allStudents.length === 0) return 'STD001';

    // Extract numbers from student_ids and find the max
    const ids = allStudents.map(s => {
        const match = s.student_id.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
    });

    const nextNum = Math.max(...ids) + 1;
    return `STD${nextNum.toString().padStart(3, '0')}`;
}

// Make functions globally accessible
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;

/**
 * Bulk Import Functions
 */

let selectedCSVFile = null;
let importModalInstance = null;

function openImportModal() {
    const importModal = document.getElementById('importModal');
    if (!importModal) return;

    if (!importModalInstance) {
        importModalInstance = new bootstrap.Modal(importModal);
    }

    // Reset modal state
    document.getElementById('csvFileInput').value = '';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importResults').style.display = 'none';
    document.getElementById('confirmImportBtn').disabled = true;
    selectedCSVFile = null;

    importModalInstance.show();
}

function downloadSampleCSV() {
    window.location.href = 'api/download_sample_csv.php';
}

function handleCSVFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
        showToast('Please select a CSV file', 'error');
        return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit', 'error');
        return;
    }

    selectedCSVFile = file;
    previewCSV(file);
}

function previewCSV(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            showToast('CSV file appears to be empty', 'error');
            return;
        }

        // Parse header
        const header = lines[0].split(',').map(h => h.trim());

        // Parse first 5 data rows
        const previewRows = lines.slice(1, 6).map(line => {
            return line.split(',').map(cell => cell.trim());
        });

        // Display preview
        const previewHeader = document.getElementById('previewHeader');
        const previewBody = document.getElementById('previewBody');

        previewHeader.innerHTML = '<tr>' + header.map(h => `<th>${escapeHtml(h)}</th>`).join('') + '</tr>';
        previewBody.innerHTML = previewRows.map(row =>
            '<tr>' + row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('') + '</tr>'
        ).join('');

        document.getElementById('importPreview').style.display = 'block';
        document.getElementById('confirmImportBtn').disabled = false;
    };

    reader.readAsText(file);
}

async function handleBulkImport() {
    if (!selectedCSVFile) {
        showToast('Please select a CSV file', 'error');
        return;
    }

    const confirmBtn = document.getElementById('confirmImportBtn');
    const progressEl = document.getElementById('importProgress');
    const resultsEl = document.getElementById('importResults');

    // Show progress
    confirmBtn.disabled = true;
    progressEl.style.display = 'block';
    resultsEl.style.display = 'none';

    const formData = new FormData();
    formData.append('csvFile', selectedCSVFile);

    try {
        const response = await fetch('api/bulk_import_students.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        // Hide progress
        progressEl.style.display = 'none';
        resultsEl.style.display = 'block';

        if (result.success) {
            const successMsg = document.getElementById('successMessage');
            successMsg.innerHTML = `
                <i class="bi bi-check-circle me-2"></i>
                <strong>Import Completed!</strong><br>
                ${result.successCount} students imported successfully.
                ${result.errorCount > 0 ? `${result.errorCount} errors encountered.` : ''}
            `;

            if (result.errors && result.errors.length > 0) {
                const errorMsg = document.getElementById('errorMessage');
                const errorList = document.getElementById('errorList');
                errorList.innerHTML = result.errors.map(err => `<li>${escapeHtml(err)}</li>`).join('');
                errorMsg.style.display = 'block';
            }

            // Reload students if any were imported
            if (result.successCount > 0) {
                showToast(`${result.successCount} students imported successfully!`, 'success');
                setTimeout(() => {
                    loadStudents();
                    if (importModalInstance) importModalInstance.hide();
                }, 2000);
            }
        } else {
            const errorMsg = document.getElementById('errorMessage');
            errorMsg.innerHTML = `<strong>Error:</strong> ${escapeHtml(result.message)}`;
            errorMsg.style.display = 'block';
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error importing CSV:', error);
        progressEl.style.display = 'none';
        showToast('Error connecting to server', 'error');
    } finally {
        confirmBtn.disabled = false;
    }
}
/**
 * PDF Import Functions
 */

let pdfImportModalInstance = null;
let extractedPdfData = [];

// Initialize PDF.js
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function openPdfImportModal() {
    const pdfModal = document.getElementById('pdfImportModal');
    if (!pdfModal) return;

    if (!pdfImportModalInstance) {
        pdfImportModalInstance = new bootstrap.Modal(pdfModal);
    }

    // Reset modal state
    document.getElementById('pdfFileInput').value = '';
    document.getElementById('pdfImportPreview').style.display = 'none';
    document.getElementById('pdfImportProgress').style.display = 'none';
    document.getElementById('pdfImportResults').style.display = 'none';
    document.getElementById('confirmPdfImportBtn').disabled = true;
    extractedPdfData = [];

    pdfImportModalInstance.show();
}

async function handlePdfFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
        showToast('Please select a PDF file', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit', 'error');
        return;
    }

    document.getElementById('pdfImportProgress').style.display = 'block';
    document.getElementById('pdfImportPreview').style.display = 'none';
    document.getElementById('confirmPdfImportBtn').disabled = true;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        parsePdfContent(fullText);
    } catch (error) {
        console.error('Error parsing PDF:', error);
        showToast('Failed to parse PDF file', 'error');
        document.getElementById('pdfImportProgress').style.display = 'none';
    }
}

function parsePdfContent(text) {
    // This is a naive parser. It looks for patterns in the text.
    const lines = text.split('\n');
    const students = [];

    // Attempt to find student blocks or rows
    // Common pattern: ID (STDxxx), Name, Email, Phone, Course, Date

    // Simple heuristic: Split by ID occurrences
    const studentBlocks = text.split(/(?=STD\d{3})/g);

    studentBlocks.forEach(block => {
        if (!block.trim()) return;

        const student = {
            student_id: '',
            name: '',
            email: '',
            phone: '',
            course: '',
            enrollment_date: ''
        };

        // Extract Student ID
        const idMatch = block.match(/STD\d{3,}/);
        if (idMatch) student.student_id = idMatch[0];

        // Extract Email
        const emailMatch = block.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) student.email = emailMatch[0];

        // Extract Phone (look for +91 or standard numbers)
        const phoneMatch = block.match(/(\+91|91)?[6-9]\d{9}/);
        if (phoneMatch) {
            let p = phoneMatch[0];
            if (!p.startsWith('+')) p = '+' + p;
            student.phone = p;
        }

        // Extract Enrollment Date (YYYY-MM-DD or DD MMM YYYY)
        const dateMatch = block.match(/\d{4}-\d{2}-\d{2}/) || block.match(/\d{1,2}\s[A-Z][a-z]{2}\s\d{4}/);
        if (dateMatch) {
            const d = new Date(dateMatch[0]);
            if (!isNaN(d.getTime())) {
                student.enrollment_date = d.toISOString().split('T')[0];
            }
        }

        // Guess Name and Course (Remaining text)
        // This is tricky. Let's try to remove known patterns and look at what's left
        let remaining = block
            .replace(student.student_id, '')
            .replace(student.email, '')
            .replace(phoneMatch ? phoneMatch[0] : '', '')
            .replace(dateMatch ? dateMatch[0] : '', '')
            .replace(/\s+/g, ' ')
            .trim();

        // Heuristic: Name usually comes before Email/Phone, Course usually comes after or is a specific tag
        // We'll take the first part as name if it's more than 2 words
        const parts = remaining.split(' ');
        if (parts.length >= 2) {
            student.name = parts.slice(0, 2).join(' ');
            let courseText = parts.slice(2).join(' ') || 'General';
            // Clean course: remove leading numbers, plus signs, dashes, and extra spaces
            student.course = courseText.replace(/^[\s\+\d\-\(\)]+/, '').trim() || 'General';
        } else {
            student.name = remaining || '';
            student.course = 'General';
        }

        // Validation: Student MUST have at least a Name and Email/ID to be considered valid
        if (student.name && (student.email || student.student_id)) {
            students.push(student);
        }
    });

    displayPdfPreview(students);
}

function displayPdfPreview(students) {
    const previewBody = document.getElementById('pdfPreviewBody');
    const previewSection = document.getElementById('pdfImportPreview');
    const resultsEl = document.getElementById('pdfImportResults');
    const errorEl = document.getElementById('pdfErrorMessage');

    document.getElementById('pdfImportProgress').style.display = 'none';

    if (students.length === 0) {
        previewSection.style.display = 'none';
        resultsEl.style.display = 'block';
        errorEl.style.display = 'block';
        errorEl.innerHTML = `
            <strong>Validation Error:</strong> No valid student data found.<br>
            Your PDF file must include columns for: <strong>student_id, name, email, phone, course, enrollment_date</strong>.
        `;
        showToast('Invalid PDF format or no data found', 'error');
        return;
    }

    // Hide any previous errors
    errorEl.style.display = 'none';
    resultsEl.style.display = 'none';

    extractedPdfData = students;
    previewBody.innerHTML = students.map(s => `
        <tr class="${(!s.student_id || !s.email || !s.phone) ? 'table-warning text-dark' : ''}">
            <td>${s.student_id ? escapeHtml(s.student_id) : '<span class="text-danger small">Missing ID</span>'}</td>
            <td>${s.name ? escapeHtml(s.name) : '<span class="text-danger small">Missing Name</span>'}</td>
            <td>${s.email ? escapeHtml(s.email) : '<span class="text-danger small">Missing Email</span>'}</td>
            <td>${s.phone ? escapeHtml(s.phone) : '<span class="text-muted small">Missing Phone</span>'}</td>
            <td>${s.course ? escapeHtml(s.course) : '<span class="text-muted small">Missing Course</span>'}</td>
            <td>${s.enrollment_date ? escapeHtml(s.enrollment_date) : '<span class="text-muted small">Missing Date</span>'}</td>
        </tr>
    `).join('');

    previewSection.style.display = 'block';
    document.getElementById('confirmPdfImportBtn').disabled = false;
}

async function handlePdfBulkImport() {
    if (extractedPdfData.length === 0) return;

    const confirmBtn = document.getElementById('confirmPdfImportBtn');
    const resultsEl = document.getElementById('pdfImportResults');

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Importing...';

    try {
        // We'll use a new endpoint that accepts JSON
        const response = await fetch('api/bulk_add_json.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students: extractedPdfData })
        });

        const result = await response.json();
        resultsEl.style.display = 'block';

        if (result.success) {
            document.getElementById('pdfSuccessMessage').innerHTML = `
                <i class="bi bi-check-circle me-2"></i>
                <strong>Import Successful!</strong> ${result.successCount} students added/updated.
            `;
            showToast('PDF Import successful!', 'success');
            setTimeout(() => {
                loadStudents();
                if (pdfImportModalInstance) pdfImportModalInstance.hide();
            }, 2000);
        } else {
            throw new Error(result.message || 'Import failed');
        }
    } catch (error) {
        console.error('PDF Import error:', error);
        const errorEl = document.getElementById('pdfErrorMessage');
        errorEl.style.display = 'block';
        errorEl.innerHTML = `<strong>Error:</strong> ${error.message}`;
        showToast('PDF Import failed', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Confirm Import';
    }
}
