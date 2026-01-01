<?php
/**
 * Authentication Helper
 * Handles session management and access control
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';

class AuthHelper {
    /**
     * Check if user is logged in
     * @return bool
     */
    public static function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }

    /**
     * Require user to be logged in for API endpoints
     * Returns 401 if not logged in
     */
    public static function requireAuth() {
        if (!self::isLoggedIn()) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Authentication required']);
            exit();
        }
    }

    /**
     * Alias for requireAuth
     */
    public static function requireLogin() {
        self::requireAuth();
    }

    /**
     * Check if user is an admin
     * @return bool
     */
    public static function isAdmin() {
        return self::isLoggedIn() && isset($_SESSION['role']) && $_SESSION['role'] === 'Admin';
    }

    /**
     * Require admin privileges for API endpoints
     * Returns 403 if not an admin
     */
    public static function requireAdmin() {
        self::requireAuth();
        if (!self::isAdmin()) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Access denied: Admin privileges required'
            ]);
            exit();
        }
    }

    /**
     * Get current user data from session
     * @return array|null
     */
    public static function getCurrentUser() {
        if (self::isLoggedIn()) {
            // Check if we need to refresh session data (e.g. if names are missing but might exist in DB now)
            if (empty($_SESSION['first_name']) || empty($_SESSION['last_name'])) {
                self::refreshSessionData();
            }

            return [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'email' => $_SESSION['email'],
                'role' => isset($_SESSION['role']) ? $_SESSION['role'] : 'User',
                'status' => isset($_SESSION['status']) ? $_SESSION['status'] : 'Pending',
                'first_name' => isset($_SESSION['first_name']) ? $_SESSION['first_name'] : '',
                'last_name' => isset($_SESSION['last_name']) ? $_SESSION['last_name'] : '',
                'phone' => isset($_SESSION['phone']) ? $_SESSION['phone'] : '',
                'avatar' => isset($_SESSION['avatar']) ? $_SESSION['avatar'] : '',
                'position' => isset($_SESSION['position']) ? $_SESSION['position'] : ''
            ];
        }
        return null;
    }

    /**
     * Refresh session data from database
     */
    private static function refreshSessionData() {
        if (!isset($_SESSION['user_id'])) return;

        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("SELECT first_name, last_name, phone, avatar, position, role, status FROM users WHERE id = :id");
            $stmt->execute([':id' => $_SESSION['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                $_SESSION['first_name'] = $user['first_name'];
                $_SESSION['last_name'] = $user['last_name'];
                $_SESSION['phone'] = $user['phone'];
                $_SESSION['avatar'] = $user['avatar'];
                $_SESSION['position'] = $user['position'];
                $_SESSION['role'] = $user['role'];
                $_SESSION['status'] = $user['status'];
            }
        } catch (Exception $e) {
            // Silently fail if DB error, just return old session data
        }
    }
}
