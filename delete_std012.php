<?php
require_once '../config/database.php';
require_once 'student_helper.php';

header('Content-Type: application/json');

try {
    $db = Database::getInstance()->getConnection();
    
    // Find ID
    $stmt = $db->prepare("SELECT id FROM students WHERE student_id = ?");
    $stmt->execute(['STD012']);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        echo json_encode(['success' => false, 'message' => 'Student STD012 not found']);
        exit();
    }
    
    $id = $student['id'];
    
    // Delete
    $delStmt = $db->prepare("DELETE FROM students WHERE id = ?");
    $delStmt->execute([$id]);
    
    // Resequence
    StudentHelper::resequence($db);
    
    echo json_encode(['success' => true, 'message' => 'Student STD012 deleted and IDs re-sequenced']);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
