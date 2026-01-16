<?php
// Simple test - no functions, just output
header('Content-Type: application/json');
echo '{"test":"works","time":"' . date('Y-m-d H:i:s') . '"}';
?>