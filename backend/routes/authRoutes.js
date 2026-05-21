/**
 * StudySync — authRoutes.js
 * Mock Authentication & Session Management (Bypassed Accounts)
 */

'use strict';

const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// ── POST /register ──────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username } = req.body;
    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        id:       username,
        username: username,
        email:    `${username}@studysync.local`
      }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername } = req.body;
    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        id:       emailOrUsername,
        username: emailOrUsername,
        email:    `${emailOrUsername}@studysync.local`
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /logout ──────────────────────────────
router.post('/logout', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ── GET /me ───────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
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
