<?php
/**
 * /php/send-offer.php
 * Backend for forms.js (config-driven forms) + Google reCAPTCHA v2 checkbox.
 *
 * Expects POST (multipart/form-data):
 * - formKey
 * - subject
 * - g-recaptcha-response (if captcha exists on the page)
 * - any other fields rendered by forms.js (ime, prezime, email, telefon, ...)
 *
 * Returns JSON:
 * { "ok": true, "message": "..." } or { "ok": false, "message": "..." }
 *
 * ✅ IMPORTANT:
 * 1) Set $RECAPTCHA_SECRET to your secret key (server-side key).
 * 2) Set recipients in $FORM_RECIPIENTS or $DEFAULT_RECIPIENTS.
 * 3) Make sure your server can send mail() (or switch to PHPMailer/SMTP).
 */

header('Content-Type: application/json; charset=utf-8');

// ✅ CUSTOM DEBUG LOG - Write directly to file
$LOG_FILE = __DIR__ . '/../debug-email.log';
function debug_log($message) {
  global $LOG_FILE;
  $timestamp = date('Y-m-d H:i:s');
  file_put_contents($LOG_FILE, "[$timestamp] $message\n", FILE_APPEND);
}

debug_log("===== send-offer.php: Script started =====");
debug_log("REQUEST_METHOD: " . ($_SERVER['REQUEST_METHOD'] ?? 'N/A'));
debug_log("POST data: " . print_r($_POST, true));

function respond(bool $ok, string $message, int $httpCode = 200): void {
  debug_log("===== Responding with ok=$ok, message='$message', httpCode=$httpCode =====");
  http_response_code($httpCode);
  echo json_encode(["ok" => $ok, "message" => $message], JSON_UNESCAPED_UNICODE);
  exit;
}

function post_str(string $key, int $maxLen = 5000): string {
  if (!isset($_POST[$key])) return '';
  $v = trim((string)$_POST[$key]);
  if (mb_strlen($v) > $maxLen) $v = mb_substr($v, 0, $maxLen);
  return $v;
}

function safe_header_text(string $s): string {
  // Prevent header injection
  return str_replace(["\r", "\n"], ' ', trim($s));
}

function is_valid_email(string $email): bool {
  return (bool)filter_var($email, FILTER_VALIDATE_EMAIL);
}

function verify_recaptcha_v2(string $secret, string $token, string $remoteIp = ''): bool {
  if ($secret === '' || $token === '') return false;

  $data = [
    'secret'   => $secret,
    'response' => $token,
  ];
  if ($remoteIp !== '') $data['remoteip'] = $remoteIp;

  $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
  curl_setopt_array($ch, [
    CURLOPT_POST            => true,
    CURLOPT_POSTFIELDS      => http_build_query($data),
    CURLOPT_RETURNTRANSFER  => true,
    CURLOPT_TIMEOUT         => 10,
  ]);
  $resp = curl_exec($ch);
  $err  = curl_error($ch);
  curl_close($ch);

  if ($resp === false) {
    debug_log("reCAPTCHA curl error: " . $err);
    return false;
  }

  $json = json_decode($resp, true);
  
  // Debug log - remove after fixing
  if (!empty($json['error-codes'])) {
    debug_log("reCAPTCHA errors: " . implode(', ', $json['error-codes']));
  }
  
  // For reCAPTCHA v2 checkbox: success is enough
  return is_array($json) && !empty($json['success']);
}

/* ==========================
   CONFIG (EDIT THIS BEFORE GOING LIVE)
   ========================== */

// ⚠️ TODO: Put your real reCAPTCHA secret here (SERVER secret key, not site key)
// Get it from: https://www.google.com/recaptcha/admin
$RECAPTCHA_SECRET = '6LcMoUwsAAAAAAnw1E0J2C_SZgd5diRFg1zlOZIk';

// ⚠️ TODO: Set your real email addresses below
// Who receives emails per formKey
$FORM_RECIPIENTS = [
  'video-nadzor' => ['kontakt@maximussecurity.rs'],
  'alarmni-sistemi' => ['kontakt@maximussecurity.rs'],
  'iznajmljivanje-metal-detektorska-vrata' => ['kontakt@maximussecurity.rs'],
  'generic' => ['kontakt@maximussecurity.rs'],
];

// Fallback recipients if formKey not listed
$DEFAULT_RECIPIENTS = ['kontakt@maximussecurity.rs'];

// ⚠️ TODO: From domain (must match your hosting domain for best deliverability)
$FROM_EMAIL = 'kontakt@maximussecurity.rs';
$FROM_NAME  = 'Maximus Security Website';

/* ==========================
   INPUT + BASIC VALIDATION
   ========================== */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  respond(false, 'Method not allowed.', 405);
}

$formKey  = post_str('formKey', 200);
$subject  = post_str('subject', 200);
$token    = post_str('g-recaptcha-response', 8000);

// Minimal required fields you likely want across all forms
$ime      = post_str('ime', 200);
$email    = post_str('email', 200);
$telefon  = post_str('telefon', 200);

// If your page includes reCAPTCHA, forms.js will always send token.
// Require it here for safety.
if ($token === '') {
  respond(false, 'Molimo potvrdite reCAPTCHA.', 400);
}

