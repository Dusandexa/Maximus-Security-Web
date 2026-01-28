# Gmail Delivery Troubleshooting Guide

## Issues Fixed in send-offer.php

### ✅ Changes Made:
1. **Added SMTP Debugging** - Now logs all SMTP communication to debug-email.log
2. **Enhanced Error Logging** - Better exception handling with stack traces
3. **Added Gmail-friendly Headers** - X-Mailer, X-Priority, Message-ID
4. **Removed Duplicate Response** - Fixed code that would never execute
5. **Better Send Verification** - Checks actual send result and logs Message-ID

## Common Gmail Delivery Problems

### 1. **Emails Going to Spam** (Most Common)
**Symptoms:** Email sends successfully but lands in Gmail spam folder

**Solutions:**
- ✅ Configure SPF record for maximussecurity.rs
- ✅ Add DKIM signature to outgoing emails
- ✅ Set up DMARC policy
- ✅ Configure reverse DNS (PTR record)
- ✅ Ensure From address matches SMTP domain

**How to Check:**
```bash
# Check SPF record
nslookup -type=TXT maximussecurity.rs

# Should show something like:
# v=spf1 mx a ip4:YOUR_SERVER_IP ~all
```

### 2. **SMTP Authentication Failure**
**Symptoms:** Cannot connect to mail server, authentication errors in logs

**Solutions:**
- ✅ Verify SMTP password is correct
- ✅ Check if SMTP user has permission to send
- ✅ Ensure port 465 is not blocked by firewall
- ✅ Try alternative port 587 with STARTTLS

### 3. **Gmail Rate Limiting**
**Symptoms:** First few emails work, then fail

**Solutions:**
- ✅ Reduce sending frequency
- ✅ Gmail allows ~500 emails/day from external SMTP
- ✅ Consider using Gmail SMTP directly for higher limits

### 4. **Domain Reputation**
**Symptoms:** Emails consistently rejected or go to spam

**Solutions:**
- ✅ Build sender reputation gradually
- ✅ Don't send too many emails at once initially
- ✅ Have recipients mark emails as "Not Spam"
- ✅ Check domain blacklists: https://mxtoolbox.com/blacklists.aspx

## Testing Steps

### Step 1: Run Test Script
```bash
cd c:\Users\Dule\Documents\Maximus-Security-Website\php
php test-email.php
```

Or access via browser:
```
http://yoursite.com/php/test-email.php
```

### Step 2: Check Debug Log
After sending test email, check:
```
c:\Users\Dule\Documents\Maximus-Security-Website\debug-email.log
```

Look for:
- ✅ "220" response codes (good)
- ❌ "550" response codes (rejection)
- ❌ "451" or "452" response codes (temporary failure)
- ❌ Authentication failures

### Step 3: Check Gmail Accounts
1. Check **Inbox** first
2. Check **Spam** folder
3. Check **All Mail** (in case filtered)

### Step 4: Verify DNS Records

**Check SPF:**
```bash
nslookup -type=TXT maximussecurity.rs
```

**Should include:**
```
v=spf1 mx a ip4:YOUR_SERVER_IP ~all
```

**Check MX records:**
```bash
nslookup -type=MX maximussecurity.rs
```

**Check reverse DNS:**
```bash
nslookup YOUR_SERVER_IP
```

## Recommended DNS Configuration

Add these records to your domain DNS:

### SPF Record (TXT)
```
Name: @
Type: TXT
Value: v=spf1 mx a ip4:YOUR_SERVER_IP ~all
```

### DMARC Record (TXT)
```
Name: _dmarc
Type: TXT
Value: v=DMARC1; p=quarantine; rua=mailto:kontakt@maximussecurity.rs
```

### DKIM Setup
1. Generate DKIM keys on your server
2. Add public key as TXT record
3. Configure PHPMailer to sign emails with DKIM

## PHPMailer DKIM Configuration

Add this to send-offer.php after `setFrom()`:

```php
// DKIM Signature (improves Gmail delivery)
$mail->DKIM_domain = 'maximussecurity.rs';
$mail->DKIM_private = '/path/to/dkim_private.key';
$mail->DKIM_selector = 'mail'; // or 'default'
$mail->DKIM_passphrase = ''; // if key is encrypted
$mail->DKIM_identity = $mail->From;
```

## Alternative: Use Gmail SMTP Directly

If you have a Gmail/Google Workspace account, you can use Gmail's SMTP:

```php
$SMTP_HOST = 'smtp.gmail.com';
$SMTP_PORT = 587; // or 465 for SSL
$SMTP_USERNAME = 'your-email@gmail.com';
$SMTP_PASSWORD = 'your-app-password'; // NOT regular password!
$SMTP_SECURE = PHPMailer::ENCRYPTION_STARTTLS; // for 587
```

**Benefits:**
- ✅ Better delivery to Gmail
- ✅ Already trusted by Google
- ✅ Higher sending limits

**Get App Password:**
1. Google Account → Security → 2-Step Verification
2. App Passwords → Generate
3. Use generated 16-character password

## Monitoring Email Delivery

### Enable Debug Log
The debug log is already enabled in send-offer.php:
- Location: `debug-email.log` in website root
- Contains: All SMTP communication and errors

### Check Email Headers
When testing, save the email and view full headers to see:
- SPF result: `pass`, `fail`, `softfail`, `neutral`
- DKIM result: `pass` or `fail`
- DMARC result: `pass` or `fail`

In Gmail:
1. Open email
2. Click three dots → Show original
3. Look for authentication results

## Current Configuration Status

### ✅ Working:
- PHPMailer SMTP configured
- SSL/TLS encryption (port 465)
- Multiple recipients
- HTML email formatting
- Debug logging enabled

### ⚠️ Need to Verify:
- [ ] SPF record exists and includes server IP
- [ ] DKIM signing configured
- [ ] DMARC policy set up
- [ ] Reverse DNS (PTR) configured
- [ ] Server IP not blacklisted
- [ ] Test emails actually arriving

### 🔧 Recommended Next Steps:
1. Run test-email.php
2. Check all Gmail accounts (inbox + spam)
3. Review debug-email.log
4. Configure DNS records if needed
5. Set up DKIM if emails going to spam

## Quick Diagnosis Commands

```powershell
# Test SMTP connection
Test-NetConnection mail.maximussecurity.rs -Port 465

# Check DNS records
nslookup -type=TXT maximussecurity.rs
nslookup -type=MX maximussecurity.rs

# Check if IP is blacklisted (use online tool)
# Visit: https://mxtoolbox.com/blacklists.aspx
```

## Contact Hosting Provider

If problems persist, ask your hosting provider to verify:
1. ✅ SMTP service is running
2. ✅ Port 465 is open for outbound connections
3. ✅ No rate limiting on email sending
4. ✅ Server IP has good reputation
5. ✅ SPF/DKIM/DMARC can be configured
6. ✅ Reverse DNS (PTR) is set up correctly
