/**
 * Charts Configuration and Management
 * Handles Chart.js visualizations for the dashboard
 */

let courseChart = null;
let enrollmentChart = null;

/**
 * Initialize dashboard charts
 */
function initializeCharts() {
    createCourseDistributionChart();
    createEnrollmentTrendChart();
}

/**
 * Create course distribution pie chart
 */
function createCourseDistributionChart() {
    const ctx = document.getElementById('courseChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (courseChart) {
        courseChart.destroy();
    }

    const courseData = calculateCourseDistribution();

    courseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: courseData.labels,
            datasets: [{
                label: 'Students per Course',
                data: courseData.values,
                backgroundColor: [
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(34, 211, 238, 0.7)',
                    'rgba(168, 85, 247, 0.7)',
                    'rgba(240, 147, 251, 0.7)',
                    'rgba(244, 63, 94, 0.7)',
                    'rgba(249, 115, 22, 0.7)',
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(20, 184, 166, 0.7)'
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(34, 211, 238, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(240, 147, 251, 1)',
                    'rgba(244, 63, 94, 1)',
                    'rgba(249, 115, 22, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(20, 184, 166, 1)'
                ],
                borderWidth: 1.5,
                borderRadius: 10,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#fff',
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return `Students: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94A3B8',
                        stepSize: 1,
                        font: { family: 'Inter', size: 11 }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.04)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#94A3B8',
                        font: { family: 'Inter', size: 11 }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: true
            },
            onClick: (event, elements, chart) => {
                console.log('Chart clicked', { elements, labels: chart.data.labels });
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const courseName = chart.data.labels[index];
                    console.log('Opening details for:', courseName);
                    showCourseDetails(courseName);
                }
            },
            onHover: (event, elements, chart) => {
                if (event.native && event.native.target) {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
            }
        }
    });
}

/**
 * Create enrollment trend line chart
 */
function createEnrollmentTrendChart() {
    const ctx = document.getElementById('enrollmentChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (enrollmentChart) {
        enrollmentChart.destroy();
    }

    const trendData = calculateEnrollmentTrend();

    enrollmentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendData.labels,
            datasets: [{
                label: 'Enrollments',
                data: trendData.values,
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6366F1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#e5e7eb',
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                    borderWidth: 1,
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94A3B8',
                        stepSize: 1,
                        font: { family: 'Inter', size: 11 }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.04)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#94A3B8',
                        font: { family: 'Inter', size: 11 }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.04)',
                        drawBorder: false
                    }
                }
            }
        }
    });
}

/**
 * Calculate course distribution from student data
 */
function calculateCourseDistribution() {
    const distribution = {};

    allStudents.forEach(student => {
        const course = student.course || 'Unknown';
        distribution[course] = (distribution[course] || 0) + 1;
    });

    return {
        labels: Object.keys(distribution),
        values: Object.values(distribution)
    };
}

/**
 * Calculate enrollment trend by month
 */
function calculateEnrollmentTrend() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const last6Months = [];
    const enrollmentCounts = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        last6Months.push(monthKey);
        enrollmentCounts[monthKey] = 0;
    }

    // Count enrollments
    allStudents.forEach(student => {
        const enrollDate = new Date(student.enrollment_date);
        const monthKey = `${months[enrollDate.getMonth()]} ${enrollDate.getFullYear()}`;
        if (enrollmentCounts.hasOwnProperty(monthKey)) {
            enrollmentCounts[monthKey]++;
        }
    });

    return {
        labels: last6Months,
        values: last6Months.map(month => enrollmentCounts[month] || 0)
    };
}

/**
 * Update all charts with latest data
 */
function updateCharts() {
    if (courseChart) {
        const courseData = calculateCourseDistribution();
        courseChart.data.labels = courseData.labels;
        courseChart.data.datasets[0].data = courseData.values;
        courseChart.update();
    }

    if (enrollmentChart) {
        const trendData = calculateEnrollmentTrend();
        enrollmentChart.data.labels = trendData.labels;
        enrollmentChart.data.datasets[0].data = trendData.values;
        enrollmentChart.update();
    }
}

/**
 * Show students enrolled in a specific course
 * @param {string} courseName 
 */
function showCourseDetails(courseName) {
    const modalEl = document.getElementById('courseDetailsModal');
    const listBody = document.getElementById('courseStudentsList');
    const modalTitle = document.getElementById('courseDetailsModalLabel');

    if (!modalEl || !listBody) return;

    // Filter students
    const filteredStudents = allStudents.filter(s => (s.course || 'Unknown') === courseName);

    // Update title
    modalTitle.textContent = `Students in ${courseName} (${filteredStudents.length})`;

    // Populate list
    if (filteredStudents.length === 0) {
        listBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">No students found.</td></tr>';
    } else {
        listBody.innerHTML = filteredStudents.map(s => `
            <tr>
                <td class="ps-4"><span class="badge bg-primary bg-opacity-10 text-primary">${s.student_id}</span></td>
                <td>${escapeHtml(s.name)}</td>
                <td><small class="text-muted">${escapeHtml(s.email)}</small></td>
                <td class="pe-4"><small>${s.enrollment_date}</small></td>
            </tr>
        `).join('');
    }

    // Show modal
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
