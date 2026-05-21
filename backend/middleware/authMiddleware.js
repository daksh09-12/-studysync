/**
 * StudySync — authMiddleware.js
 * Session security and Access Control (SSDLC)
 */

'use strict';

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'studysync_jwt_secret_key_2026';

/**
 * Verify JWT from cookie and attach user to request
 */
async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user and attach to req (excluding password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or user not found. Please log in again.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    
    // Clear invalid cookies
    res.clearCookie('token', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.'
    });
  }
}

/**
 * Helper to manually verify a token (useful for Socket.io handshakes)
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_) {
    return null;
  }
}

module.exports = {
  authMiddleware,
  verifyToken
};
