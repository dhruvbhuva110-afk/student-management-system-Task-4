# Student Management System - Responsive Dashboard

A professional, mobile-friendly student management system with Bootstrap 5 integration, featuring a responsive dashboard, user authentication, and comprehensive student data management.

## ✨ Features

### Responsive UI
- **Bootstrap 5 Integration** - Modern, professional design framework
- **Mobile-First Design** - Optimized for all device sizes
- **Responsive Navigation** - Collapsible navbar with hamburger menu
- **Adaptive Grid System** - Automatic layout adjustments

### Dashboard
- **Statistics Cards** - Real-time student metrics with gradient icons
  - Total Students count (with **Monthly Enrollment** tracking)
  - Active Courses tracker
  - Recent Enrollments (last 30 days)
  - Average students per course
- **Interactive Bar Chart** - Visual course distribution with smooth animations
- **Enrollment Trends** - Monthly tracking using Chart.js
- **Responsive Grid** - 4 columns (desktop) → 2 columns (tablet) → 1 column (mobile)

### User Profile System
- **Profile Dropdown** - User avatar with initials, username, and email
- **Logout Access** - Easy session termination from the profile menu
- **Auto-Generated Avatars** - Colorful gradient backgrounds with initials
- **Session Management** - Secure authentication with PHP sessions

### Student Management
### User Experience Enhancements
- **Login Transition Page** - "Authenticated!" intermediate screen with loading animation
- **Role-Based Directives** - Smart dashboard banners indicating user permissions
- **Toast Notifications** - Real-time feedback for all actions
- **Loading States** - Button spinners and table skeleton loaders

### Student Management & Permissions
- **Admin Privileges** - Full control: Create, Read, Update, Delete, Import, Export
- **User Permissions** - Restricted access: Add and Import Students only (Cannot Edit/Delete)
- **Bulk Operations** - Logic for CSV and PDF bulk imports
- **Secure Export** - PDF and CSV export functionality
- **Auto-Generated Student IDs** - Automated `STD001`, `STD002`... sequence
- **Sequential ID Reordering** - Automatic gap filling upon student deletion
- **Search Functionality** - Real-time global search
- **Course Filtering** - Instant filtering by department/course

### Authentication
- **Secure Login** - Email and password authentication
- **Rich Transition** - Smooth login flow with `redirect.html`
- **User Registration** - New user account creation with First/Last name support
- **Session Management** - Persistent login sessions with role tracking
- **Protected Routes** - Auth-required pages and Admin-only sections

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with CSS variables
- **Bootstrap 5.3.2** - Responsive framework
- **Bootstrap Icons** - Icon library
- **JavaScript (ES6+)** - Modern JavaScript
- **Chart.js 4.4.0** - Data visualization

### Backend
- **PHP 7.4+** - Server-side logic
- **MySQL** - Database management
- **REST API** - JSON-based API endpoints

## 📱 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Desktop | ≥ 992px | 4-column grid, full navigation |
| Tablet | 768px - 991px | 2-column grid, collapsible nav |
| Mobile | < 768px | 1-column grid, hamburger menu |
| Small Mobile | < 480px | Optimized spacing |

## 🚀 Getting Started

### Prerequisites
- XAMPP/WAMP/LAMP stack
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/student-management-system-dashboard.git
   cd student-management-system-dashboard
   ```

2. **Start your local server**
   - Start Apache and MySQL in XAMPP/WAMP
   - Place project in `htdocs` or `www` folder

3. **Create database**
   ```sql
   CREATE DATABASE student_management;
   ```

4. **Import schema**
   - Navigate to phpMyAdmin
   - Import `database/schema.sql`

5. **Configure database connection**
   - Update `config/database.php` with your credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   define('DB_NAME', 'student_management');
   ```

6. **Access the application**
   - Open browser: `http://localhost/student-management-system-dashboard`
   - Register a new account
   - Login and start managing students

## 📁 Project Structure

```
student-management-system-dashboard/
├── index.html              # Main dashboard
├── students.html           # Student management
├── redirect.html           # Login transition page
├── login.html              # Login page
├── register.html           # Registration page
├── activity-logs.html      # Admin activity logs
├── users.html              # Admin user management
├── css/
│   └── styles.css          # Custom styles
├── js/
│   ├── app.js              # Main application logic
│   ├── auth.js             # Authentication handling
│   ├── log_activity.js     # Activity log logic
│   ├── users.js            # User management logic
│   └── ...
├── api/
│   ├── auth_helper.php     # Auth & Permission utilities
│   ├── log_activity.php    # Logger class
│   ├── create.php          # Create student (All Users)
│   ├── update.php          # Update student (Admin Only)
│   ├── delete.php          # Delete student (Admin Only)
│   ├── bulk_import_*.php   # Import handlers
│   └── ...
├── config/
│   └── database.php        # Database configuration
└── database/
    ├── schema.sql          # Database schema
    └── activity_logs.sql   # Activity logs schema
```

## 🎨 UI Features

### Color Scheme
- **Primary**: Purple gradient (#667eea → #764ba2)
- **Secondary**: Dark purple (#764ba2)
- **Accent**: Pink (#f093fb)
- **Success**: Green (#10B981)
- **Background**: Light gray (#F9FAFB)

### Design Elements
- Glassmorphism effects
- Gradient backgrounds
- Smooth transitions (0.3s ease)
- Hover animations
- Custom scrollbar
- Shadow elevations

## 🔒 Security & Permissions

### Role-Based Access Control (RBAC)
| Feature | Admin | User |
|---------|-------|------|
| View Students | ✅ Yes | ✅ Yes |
| Add Student | ✅ Yes | ✅ Yes |
| Import (CSV/PDF) | ✅ Yes | ✅ Yes |
| Export (CSV/PDF) | ✅ Yes | ✅ Yes |
| Edit Student | ✅ Yes | ❌ No |
| Delete Student | ✅ Yes | ❌ No |
| View Activity Logs | ✅ Yes | ❌ No |
| Manage Users | ✅ Yes | ❌ No |

### Activity Logging
- **Login/Logout Tracking** - Logs timestamp, IP, and User Agent
- **CRUD Logging** - Records Creation, Updates, and Deletions
- **Bulk Operations** - Tracks import events
- **Super Admin Visibility** - Full audit trail accessible to Admins

### Technical Security
- **Password Hashing** - Secure `password_hash()` implementation
- **SQL Injection Prevention** - PDO prepared statements everywhere
- **XSS Protection** - Global HTML escaping function
- **Session Security** - Role and status verification on every request

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login.php` | POST | User login |
| `/api/register.php` | POST | User registration |
| `/api/logout.php` | GET | User logout |
| `/api/check_auth.php` | GET | Check authentication |
| `/api/read.php` | GET | Get all students |
| `/api/create.php` | POST | Create student |
| `/api/update.php` | PUT | Update student |
| `/api/delete.php` | DELETE | Delete student |

## 🧪 Testing

The application has been tested on:
- ✅ Desktop (1920x1080, 1366x768)
- ✅ Tablet (768px, 1024px)
- ✅ Mobile (375px, 414px, 480px)
- ✅ Chrome 120+
- ✅ Edge 120+
- ✅ Firefox 120+

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Contact

For questions or support, please open an issue on GitHub.

---


