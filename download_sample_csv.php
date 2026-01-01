<?php
/**
 * Download Sample CSV Template
 * Generates a sample CSV file for bulk student import
 */

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="student_import_template.csv"');

// CSV columns
$columns = ['student_id', 'name', 'email', 'phone', 'course', 'enrollment_date'];

// Sample data
$sampleData = [
    ['STD101', 'John Doe', 'john.doe@example.com', '+1234567890', 'Computer Science', '2024-01-15'],
    ['STD102', 'Jane Smith', 'jane.smith@example.com', '+0987654321', 'Engineering', '2024-01-16'],
    ['STD103', 'Bob Johnson', 'bob.johnson@example.com', '+1122334455', 'Mathematics', '2024-01-17']
];

// Open output stream
$output = fopen('php://output', 'w');

// Write header
fputcsv($output, $columns);

// Write sample rows
foreach ($sampleData as $row) {
    fputcsv($output, $row);
}

fclose($output);
exit();
