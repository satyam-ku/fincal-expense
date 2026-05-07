const nodemailer = require('nodemailer');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp, name) => {
  // Validate env vars first — clear error if missing
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER or EMAIL_PASS environment variable is not set on the server.');
  }

  // Create transporter here (not at module level) so env vars are always fresh
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS   // Must be Gmail App Password (16 chars, no spaces)
    }
  });

  const mailOptions = {
    from: `"FinCaL" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'FinCaL - Your Signup OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#020202;font-family:sans-serif;">
        <div style="max-width:480px;margin:40px auto;background:#111117;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
          <div style="height:4px;background:linear-gradient(to right, #00f3ff, #ffffff, #ff00ff);"></div>
          <div style="padding:48px 40px;text-align:center;">
            <h1 style="font-size:42px;font-weight:900;margin:0 0 4px;background:linear-gradient(135deg,#fff,#00f3ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">FinCaL</h1>
            <p style="color:#555;font-size:11px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 40px;">Financial Operating System</p>
            <p style="color:#aaa;font-size:14px;margin:0 0 10px;">Hey <strong style="color:#fff;">${name || 'there'}</strong>, your OTP is:</p>
            <div style="background:#000;border:1px solid rgba(0,243,255,0.2);border-radius:16px;padding:28px;margin:20px 0;display:inline-block;width:100%;box-sizing:border-box;">
              <span style="font-size:48px;font-weight:900;font-family:monospace;letter-spacing:12px;color:#00f3ff;">${otp}</span>
            </div>
            <p style="color:#555;font-size:12px;margin:20px 0 0;">Valid for <strong style="color:#888;">10 minutes</strong>. Do not share this OTP.</p>
          </div>
          <div style="padding:20px;background:#000;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="color:#333;font-size:11px;margin:0;">If you didn't request this, ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email} — MessageId: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Email send failed to ${email}:`, err.message);
    // Surface a human-readable error
    if (err.responseCode === 535 || err.message.includes('Invalid login')) {
      throw new Error('Gmail auth failed. Check EMAIL_USER and EMAIL_PASS (must be App Password, not regular password).');
    }
    throw err;
  }
};

module.exports = { generateOTP, sendOTPEmail };
