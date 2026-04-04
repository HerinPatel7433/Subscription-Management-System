// server/src/utils/email.util.js
const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter.
 * Uses SMTP environment variables.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465', // true for port 465, false otherwise
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Sends a password reset email.
 * @param {string} toEmail - Recipient email address
 * @param {string} resetToken - Plain-text reset token (NOT the hashed version)
 * @returns {Promise<void>}
 */
async function sendPasswordResetEmail(toEmail, resetToken) {
  const transporter = createTransporter();

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"SMS No-Reply" <noreply@sms.com>',
    to: toEmail,
    subject: 'Password Reset Request — Subscription Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested to reset your password for your Subscription Management System account.</p>
        <p>Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #4F46E5;
                  color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">
          If you didn't request a password reset, please ignore this email.
          Your password will remain unchanged.
        </p>
        <p style="color: #666; font-size: 12px;">
          If the button above doesn't work, copy and paste this URL into your browser:<br/>
          <a href="${resetUrl}" style="color: #4F46E5;">${resetUrl}</a>
        </p>
      </div>
    `,
    text: `
      Password Reset Request

      You requested to reset your password for your Subscription Management System account.
      Click the link below to reset your password (expires in 1 hour):

      ${resetUrl}

      If you didn't request a password reset, please ignore this email.
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Sends an email with an invoice PDF attachment.
 * @param {string} toEmail - Recipient email address
 * @param {string} invoiceId - Invoice ID for reference
 * @param {Buffer} pdfBuffer - The generated PDF buffer
 * @returns {Promise<void>}
 */
async function sendInvoiceEmail(toEmail, invoiceId, pdfBuffer) {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"SMS Billing" <billing@sms.com>',
    to: toEmail,
    subject: `Your Invoice ${invoiceId} — Subscription Management System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Invoice is Ready</h2>
        <p>Dear Customer,</p>
        <p>Please find attached your invoice (ID: ${invoiceId}) for your recent subscription order.</p>
        <p>Thank you for your business!</p>
      </div>
    `,
    text: `Your Invoice (ID: ${invoiceId}) is ready and attached to this email. Thank you for your business!`,
    attachments: [
      {
        filename: `Invoice_${invoiceId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Sends a renewal reminder email.
 */
async function sendRenewalReminderEmail(toEmail, subscription) {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"SMS Billing" <billing@sms.com>',
    to: toEmail,
    subject: `Subscription Renewal Reminder — ID: ${subscription.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Subscription Renewal</h2>
        <p>Dear Customer,</p>
        <p>Your subscription (ID: ${subscription.id}) has ended and is scheduled for auto-renewal.</p>
        <p>A new invoice will be generated shortly.</p>
      </div>
    `,
    text: `Your subscription (ID: ${subscription.id}) has ended and is scheduled for auto-renewal.`,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Sends an overdue invoice reminder email.
 */
async function sendOverdueReminderEmail(toEmail, invoice) {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"SMS Billing" <billing@sms.com>',
    to: toEmail,
    subject: `OVERDUE INVOICE — ID: ${invoice.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E53E3E;">Overdue Invoice Reminder</h2>
        <p>Dear Customer,</p>
        <p>Your invoice (ID: ${invoice.id}) was due on ${new Date(invoice.dueDate).toLocaleDateString()}.</p>
        <p>Please arrange payment as soon as possible to avoid service disruption.</p>
      </div>
    `,
    text: `Your invoice (ID: ${invoice.id}) is overdue. Please arrange payment as soon as possible.`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { 
  sendPasswordResetEmail, 
  sendInvoiceEmail, 
  sendRenewalReminderEmail, 
  sendOverdueReminderEmail,
};
