<?php
/**
 * Get Activity Logs API
 * Retrieves activity logs with optional filtering
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/database.php';
require_once 'auth_helper.php';

// Check if user is logged in
if (!AuthHelper::isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    // Use singleton pattern to get database connection
    $db = Database::getInstance()->getConnection();
    
    // Get filter parameters
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    $entityType = isset($_GET['entity_type']) ? $_GET['entity_type'] : '';
    $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : '';
    $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : '';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Build query with filters
    $query = "SELECT * FROM activity_logs WHERE 1=1";
    $params = [];
    
    if (!empty($action)) {
        $query .= " AND action = :action";
        $params[':action'] = $action;
    }
    
    if (!empty($entityType)) {
        $query .= " AND entity_type = :entity_type";
        $params[':entity_type'] = $entityType;
    }
    
    if (!empty($startDate)) {
        $query .= " AND DATE(created_at) >= :start_date";
        $params[':start_date'] = $startDate;
    }
    
    if (!empty($endDate)) {
        $query .= " AND DATE(created_at) <= :end_date";
        $params[':end_date'] = $endDate;
    }
    
    // Get total count for pagination
    $countStmt = $db->prepare(str_replace("*", "COUNT(*) as total", $query));
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Add ordering, limit and offset
    $query .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $logs,
        'total' => $totalCount,
        'limit' => $limit,
        'offset' => $offset
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