if ($RECAPTCHA_SECRET === 'PUT_YOUR_RECAPTCHA_SECRET_HERE' || $RECAPTCHA_SECRET === '') {
  respond(false, 'Server reCAPTCHA secret nije podešen.', 500);
}

// Verify reCAPTCHA
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
if (!verify_recaptcha_v2($RECAPTCHA_SECRET, $token, $ip)) {
  respond(false, 'reCAPTCHA verifikacija nije uspela. Pokušajte ponovo.', 400);
}

// Basic validation (adjust to your needs)
if ($ime === '' || mb_strlen($ime) < 2) {
  respond(false, 'Ime je obavezno (min 2 karaktera).', 400);
}
if ($email === '' || !is_valid_email($email)) {
  respond(false, 'Unesite ispravnu email adresu.', 400);
}
if ($telefon === '' || !preg_match('/^[0-9+\s\/\-()]{6,}$/', $telefon)) {
  respond(false, 'Unesite važeći broj telefona.', 400);
}

if ($subject === '') {
  // Fallback subject if JS didn’t send it
  $subject = 'Upit sa sajta';
}
$subject = safe_header_text($subject);

/* ==========================
   ROUTING: RECIPIENTS
   ========================== */

$toList = $DEFAULT_RECIPIENTS;
if ($formKey !== '' && isset($FORM_RECIPIENTS[$formKey]) && is_array($FORM_RECIPIENTS[$formKey])) {
  $toList = $FORM_RECIPIENTS[$formKey];
}
$to = implode(',', array_map('trim', $toList));

/* ==========================
   BUILD MESSAGE
   ========================== */

// List all submitted fields (except captcha token)
$excluded = ['g-recaptcha-response'];
$lines = [];
$lines[] = "Novi upit sa sajta";
$lines[] = "Datum: " . date('Y-m-d H:i:s');
$lines[] = "IP: " . ($ip ?: 'n/a');
$lines[] = "FormKey: " . ($formKey ?: 'n/a');
$lines[] = str_repeat('-', 40);

foreach ($_POST as $k => $v) {
  if (in_array($k, $excluded, true)) continue;

  // If checkbox is unchecked it might not exist in POST
  if (is_array($v)) {
    $v = implode(', ', $v);
  }
  $k = trim((string)$k);
  $v = trim((string)$v);

  if ($k === '') continue;

  // Trim very long values
  if (mb_strlen($v) > 5000) $v = mb_substr($v, 0, 5000) . '...';

  $lines[] = $k . ': ' . $v;
}

$bodyText = implode("\n", $lines);

// Also build a simple HTML version
$bodyHtml = '<html><body style="font-family:Arial,sans-serif; font-size:14px;">';
$bodyHtml .= '<h3>Novi upit sa sajta</h3>';
$bodyHtml .= '<p><strong>Datum:</strong> ' . htmlspecialchars(date('Y-m-d H:i:s')) . '<br>';
$bodyHtml .= '<strong>IP:</strong> ' . htmlspecialchars($ip ?: 'n/a') . '<br>';
$bodyHtml .= '<strong>FormKey:</strong> ' . htmlspecialchars($formKey ?: 'n/a') . '</p>';
$bodyHtml .= '<hr>';
$bodyHtml .= '<table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;">';

foreach ($_POST as $k => $v) {
  if (in_array($k, $excluded, true)) continue;
  if (is_array($v)) $v = implode(', ', $v);

  $k = trim((string)$k);
  $v = trim((string)$v);
  if ($k === '') continue;

  if (mb_strlen($v) > 5000) $v = mb_substr($v, 0, 5000) . '...';

  $bodyHtml .= '<tr><td><strong>' . htmlspecialchars($k) . '</strong></td><td>' . nl2br(htmlspecialchars($v)) . '</td></tr>';
}

$bodyHtml .= '</table>';
$bodyHtml .= '</body></html>';

/* ==========================
   SEND MAIL (mail())
   ========================== */

// Reply-To should be the user’s email so you can hit “Reply” directly
$replyTo = safe_header_text($email);
$fromEmail = safe_header_text($FROM_EMAIL);
$fromName  = safe_header_text($FROM_NAME);

$boundary = '=_ms_' . bin2hex(random_bytes(12));

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'From: ' . $fromName . ' <' . $fromEmail . '>';
$headers[] = 'Reply-To: ' . $replyTo;
$headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';

// Multipart body
$message  = "--{$boundary}\r\n";
$message .= "Content-Type: text/plain; charset=UTF-8\r\n";
$message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$message .= $bodyText . "\r\n\r\n";

$message .= "--{$boundary}\r\n";
$message .= "Content-Type: text/html; charset=UTF-8\r\n";
$message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$message .= $bodyHtml . "\r\n\r\n";
$message .= "--{$boundary}--\r\n";

// Log email attempt
debug_log("Attempting to send email to: " . $to);
debug_log("Subject: " . $subject);
debug_log("From: " . $fromEmail);

$sent = @mail($to, $subject, $message, implode("\r\n", $headers));

if (!$sent) {
  debug_log("mail() returned false - email NOT sent");
  respond(false, 'Email nije poslat. Proverite mail() konfiguraciju na serveru ili koristite SMTP.', 500);
}

debug_log("mail() returned true - email sent successfully");
respond(true, 'Hvala! Vaš zahtev je uspešno poslat.');
