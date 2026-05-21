/**
 * StudySync — authRoutes.js
 * Authentication & Session Management (SSDLC)
 */

'use strict';

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { validateRegister, validateLogin } = require('../middleware/validators');
const { authMiddleware } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'studysync_jwt_secret_key_2026';
const ONE_DAY    = 24 * 60 * 60 * 1000;

// Cookie options helper
const getCookieOptions = (req) => {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return {
    httpOnly: true,
    secure:   isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge:   ONE_DAY
  };
};

// ── POST /register — Register a new account ──────────────────────────────────
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(409).json({
        success: false,
        message: `${field} is already registered.`
      });
    }

    // Create user (pre-save hook hashes password)
    const user = await User.create({ username, email, password });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

    // Set cookie
    res.cookie('token', token, getCookieOptions(req));

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        id:       user._id,
        username: user.username,
        email:    user.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /login — Authenticate user ─────────────────────────────────────────
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Search by username or email
    const user = await User.findOne({
      $or: [
        { email:    emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

    // Set cookie
    res.cookie('token', token, getCookieOptions(req));

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        id:       user._id,
        username: user.username,
        email:    user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /logout — Clear authentication cookie ──────────────────────────────
router.post('/logout', (req, res) => {
  const options = getCookieOptions(req);
  delete options.maxAge;
  res.clearCookie('token', options);

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ── GET /me — Retrieve current session user info ───────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  // authMiddleware already fetches user and attaches to req.user (excluding password)
  return res.status(200).json({
    success: true,
    data: {
      id:       req.user._id,
      username: req.user.username,
      email:    req.user.email,
      createdAt: req.user.createdAt
    }
  });
});

module.exports = router;
