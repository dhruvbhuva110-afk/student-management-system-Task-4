<?php
/**
 * Student Helper Class
 * Provides utility methods for student data management
 */
class StudentHelper {
    /**
     * Re-sequences all student IDs to ensure they are sequential (STD001, STD002, etc.)
     * based on their primary key (id) order.
     * 
     * @param PDO $db The database connection
     * @return bool Success or failure
     */
    public static function resequence($db) {
        try {
            // Get all students ordered by their original creation/primary key
            $sql = "SELECT id FROM students ORDER BY id ASC";
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Prepare the update statements
            $tempSql = "UPDATE students SET student_id = CONCAT('TEMP_', id)";
            $db->exec($tempSql);

            $updateSql = "UPDATE students SET student_id = :new_id WHERE id = :id";
            $updateStmt = $db->prepare($updateSql);

            $count = 1;
            foreach ($students as $student) {
                $newId = "STD" . str_pad($count, 3, "0", STR_PAD_LEFT);
                $updateStmt->bindValue(':new_id', $newId, PDO::PARAM_STR);
                $updateStmt->bindValue(':id', $student['id'], PDO::PARAM_INT);
                $updateStmt->execute();
                $count++;
            }

            return true;
        } catch (PDOException $e) {
            error_log("Resequence Error: " . $e->getMessage());
            return false;
        }
    }
}
