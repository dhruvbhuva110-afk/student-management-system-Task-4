<?php
/**
 * Activity Logger Helper
 * Centralized function to log all user activities
 */

require_once '../config/database.php';

class ActivityLogger {
    
    /**
     * Log an activity to the database
     * 
     * @param int $userId - ID of the user performing the action
     * @param string $username - Name of the user
     * @param string $userEmail - Email of the user
     * @param string $action - Action type (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.)
     * @param string $entityType - Type of entity (student, user, course, etc.)
     * @param int|null $entityId - ID of the affected entity
     * @param string $description - Human-readable description
     * @return bool - Success status
     */
    public static function log($userId, $username, $userEmail, $action, $entityType, $entityId, $description) {
        try {
            // Use singleton pattern to get database connection
            $db = Database::getInstance()->getConnection();
            
            // Get client IP address
            $ipAddress = self::getClientIP();
            
            // Get user agent
            $userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'Unknown';
            
            $query = "INSERT INTO activity_logs 
                     (user_id, username, user_email, action, entity_type, entity_id, description, ip_address, user_agent) 
                     VALUES 
                     (:user_id, :username, :user_email, :action, :entity_type, :entity_id, :description, :ip_address, :user_agent)";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':user_email', $userEmail);
            $stmt->bindParam(':action', $action);
            $stmt->bindParam(':entity_type', $entityType);
            $stmt->bindParam(':entity_id', $entityId);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':ip_address', $ipAddress);
            $stmt->bindParam(':user_agent', $userAgent);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("Activity Log Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get client IP address
     */
    private static function getClientIP() {
        $ipAddress = '';
        
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ipAddress = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            $ipAddress = $_SERVER['REMOTE_ADDR'];
        }
        
        return $ipAddress;
    }
}
