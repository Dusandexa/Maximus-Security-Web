<?php
header('Content-Type: application/json');
error_log("TEST PHP: Script executed successfully");
echo json_encode([
    'success' => true,
    'message' => 'PHP works!',
    'time' => date('Y-m-d H:i:s'),
    'mail_function_exists' => function_exists('mail')
]);
