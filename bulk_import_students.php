<?php
/**
 * Bulk Import Students API
 * Handles CSV file upload and batch student creation
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
    // Check if file was uploaded
    if (!isset($_FILES['csvFile']) || $_FILES['csvFile']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error');
    }
    
    $file = $_FILES['csvFile'];
    
    // Validate file type
    $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($fileExt !== 'csv') {
        throw new Exception('Invalid file type. Please upload a CSV file');
    }
    
    // Validate file size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception('File size exceeds 5MB limit');
    }
    
    // Parse CSV file
    $fileHandle = fopen($file['tmp_name'], 'r');
    if (!$fileHandle) {
        throw new Exception('Failed to open CSV file');
    }
    
    // Read header row
    $header = fgetcsv($fileHandle);
    if (!$header) {
        throw new Exception('CSV file is empty or invalid');
    }
    
    // Expected columns (case-insensitive)
    $expectedColumns = ['student_id', 'name', 'email', 'phone', 'course', 'enrollment_date'];
    
    // Normalize header (trim, lowercase, and replace spaces/dashes with underscores)
    $normalizedHeader = array_map(function($h) {
        $h = trim($h);
        $h = strtolower($h);
        $h = str_replace([' ', '-'], '_', $h);
        return $h;
    }, $header);
    
    // Validate that all expected columns exist
    $missingColumns = [];
    foreach ($expectedColumns as $col) {
        if (!in_array(strtolower($col), $normalizedHeader)) {
            $missingColumns[] = $col;
        }
    }
    
    if (!empty($missingColumns)) {
        throw new Exception('Missing required columns: ' . implode(', ', $missingColumns) . '. Your CSV has: ' . implode(', ', $header));
    }
    
    // Create mapping of expected columns to actual positions
    $columnMap = [];
    foreach ($expectedColumns as $expected) {
        $position = array_search(strtolower($expected), $normalizedHeader);
        if ($position !== false) {
            $columnMap[$expected] = $position;
        }
    }
    
    // Get database connection
    $db = Database::getInstance()->getConnection();
    $currentUser = AuthHelper::getCurrentUser();
    
    $successCount = 0;
    $errorCount = 0;
    $errors = [];
    $duplicates = [];
    $lineNumber = 1; // Start from 1 (header is line 0)
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        while (($row = fgetcsv($fileHandle)) !== false) {
            $lineNumber++;
            
            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }
            
            // Map row to associative array using column positions
            $studentData = [];
            foreach ($columnMap as $col => $position) {
                $studentData[$col] = isset($row[$position]) ? trim($row[$position]) : '';
            }
            
            // Validate required fields
            $missingFields = [];
            foreach ($expectedColumns as $col) {
                if (empty($studentData[$col])) {
                    $missingFields[] = $col;
                }
            }
            
            if (!empty($missingFields)) {
                $errors[] = "Line {$lineNumber}: Missing fields - " . implode(', ', $missingFields);
                $errorCount++;
                continue;
            }
            
            // Validate email format
            if (!filter_var($studentData['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Line {$lineNumber}: Invalid email format - {$studentData['email']}";
                $errorCount++;
                continue;
            }
            
            // Validate date format
            $date = DateTime::createFromFormat('Y-m-d', $studentData['enrollment_date']);
            if (!$date || $date->format('Y-m-d') !== $studentData['enrollment_date']) {
                $errors[] = "Line {$lineNumber}: Invalid date format - {$studentData['enrollment_date']} (use YYYY-MM-DD)";
                $errorCount++;
                continue;
            }
            
            // Handle duplicates/updates (Upsert Logic)
            // If student exists with same student_id or email, delete them first
            $deleteSql = "DELETE FROM students WHERE student_id = :student_id OR email = :email";
            $deleteStmt = $db->prepare($deleteSql);
            $deleteStmt->bindParam(':student_id', $studentData['student_id']);
            $deleteStmt->bindParam(':email', $studentData['email']);
            $deleteStmt->execute();
            
            // Insert or Replace student
            $sql = "INSERT INTO students (student_id, name, email, phone, course, enrollment_date) 
                    VALUES (:student_id, :name, :email, :phone, :course, :enrollment_date)";
            
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':student_id', $studentData['student_id']);
            $stmt->bindParam(':name', $studentData['name']);
            $stmt->bindParam(':email', $studentData['email']);
            $stmt->bindParam(':phone', $studentData['phone']);
            // Clean course: remove leading phone numbers/numbers
            $cleanedCourse = preg_replace('/^[\s\+\d\-\(\)]+/', '', $studentData['course']);
            $studentData['course'] = trim($cleanedCourse) ?: 'General';

            $stmt->bindParam(':course', $studentData['course']);
            $stmt->bindParam(':enrollment_date', $studentData['enrollment_date']);
            
            if ($stmt->execute()) {
                $successCount++;
            } else {
                $errors[] = "Line {$lineNumber}: Failed to process student record";
                $errorCount++;
            }
        }
        
        // Commit transaction
        $db->commit();
        
        // Auto re-sequence to maintain order after bulk import
        StudentHelper::resequence($db);
        
        // Log activity
        ActivityLogger::log(
            $currentUser['id'],
            $currentUser['username'],
            $currentUser['email'],
            'BULK_IMPORT',
            'student',
            null,
            "Bulk imported {$successCount} students via CSV"
        );
        
        fclose($fileHandle);
        
        echo json_encode([
            'success' => true,
            'message' => "Import completed: {$successCount} students added, {$errorCount} errors",
            'successCount' => $successCount,
            'errorCount' => $errorCount,
            'errors' => array_merge($errors, $duplicates)
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
