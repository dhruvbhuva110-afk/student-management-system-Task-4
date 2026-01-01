<?php
/**
 * Read Students API
 * Handles GET requests to fetch students
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../config/database.php';
require_once 'auth_helper.php';

// Require authentication for all students API
AuthHelper::requireAuth();

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Get database connection
    $db = Database::getInstance()->getConnection();
    
    // Check if requesting specific student
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $course = isset($_GET['course']) ? $_GET['course'] : null;
    $search = isset($_GET['search']) ? $_GET['search'] : null;
    
    if ($id) {
        // Fetch specific student
        $sql = "SELECT * FROM students WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $student = $stmt->fetch();
        
        if ($student) {
            echo json_encode(['success' => true, 'data' => $student]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Student not found']);
        }
    } else {
        // Build query based on filters
        $sql = "SELECT * FROM students WHERE 1=1";
        $params = [];
        
        // Filter by course
        if ($course && $course !== 'all') {
            $sql .= " AND course = :course";
            $params[':course'] = $course;
        }
        
        // Search functionality
        if ($search) {
            $sql .= " AND (name LIKE :search OR email LIKE :search OR student_id LIKE :search OR phone LIKE :search)";
            $params[':search'] = "%{$search}%";
        }
        
        // Order by ID (which corresponds to sequential Student ID)
        $sql .= " ORDER BY id ASC";
        
        $stmt = $db->prepare($sql);
        
        // Bind parameters
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        $students = $stmt->fetchAll();
        
        // Get all unique courses for filter dropdown
        $courseSql = "SELECT DISTINCT course FROM students ORDER BY course";
        $courseStmt = $db->query($courseSql);
        $courses = $courseStmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo json_encode([
            'success' => true,
            'data' => $students,
            'count' => count($students),
            'courses' => $courses
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
