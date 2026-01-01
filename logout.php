<?php
/**
 * User Logout API
 * Handles session destruction
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'auth_helper.php';
require_once 'log_activity.php';

// Start session if not started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Log logout activity before data is cleared
if (isset($_SESSION['user_id'])) {
    ActivityLogger::log(
        $_SESSION['user_id'],
        $_SESSION['username'] ?? 'Unknown',
        $_SESSION['email'] ?? 'Unknown',
        'LOGOUT',
        'user',
        $_SESSION['user_id'],
        'User logged out'
    );
}

// Clear all session variables
$_SESSION = [];

// Destroy the session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destroy session
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);
