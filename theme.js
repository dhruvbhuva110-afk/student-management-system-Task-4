/**
 * Theme Management Script
 * Handles toggling between Dark (default) and Light themes
 */

const ThemeManager = {
    init() {
        // Check saved theme or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // Initialize toggle if on settings page
        this.initToggle();
    },

    toggleTheme(isDark) {
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    },

    initToggle() {
        const toggle = document.getElementById('darkModeSwitch');
        if (toggle) {
            // Set initial state
            const currentTheme = localStorage.getItem('theme');
            toggle.checked = currentTheme !== 'light';
            toggle.disabled = false;

            // Add listener
            toggle.addEventListener('change', (e) => {
                this.toggleTheme(e.target.checked);
            });
        }
    }
};

const SidebarManager = {
    init() {
        const sidebar = document.getElementById('sidebar');
        const main = document.querySelector('.main');
        const toggleBtn = document.getElementById('sidebarToggle');
        const mobileToggleBtn = document.getElementById('mobileToggle');

        if (!sidebar || !toggleBtn) {
            console.warn('Sidebar or toggle button not found');
            return;
        }

        // Create overlay if it doesn't exist
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }

        // Check saved state (desktop only)
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        if (isCollapsed && window.innerWidth > 991) {
            sidebar.classList.add('collapsed');
            if (main) main.classList.add('sidebar-collapsed');
            this.updateIcon(true);
        }

        // Desktop Toggle
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentlyCollapsed = sidebar.classList.toggle('collapsed');
            if (main) main.classList.toggle('sidebar-collapsed', currentlyCollapsed);
            localStorage.setItem('sidebar-collapsed', currentlyCollapsed);
            this.updateIcon(currentlyCollapsed);
        });

        // Mobile Toggle
        if (mobileToggleBtn) {
            mobileToggleBtn.addEventListener('click', () => {
                sidebar.classList.add('active');
                overlay.classList.add('active');
            });
        }

        // Close Sidebar on Overlay Click (Mobile)
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });

        // Close Sidebar on Link Click (Mobile)
        const navLinks = sidebar.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 991) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        });
    },

    updateIcon(isCollapsed) {
        const icon = document.querySelector('#sidebarToggle i');
        if (icon) {
            icon.className = isCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left';
        }
    }
};

// Run immediately to prevent flash
ThemeManager.init();

// Re-run on DOMContentLoaded to catch the toggle button
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.initToggle();
    SidebarManager.init();
});
