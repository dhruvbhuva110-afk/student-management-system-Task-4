<?php
/**
 * User Login API
 * Handles POST requests to authenticate users and start sessions
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once 'auth_helper.php';
require_once 'log_activity.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($data['email']) || empty($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email and password are required']);
        exit();
    }
    
    // Get database connection
    $db = Database::getInstance()->getConnection();
    
    // Fetch user by email or username
    $sql = "SELECT id, username, email, password, role, status, first_name, last_name, phone, avatar, position FROM users WHERE email = :email OR username = :username";
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':email', $data['email']);
    $stmt->bindParam(':username', $data['email']);
    $stmt->execute();
    
    $user = $stmt->fetch();
    
    // Verify password
    if ($user && password_verify($data['password'], $user['password'])) {
        // Check account status
        if ($user['status'] === 'Pending') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Your account is pending approval by an admin.']);
            exit();
        } elseif ($user['status'] === 'Rejected') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Your account registration has been rejected.']);
            exit();
        } elseif ($user['status'] === 'Banned') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Your account has been banned. Please contact support.']);
            exit();
        }

        // Start session and store user data
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['status'] = $user['status'];
        $_SESSION['first_name'] = $user['first_name'];
        $_SESSION['last_name'] = $user['last_name'];
        $_SESSION['phone'] = $user['phone'];
        $_SESSION['avatar'] = $user['avatar'];
        $_SESSION['avatar'] = $user['avatar'];
        $_SESSION['position'] = $user['position'];
        
        // Log login activity
        ActivityLogger::log(
            $user['id'],
            $user['username'],
            $user['email'],
            'LOGIN',
            'user',
            $user['id'],
            'User logged in'
        );
        
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role'],
                'status' => $user['status'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'phone' => $user['phone'],
                'avatar' => $user['avatar'],
                'position' => $user['position']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
