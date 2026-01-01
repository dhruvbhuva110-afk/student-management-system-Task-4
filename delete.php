<?php
/**
 * Delete Student API
 * Handles DELETE/POST requests to remove students
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once 'auth_helper.php';
require_once 'log_activity.php';
require_once 'student_helper.php';

// Require admin privileges
AuthHelper::requireAdmin();

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Accept DELETE or POST requests
if (!in_array($_SERVER['REQUEST_METHOD'], ['DELETE', 'POST'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate ID
    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Student ID is required']);
        exit();
    }
    
    // Get database connection
    $db = Database::getInstance()->getConnection();
    
    // Check if student exists
    $checkSql = "SELECT id, name FROM students WHERE id = :id";
    $checkStmt = $db->prepare($checkSql);
    $checkStmt->bindParam(':id', $data['id'], PDO::PARAM_INT);
    $checkStmt->execute();
    
    $student = $checkStmt->fetch();
    
    if (!$student) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student not found']);
        exit();
    }
    
    // Delete student
    $sql = "DELETE FROM students WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':id', $data['id'], PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        // Re-sequence Student IDs to ensure no gaps
        StudentHelper::resequence($db);

        // Log activity
        $currentUser = AuthHelper::getCurrentUser();
        ActivityLogger::log(
            $currentUser['id'],
            $currentUser['username'],
            $currentUser['email'],
            'DELETE',
            'student',
            $data['id'],
            "Deleted student: {$student['name']}"
        );

        echo json_encode([
            'success' => true,
            'message' => 'Student deleted and IDs re-sequenced successfully',
            'deleted' => $student
        ]);
    } else {
        throw new Exception('Failed to delete student');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
