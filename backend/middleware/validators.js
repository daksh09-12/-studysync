/**
 * StudySync — validators.js
 * Input Validation & Sanitization (SSDLC)
 */

'use strict';

// Helper to escape HTML characters (XSS Prevention)
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validator for registration
function validateRegister(req, res, next) {
  let { username, email, password } = req.body;

  if (typeof username !== 'string') username = '';
  if (typeof email !== 'string') email = '';
  if (typeof password !== 'string') password = '';

  username = username.trim();
  email = email.trim().toLowerCase();

  // Validate Username
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      success: false,
      message: 'Username must be 3-30 characters and contain only letters, numbers, or underscores.'
    });
  }

  // Validate Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }

  // Validate Password
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long.'
    });
  }

  // Sanitize username (just in case, although regex restricts it)
  req.body.username = escapeHTML(username);
  req.body.email = email;
  req.body.password = password; // Hashed later in model pre-save hook

  next();
}

// Validator for login
function validateLogin(req, res, next) {
  let { emailOrUsername, password } = req.body;

  if (typeof emailOrUsername !== 'string') emailOrUsername = '';
  if (typeof password !== 'string') password = '';

  emailOrUsername = emailOrUsername.trim();

  if (!emailOrUsername || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email/Username and password are required.'
    });
  }

  req.body.emailOrUsername = escapeHTML(emailOrUsername);
  req.body.password = password;

  next();
}

// Validator for Room creation
function validateRoom(req, res, next) {
  let { subject, topic } = req.body;

  if (typeof subject !== 'string') subject = '';
  if (typeof topic !== 'string') topic = '';

  subject = subject.trim();
  topic = topic.trim();

  if (!subject || !topic) {
    return res.status(400).json({
      success: false,
      message: 'Subject and topic are required.'
    });
  }

  if (subject.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Subject cannot exceed 100 characters.'
    });
  }

  if (topic.length > 200) {
    return res.status(400).json({
      success: false,
      message: 'Topic cannot exceed 200 characters.'
    });
  }

  req.body.subject = escapeHTML(subject);
  req.body.topic = escapeHTML(topic);

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateRoom,
  escapeHTML
};
