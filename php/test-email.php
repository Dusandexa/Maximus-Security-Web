<?php
/**
 * Test script to verify SMTP connection and Gmail delivery
 * Run this from command line: php test-email.php
 * Or access via browser: http://yoursite.com/php/test-email.php
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/Exception.php';
require __DIR__ . '/PHPMailer/PHPMailer.php';
require __DIR__ . '/PHPMailer/SMTP.php';

echo "=== Email Delivery Test ===\n\n";

// SMTP Configuration (same as send-offer.php)
$SMTP_HOST = 'mail.maximussecurity.rs';
$SMTP_PORT = 465;
$SMTP_USERNAME = 'kontakt@maximussecurity.rs';
$SMTP_PASSWORD = 'kontaktmaximussecurityrsnalog1!!2026';
$FROM_EMAIL = 'kontakt@maximussecurity.rs';
$FROM_NAME = 'Maximus Security Test';

// Test recipients
$TEST_RECIPIENTS = [
    'onlinemaximussecure@gmail.com',
    'dusandjordjevic008@gmail.com',
    'kontakt@maximussecurity.rs'
];

echo "Testing SMTP connection to: $SMTP_HOST:$SMTP_PORT\n";
echo "From: $FROM_EMAIL\n";
echo "To: " . implode(', ', $TEST_RECIPIENTS) . "\n\n";

$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->SMTPDebug  = 2; // Verbose debug output
    $mail->isSMTP();
    $mail->Host       = $SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = $SMTP_USERNAME;
    $mail->Password   = $SMTP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = $SMTP_PORT;
    $mail->CharSet    = 'UTF-8';

    // Recipients
    $mail->setFrom($FROM_EMAIL, $FROM_NAME);
    
    foreach ($TEST_RECIPIENTS as $recipient) {
        $mail->addAddress(trim($recipient));
    }

    // Content
    $mail->isHTML(true);
    $mail->Subject = 'Test Email - ' . date('Y-m-d H:i:s');
    $mail->Body    = '<html><body style="font-family:Arial,sans-serif;">';
    $mail->Body   .= '<h2>Email Delivery Test</h2>';
    $mail->Body   .= '<p><strong>Sent:</strong> ' . date('Y-m-d H:i:s') . '</p>';
    $mail->Body   .= '<p><strong>From:</strong> ' . $FROM_EMAIL . '</p>';
    $mail->Body   .= '<p><strong>SMTP Server:</strong> ' . $SMTP_HOST . ':' . $SMTP_PORT . '</p>';
    $mail->Body   .= '<hr>';
    $mail->Body   .= '<p>If you received this email, SMTP delivery is working correctly.</p>';
    $mail->Body   .= '<p><strong>Check if this email landed in:</strong></p>';
    $mail->Body   .= '<ul>';
    $mail->Body   .= '<li>✅ Inbox (GOOD - delivery is working perfectly)</li>';
    $mail->Body   .= '<li>⚠️ Spam/Junk folder (BAD - need to improve email reputation)</li>';
    $mail->Body   .= '</ul>';
    $mail->Body   .= '<h3>Next Steps if in Spam:</h3>';
    $mail->Body   .= '<ol>';
    $mail->Body   .= '<li>Check SPF record for domain maximussecurity.rs</li>';
    $mail->Body   .= '<li>Add DKIM signature to emails</li>';
    $mail->Body   .= '<li>Set up DMARC policy</li>';
    $mail->Body   .= '<li>Ensure reverse DNS (PTR) is configured</li>';
    $mail->Body   .= '</ol>';
    $mail->Body   .= '</body></html>';
    
    $mail->AltBody = 'Email Delivery Test - ' . date('Y-m-d H:i:s') . "\n\n";
    $mail->AltBody .= "If you received this email, SMTP delivery is working.\n";
    $mail->AltBody .= "Check if in Inbox or Spam folder.\n";

    // Send
    echo "\n--- Attempting to send email ---\n\n";
    
    $result = $mail->send();
    
    if ($result) {
        echo "\n\n=== SUCCESS ===\n";
        echo "Email sent successfully!\n";
        echo "Message ID: " . $mail->getLastMessageID() . "\n\n";
        echo "⚠️ IMPORTANT: Check ALL recipient inboxes AND spam folders\n";
        echo "If email is in spam, you need to configure:\n";
        echo "  1. SPF record\n";
        echo "  2. DKIM signatures\n";
        echo "  3. DMARC policy\n";
        echo "  4. Reverse DNS (PTR)\n";
    } else {
        echo "\n\n=== FAILED ===\n";
        echo "Email was not sent.\n";
    }

} catch (Exception $e) {
    echo "\n\n=== ERROR ===\n";
    echo "Message could not be sent.\n";
    echo "Mailer Error: " . $mail->ErrorInfo . "\n";
    echo "Exception: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
