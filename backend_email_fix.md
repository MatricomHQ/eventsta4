# Backend API Change: Fix System Email Sender Name

## Issue
System emails are being sent with an `undefined` sender name.

**Example "From" Header:**
`From: undefined <noreply@eventsta.com>`

This appears unprofessional and can affect email deliverability.

## Root Cause
The backend service responsible for sending transactional emails is not correctly sourcing the `platformName` from the system settings when constructing the "From" header.

## Required Fix
The logic for sending emails must be updated to:
1.  Fetch the current system settings, specifically the `platformName` value.
2.  Use this value as the sender's name.
3.  Provide a safe fallback (e.g., "Eventsta") if the setting is somehow missing, to prevent sending `undefined`.

### Pseudo-code Example (Node.js with a generic email library)

```javascript
// Inside your email sending function...
async function sendTransactionalEmail(trigger, recipientEmail, variables) {
    // 1. Fetch System Settings
    // This could be from a cached config or a direct database/API call.
    const settings = await getSystemSettings(); // Assume this function exists

    // 2. Determine Sender Name with a Fallback
    const senderName = settings.platformName || "Eventsta"; 

    // Fetch and render the email template...
    const { subject, body } = await renderEmailTemplate(trigger, variables, settings);

    // 3. Construct the "From" header correctly
    const fromHeader = `"${senderName}" <noreply@eventsta.com>`;

    // 4. Send the email using your email provider (e.g., SendGrid, Mailgun)
    await emailProvider.send({
        to: recipientEmail,
        from: fromHeader, // Use the constructed header
        subject: subject,
        html: body
    });

    console.log(`Email sent. From: ${fromHeader}`);
}
```

## Verification
After deploying this change, trigger a system email (e.g., by creating a new account or resetting a password) and inspect the "From" field in the received email. It should now correctly display the platform name, for example: `From: Eventsta <noreply@eventsta.com>`.
