<?php
/**
 * Update Student API
 * Handles PUT/POST requests to update existing students
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST');
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

// Accept PUT or POST requests
if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'POST'])) {
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
    
    // Validate required fields
    $requiredFields = ['student_id', 'name', 'email', 'phone', 'course', 'enrollment_date'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Field '{$field}' is required"]);
            exit();
        }
    }
    
    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit();
    }
    
    // Validate date format
    $date = DateTime::createFromFormat('Y-m-d', $data['enrollment_date']);
    if (!$date || $date->format('Y-m-d') !== $data['enrollment_date']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid date format. Use YYYY-MM-DD']);
        exit();
    }
    
    // Get database connection
    $db = Database::getInstance()->getConnection();
    
    // Check if student exists
    $checkSql = "SELECT id FROM students WHERE id = :id";
    $checkStmt = $db->prepare($checkSql);
    $checkStmt->bindParam(':id', $data['id'], PDO::PARAM_INT);
    $checkStmt->execute();
    
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student not found']);
        exit();
    }
    
    // Prepare update statement
    $sql = "UPDATE students 
            SET student_id = :student_id, 
                name = :name, 
                email = :email, 
                phone = :phone, 
                course = :course, 
                enrollment_date = :enrollment_date 
            WHERE id = :id";
    
    $stmt = $db->prepare($sql);
    
    // Bind parameters
    $stmt->bindParam(':id', $data['id'], PDO::PARAM_INT);
    $stmt->bindParam(':student_id', $data['student_id']);
    $stmt->bindParam(':name', $data['name']);
    $stmt->bindParam(':email', $data['email']);
    $stmt->bindParam(':phone', $data['phone']);
    $stmt->bindParam(':course', $data['course']);
    $stmt->bindParam(':enrollment_date', $data['enrollment_date']);
    
    // Execute query
    if ($stmt->execute()) {
        // Auto re-sequence to maintain order
        StudentHelper::resequence($db);
        
        // Log activity
        $currentUser = AuthHelper::getCurrentUser();
        ActivityLogger::log(
            $currentUser['id'],
            $currentUser['username'],
            $currentUser['email'],
            'UPDATE',
            'student',
            $data['id'],
            "Updated student: {$data['name']} (ID: {$data['student_id']})"
        );
        
        echo json_encode([
            'success' => true,
            'message' => 'Student updated successfully',
            'data' => $data
        ]);
    } else {
        throw new Exception('Failed to update student');
    }
    
} catch (PDOException $e) {
    http_response_code(400);
    
    // Check for duplicate entry
    if ($e->getCode() == 23000) {
        if (strpos($e->getMessage(), 'student_id') !== false) {
            echo json_encode(['success' => false, 'message' => 'Student ID already exists']);
        } elseif (strpos($e->getMessage(), 'email') !== false) {
            echo json_encode(['success' => false, 'message' => 'Email already exists']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Duplicate entry detected']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
