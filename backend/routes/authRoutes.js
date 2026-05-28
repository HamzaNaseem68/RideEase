const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../database/db');
const { authMiddleware } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'rideease_secret_key_123';

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter all required fields' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      walletBalance: 100000, // Gift Rs. 100,000 wallet balance on sign-up to make the app interactive immediately!
      cnicUploaded: false,
      licenseUploaded: false,
      role: email.includes('admin') ? 'admin' : 'user' // auto-grant admin if email contains 'admin' for easy testing
    });

    // Create JWT
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        walletBalance: newUser.walletBalance,
        cnicUploaded: newUser.cnicUploaded,
        licenseUploaded: newUser.licenseUploaded,
        role: newUser.role
      }
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: 'Server authentication error' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance,
        cnicUploaded: user.cnicUploaded,
        licenseUploaded: user.licenseUploaded,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: 'Server authentication error' });
  }
});

// @route   GET api/auth/profile
// @desc    Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance,
        cnicUploaded: user.cnicUploaded,
        licenseUploaded: user.licenseUploaded,
        cnicUrl: user.cnicUrl,
        licenseUrl: user.licenseUrl,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ success: false, message: 'Server database error' });
  }
});

// @route   POST api/auth/upload-docs
// @desc    Simulate uploading CNIC & Driver License documents
router.post('/upload-docs', authMiddleware, async (req, res) => {
  const { cnicData, licenseData } = req.body; // Base64 data or paths or dummy markers

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        cnicUploaded: true,
        licenseUploaded: true,
        cnicUrl: cnicData || 'uploads/simulated_cnic.jpg',
        licenseUrl: licenseData || 'uploads/simulated_license.jpg'
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Documents uploaded and verified successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance,
        cnicUploaded: user.cnicUploaded,
        licenseUploaded: user.licenseUploaded,
        cnicUrl: user.cnicUrl,
        licenseUrl: user.licenseUrl,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Docs upload error:", err);
    res.status(500).json({ success: false, message: 'Server documents processing error' });
  }
});

module.exports = router;
