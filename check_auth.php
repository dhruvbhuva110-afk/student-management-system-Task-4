<?php
/**
 * Check Auth API
 * Verified current session status
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'auth_helper.php';

if (AuthHelper::isLoggedIn()) {
    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'user' => AuthHelper::getCurrentUser()
    ]);
} else {
    echo json_encode([
        'success' => true,
        'authenticated' => false
    ]);
}
