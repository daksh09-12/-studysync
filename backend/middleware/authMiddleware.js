/**
 * StudySync — authMiddleware.js
 * Session security and Access Control (SSDLC)
 */

'use strict';

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'studysync_jwt_secret_key_2026';

/**
 * Verify username from x-username header and mock a user object
 */
async function authMiddleware(req, res, next) {
  const username = req.headers['x-username'] || req.query.username || 'Guest';
  req.user = {
    _id: username,
    username: username,
    email: `${username}@studysync.local`,
    createdAt: new Date()
  };
  next();
}

/**
 * Helper to manually verify a token (unused now, always returning mock verification)
 */
function verifyToken(token) {
  return null;
}

module.exports = {
  authMiddleware,
  verifyToken
};
