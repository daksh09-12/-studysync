/**
 * StudySync — User.js (Mongoose Model)
 * CO4: MongoDB NoSQL data storage using Mongoose ODM
 * Secure Account System (SSDLC)
 */

'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  [true, 'Username is required'],
      unique:    true,
      trim:      true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      trim:      true,
      lowercase: true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters']
    }
  },
  {
    timestamps: true
  }
);

// ── Password Hashing Hook (SSDLC: Secure Password Storage) ────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12); // Work factor 12 (Secure against modern cracking)
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Password Verification Method ──────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
