/**
 * StudySync — Room.js (Mongoose Model)
 * CO4: MongoDB NoSQL data storage using Mongoose ODM
 */

'use strict';

const mongoose = require('mongoose');

// ── Schema Definition ───────────────────────────────────────────────────────
const roomSchema = new mongoose.Schema(
  {
    // Unique short room code (e.g. "abc123")
    roomId: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
      trim:     true
    },

    // Room metadata
    subject: {
      type:     String,
      required: [true, 'Subject is required'],
      trim:     true,
      maxlength: 100
    },
    topic: {
      type:     String,
      required: [true, 'Topic is required'],
      trim:     true,
      maxlength: 200
    },
    createdBy: {
      type:     String,
      required: [true, 'Creator name is required']
    },
    creatorName: {
      type:     String,
      required: [true, 'Creator name is required'],
      trim:     true
    },


    // TTL — MongoDB auto-deletes document when expiresAt < now
    expiresAt: {
      type:    Date,
      required: true,
      expires: 0          // TTL index: delete when expiresAt is reached
    },

    // Embedded sub-documents
    participants: [
      {
        user:     { type: String },
        userName: { type: String, trim: true },
        joinedAt: { type: Date, default: Date.now }
      }
    ],

    messages: [
      {
        id:        { type: String },
        userName:  { type: String, trim: true },
        message:   { type: String, trim: true },
        timestamp: { type: Date, default: Date.now }
      }
    ],

    // Collaborative notes (plain text, synced via Socket.io)
    notes: {
      type:    String,
      default: ''
    },

    // Infinite canvas sticky/formula/text cards
    cards: [
      {
        id:        { type: String, required: true },
        type:      { type: String, enum: ['sticky', 'formula', 'text'], default: 'sticky' },
        x:         { type: Number, default: 100 },
        y:         { type: Number, default: 100 },
        content:   { type: String, default: '' },
        createdBy: { type: String }
      }
    ],

    // Whiteboard drawing strokes
    whiteboardStrokes: [
      {
        x0:    Number,
        y0:    Number,
        x1:    Number,
        y1:    Number,
        color: { type: String, default: '#000000' },
        size:  { type: Number, default: 3 }
      }
    ],

    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true   // adds createdAt + updatedAt automatically
  }
);

// ── Instance Methods ────────────────────────────────────────────────────────
roomSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

// ── Static Methods ──────────────────────────────────────────────────────────
roomSchema.statics.findByRoomId = function (roomId) {
  return this.findOne({ roomId, isActive: true });
};

module.exports = mongoose.model('Room', roomSchema);
