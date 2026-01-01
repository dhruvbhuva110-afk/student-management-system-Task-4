<?php
/**
 * User Management API
 * Handles listing and updating users
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once 'auth_helper.php';

// Require Admin privileges for all User Management actions
AuthHelper::requireAdmin();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // List all users
        $sql = "SELECT id, username, email, role, status, created_at FROM users ORDER BY created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $users
        ]);
    } elseif ($method === 'POST' || $method === 'PUT') {
        // Update user status or role
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['id']) || (empty($data['status']) && empty($data['role']))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID and status or role are required']);
            exit();
        }
        
        $userId = $data['id'];
        $updates = [];
        $params = [':id' => $userId];
        
        if (!empty($data['status'])) {
            $updates[] = "status = :status";
            $params[':status'] = $data['status'];
        }
        
        if (!empty($data['role'])) {
            $updates[] = "role = :role";
            $params[':role'] = $data['role'];
        }
        
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        
        if ($stmt->execute($params)) {
            echo json_encode([
                'success' => true,
                'message' => 'User updated successfully'
            ]);
        } else {
            throw new Exception('Failed to update user');
        }
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
