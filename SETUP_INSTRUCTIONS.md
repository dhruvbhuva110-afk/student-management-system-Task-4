# Quick Setup Instructions

## Step 1: Create Activity Logs Database Table

You need to create the `activity_logs` table in your database. Here are **3 easy ways** to do this:

### Option 1: Using phpMyAdmin (Easiest)

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Click on your database `student_management` in the left sidebar
3. Click the **"SQL"** tab at the top
4. Copy and paste this SQL code:

```sql
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(100) NOT NULL,
    user_email VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

5. Click **"Go"** button
6. You should see a success message!

### Option 2: Import the SQL File

1. Open phpMyAdmin
2. Select `student_management` database
3. Click **"Import"** tab
4. Click **"Choose File"**
5. Navigate to: `e:\xampp\htdocs\student-management-system-dashboard\database\activity_logs.sql`
6. Click **"Go"**
7. Done!

### Option 3: Using MySQL Command Line

```bash
mysql -u root -p student_management < "e:\xampp\htdocs\student-management-system-dashboard\database\activity_logs.sql"
```

## Step 2: Verify It's Working

1. Refresh your Activity Logs page
2. The error should be gone
3. Try adding, editing, or deleting a student
4. Go back to Activity Logs - you should see the logged activities!

## Step 3: Clear Browser Cache (if needed)

If Activity Logs link still doesn't appear on some pages:

1. Press `Ctrl + Shift + R` to hard refresh
2. Or clear browser cache and reload

---

## That's it! 🎉

The database table is now created and Activity Logs will start working immediately.
