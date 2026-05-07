const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ExpensesData = require('../models/ExpensesData');
const PeopleData = require('../models/PeopleData');
const { generateOTP, sendOTPEmail } = require('../utils/email');

// ── Helper: create JWT + initialize user data ──────────────────────────────
async function initUserAndToken(user) {
  // Initialize data docs if first login
  let expData = await ExpensesData.findOne({ userId: user._id });
  if (!expData) {
    expData = new ExpensesData({ userId: user._id });
    await expData.save();
  }
  let peopleDoc = await PeopleData.findOne({ userId: user._id });
  if (!peopleDoc) {
    peopleDoc = new PeopleData({
      userId: user._id,
      people: [{ id: 'myself', name: 'Myself', transactions: [], interestMode: 'none', isGroup: false, members: [], isGeneral: false }]
    });
    await peopleDoc.save();
  }
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  return token;
}

// POST /api/auth/send-otp
// - If user already has a password → tell frontend to use password login (no OTP sent)
// - Otherwise → generate & send OTP for signup flow
router.post('/send-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    let user = await User.findOne({ email });

    // Existing verified user with password → use password login instead
    if (user && user.isVerified && user.password) {
      return res.json({ isExistingUser: true });
    }

    // New signup flow → send OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    if (!user) {
      // Brand new user — name required
      if (!name) return res.status(400).json({ message: 'Name is required for new users', isNewUser: true });
      user = new User({ email, name, otp, otpExpiry });
    } else {
      // User exists but not yet verified
      user.otp = otp;
      user.otpExpiry = otpExpiry;
    }

    await user.save();
    await sendOTPEmail(email, otp, user.name);

    res.json({
      message: 'OTP sent successfully',
      isNewUser: !user.isVerified,
      userName: user.name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

// POST /api/auth/verify-otp
// Called during SIGNUP only. Accepts password to set on first verify.
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.otp || user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired. Request a new one.' });

    // Mark verified and save hashed password
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    const token = await initUserAndToken(user);

    res.json({
      message: 'Account created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
});

// POST /api/auth/login-password
// Used by returning users who already have a password set
router.post('/login-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !user.isVerified || !user.password) {
      return res.status(400).json({ message: 'Account not found. Please sign up first.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

    const token = await initUserAndToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// GET /api/auth/users/search - search all registered users
router.get('/users/search', require('../middleware/auth'), async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ users: [] });

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.userId } // exclude self
    }).select('name email').limit(10);

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Search failed' });
  }
});

module.exports = router;
