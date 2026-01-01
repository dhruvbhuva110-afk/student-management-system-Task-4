<?php
require_once '../config/database.php';
require_once 'auth_helper.php';

header('Content-Type: application/json');

// Require admin privileges
AuthHelper::requireAdmin();

try {
    $db = Database::getInstance()->getConnection();
    
    // Check current state
    $stmt = $db->query("SELECT id, student_id, name FROM students ORDER BY id ASC");
    $before = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Run re-sequence
    try {
        $result = StudentHelper::resequence($db);
        $error = "None";
    } catch (Exception $e) {
        $result = false;
        $error = $e->getMessage();
    }
    
    // Check after state
    $stmt = $db->query("SELECT id, student_id, name FROM students ORDER BY id ASC");
    $after = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => $result,
        'error' => $error,
        'before' => $before,
        'after' => $after
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
