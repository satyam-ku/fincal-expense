require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? `SET (${process.env.EMAIL_PASS.length} chars)` : 'NOT SET ❌');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify(async (err, success) => {
  if (err) {
    console.error('\n❌ Gmail connection FAILED:', err.message);
    if (err.responseCode === 535) {
      console.log('\n🔑 FIX: App Password needed.');
    }
    process.exit(1);
  } else {
    console.log('\n✅ Gmail connected! Sending test email now...');
    try {
      const info = await transporter.sendMail({
        from: `"FinCaL Test" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,  // send to self
        subject: 'FinCaL - Test OTP Email',
        text: 'Your test OTP is: 123456'
      });
      console.log('✅ Email sent! MessageId:', info.messageId);
    } catch (sendErr) {
      console.error('❌ sendMail failed:', sendErr.message);
    }
    process.exit(0);
  }
});
