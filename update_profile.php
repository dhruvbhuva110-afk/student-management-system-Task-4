<?php
/**
 * Update Profile API
 * Handles POST requests to update user profile information
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once 'auth_helper.php';

// Require authentication
AuthHelper::requireAuth();

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // User ID from session
    $userId = $_SESSION['user_id'];
    
    // Get database connection
    $db = Database::getInstance()->getConnection();
    
    // Prepare update query
    // We only update fields that are provided
    $fields = [];
    $params = [':id' => $userId];
    
    if (isset($data['first_name'])) {
        $fields[] = "first_name = :first_name";
        $params[':first_name'] = $data['first_name'];
        $_SESSION['first_name'] = $data['first_name'];
    }
    
    if (isset($data['last_name'])) {
        $fields[] = "last_name = :last_name";
        $params[':last_name'] = $data['last_name'];
        $_SESSION['last_name'] = $data['last_name'];
    }
    
    if (isset($data['phone'])) {
        $fields[] = "phone = :phone";
        $params[':phone'] = $data['phone'];
        $_SESSION['phone'] = $data['phone'];
    }
    
    if (isset($data['avatar'])) {
        $fields[] = "avatar = :avatar";
        $params[':avatar'] = $data['avatar'];
        $_SESSION['avatar'] = $data['avatar'];
    }
    
    if (isset($data['position'])) {
        $fields[] = "position = :position";
        $params[':position'] = $data['position'];
        $_SESSION['position'] = $data['position'];
    }
    
    if (empty($fields)) {
        echo json_encode(['success' => true, 'message' => 'No changes to update']);
        exit();
    }
    
    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    
    if ($stmt->execute($params)) {
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => AuthHelper::getCurrentUser()
        ]);
    } else {
        throw new Exception('Failed to update profile');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
