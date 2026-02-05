// Test email sending script
// Run with: node scripts/test-email.js

const nodemailer = require('nodemailer');

// Load environment variables manually
require('dotenv').config();

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.SMTP_PORT || '587');
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const secure = process.env.SMTP_SECURE === 'true';
const fromEmail = process.env.SMTP_FROM_EMAIL || user;

console.log('=== SMTP Configuration ===');
console.log('Host:', host);
console.log('Port:', port);
console.log('Secure:', secure);
console.log('User:', user);
console.log('Pass:', pass ? `${pass.substring(0, 4)}...${pass.substring(pass.length - 4)}` : 'NOT SET');
console.log('From:', fromEmail);
console.log('========================\n');

if (!user || !pass) {
  console.error('❌ SMTP_USER or SMTP_PASS not set in .env file');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user,
    pass
  }
});

const testEmail = async () => {
  console.log('📧 Testing email connection...\n');

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Send test email
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `"KITS SHMS Test" <${fromEmail}>`,
      to: user, // Send to self
      subject: 'KITS SHMS - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email from KITS SHMS</h2>
          <p>If you received this email, the SMTP configuration is working correctly!</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('\n🎉 SMTP is working correctly!');
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('\nFull error:', error);
  }
};

testEmail();
