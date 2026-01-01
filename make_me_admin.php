<?php
/**
 * Utility script to promote the current user to Admin
 * ONLY FOR DEVELOPMENT/TESTING
 */

header('Content-Type: application/json');
require_once '../config/database.php';
require_once 'auth_helper.php';

if (!AuthHelper::isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login first']);
    exit();
}

$user = AuthHelper::getCurrentUser();
$userId = $user['id'];

try {
    $db = Database::getInstance()->getConnection();
    $sql = "UPDATE users SET role = 'Admin', status = 'Approved' WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':id', $userId);
    
    if ($stmt->execute()) {
        // Also update session
        $_SESSION['role'] = 'Admin';
        $_SESSION['status'] = 'Approved';
        
        echo json_encode([
            'success' => true, 
            'message' => 'Your account has been promoted to Admin and Approved. Please refresh the page.'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update account']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
