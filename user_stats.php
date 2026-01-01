<?php
/**
 * User Statistics API
 * Returns counts for total, pending, and active users
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once 'auth_helper.php';

// Require Admin privileges
AuthHelper::requireAdmin();

try {
    $db = Database::getInstance()->getConnection();
    
    // Total users
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM users");
    $stmt->execute();
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Pending users
    $stmt = $db->prepare("SELECT COUNT(*) as pending FROM users WHERE status = 'Pending'");
    $stmt->execute();
    $pending = $stmt->fetch(PDO::FETCH_ASSOC)['pending'];
    
    // Active (Approved) users
    $stmt = $db->prepare("SELECT COUNT(*) as active FROM users WHERE status = 'Approved'");
    $stmt->execute();
    $active = $stmt->fetch(PDO::FETCH_ASSOC)['active'];
    
    echo json_encode([
        'success' => true,
        'data' => [
            'totalUsers' => (int)$total,
            'pendingApproval' => (int)$pending,
            'activeUsers' => (int)$active
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
