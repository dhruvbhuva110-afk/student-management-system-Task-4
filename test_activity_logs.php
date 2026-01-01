<?php
/**
 * Test Activity Logs Connection
 * This file helps diagnose connection issues with the activity_logs table
 */

require_once '../config/database.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Activity Logs Database Test</h2>";

try {
    // Test database connection
    $db = Database::getInstance()->getConnection();
    echo "✅ <strong>Database connection successful!</strong><br><br>";
    
    // Check if activity_logs table exists
    $stmt = $db->query("SHOW TABLES LIKE 'activity_logs'");
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        echo "✅ <strong>Table 'activity_logs' exists!</strong><br><br>";
        
        // Get table structure
        echo "<h3>Table Structure:</h3>";
        $columns = $db->query("DESCRIBE activity_logs")->fetchAll(PDO::FETCH_ASSOC);
        echo "<table border='1' cellpadding='5'>";
        echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th></tr>";
        foreach ($columns as $col) {
            echo "<tr><td>{$col['Field']}</td><td>{$col['Type']}</td><td>{$col['Null']}</td><td>{$col['Key']}</td></tr>";
        }
        echo "</table><br>";
        
        // Count records
        $count = $db->query("SELECT COUNT(*) as cnt FROM activity_logs")->fetch(PDO::FETCH_ASSOC)['cnt'];
        echo "📊 <strong>Total records: {$count}</strong><br><br>";
        
        // Show sample data
        if ($count > 0) {
            echo "<h3>Sample Records (first 5):</h3>";
            $logs = $db->query("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
            echo "<table border='1' cellpadding='5'>";
            echo "<tr><th>ID</th><th>Username</th><th>Action</th><th>Entity</th><th>Description</th><th>Created</th></tr>";
            foreach ($logs as $log) {
                echo "<tr>";
                echo "<td>{$log['id']}</td>";
                echo "<td>{$log['username']}</td>";
                echo "<td>{$log['action']}</td>";
                echo "<td>{$log['entity_type']}</td>";
                echo "<td>{$log['description']}</td>";
                echo "<td>{$log['created_at']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "ℹ️ No records found yet. This is normal for a new table.";
        }
        
    } else {
        echo "❌ <strong>Error: Table 'activity_logs' does NOT exist!</strong><br>";
        echo "Please run the SQL script to create it.<br>";
    }
    
} catch (Exception $e) {
    echo "❌ <strong>Error:</strong> " . htmlspecialchars($e->getMessage());
}

echo "<br><br><a href='../activity-logs.html'>← Back to Activity Logs</a>";
?>
