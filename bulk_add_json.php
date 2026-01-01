<?php
/**
 * Bulk Add Students JSON API
 * Handles bulk student addition/update from JSON data
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once 'auth_helper.php';
require_once 'log_activity.php';
require_once 'student_helper.php';

// Require login (any authenticated user can import)
AuthHelper::requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['students']) || !is_array($data['students'])) {
        throw new Exception('Invalid data format. Expected an array of students.');
    }

    $students = $data['students'];
    $db = Database::getInstance()->getConnection();
    
    $successCount = 0;
    $errorCount = 0;
    $errors = [];

    $db->beginTransaction();

    foreach ($students as $student) {
        try {
            // Basic validation
            if (empty($student['name']) || empty($student['email'])) {
                continue;
            }

            // Upsert logic (Delete if exists by student_id or email)
            $deleteSql = "DELETE FROM students WHERE student_id = :sid OR email = :email";
            $deleteStmt = $db->prepare($deleteSql);
            $deleteStmt->execute([
                ':sid' => $student['student_id'] ?? '',
                ':email' => $student['email']
            ]);

            // Clean course: remove leading phone numbers/numbers
            $course = $student['course'] ?? 'General';
            $cleanedCourse = preg_replace('/^[\s\+\d\-\(\)]+/', '', $course);
            $course = trim($cleanedCourse) ?: 'General';

            $insertStmt->execute([
                ':student_id' => $student['student_id'] ?? '',
                ':name' => $student['name'],
                ':email' => $student['email'],
                ':phone' => $student['phone'] ?? '',
                ':course' => $course,
                ':enrollment_date' => $student['enrollment_date'] ?? date('Y-m-d')
            ]);

            $successCount++;
        } catch (Exception $e) {
            $errorCount++;
            $errors[] = "Error adding {$student['name']}: " . $e->getMessage();
        }
    }

    $db->commit();
    
    // Auto re-sequence to maintain order after bulk import
    StudentHelper::resequence($db);
    
    // Log activity
    $currentUser = AuthHelper::getCurrentUser();
    ActivityLogger::log(
        $currentUser['id'],
        $currentUser['username'],
        $currentUser['email'],
        'IMPORT',
        'student',
        0,
        "Bulk imported {$successCount} students via PDF/JSON"
    );

    echo json_encode([
        'success' => true,
        'message' => 'Bulk import completed',
        'successCount' => $successCount,
        'errorCount' => $errorCount,
        'errors' => $errors
    ]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
