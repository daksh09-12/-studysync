/**
 * StudySync — roomRoutes.js
 * CO3: RESTful API with Express.js — routing, middleware, HTTP methods, URL params
 * CO4: MongoDB — Room CRUD
 * Secure Room management (SSDLC)
 */

'use strict';

const express = require('express');
const router  = express.Router();
const { nanoid } = require('nanoid');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRoom } = require('../middleware/validators');

// Try to use MongoDB Room model; fall back to in-memory store if DB is down
let Room;
try {
  Room = require('../models/Room');
} catch (_) {
  Room = null;
}

// ── In-memory store (fallback / demo mode) ──────────────────────────────────
const memRooms = new Map();      // roomId → room object

function memCreate({ roomId, subject, topic, createdBy, creatorName, expiresAt }) {
  const room = {
    roomId, subject, topic, createdBy, creatorName,
    expiresAt, participants: [], messages: [], isActive: true
  };
  memRooms.set(roomId, room);
  return room;
}

function memFind(roomId) {
  return memRooms.get(roomId) || null;
}

// ── Helper: check Mongoose connection ──────────────────────────────────────
function dbReady() {
  try {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1 && Room;
  } catch (_) { return false; }
}

// ── GET /api/my-rooms — Get rooms created by the current user ───────────────
router.get('/my-rooms', authMiddleware, async (req, res) => {
  try {
    if (dbReady()) {
      const rooms = await Room.find({ createdBy: req.user._id, isActive: true }).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        data: rooms.map(room => ({
          roomId: room.roomId,
          subject: room.subject,
          topic: room.topic,
          createdAt: room.createdAt,
          expiresAt: room.expiresAt,
          participantCount: room.participants.length
        }))
      });
    } else {
      const roomsList = [];
      memRooms.forEach(room => {
        if (room.createdBy === req.user._id.toString() && room.isActive) {
          roomsList.push(room);
        }
      });
      return res.status(200).json({
        success: true,
        data: roomsList
      });
    }
  } catch (err) {
    console.error('GET my-rooms error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your rooms.' });
  }
});

// ── POST /api/create — Create a new study room (Protected) ─────────────────
router.post('/create', authMiddleware, validateRoom, async (req, res) => {
  try {
    const { subject, topic } = req.body;
    const roomId    = nanoid(6).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
    const creatorId = req.user._id;
    const creatorName = req.user.username;

    let room;

    if (dbReady()) {
      // MongoDB available — persist to DB (CO4)
      room = await Room.create({
        roomId,
        subject,
        topic,
        createdBy: creatorId,
        creatorName: creatorName,
        expiresAt,
        participants: [{
          user: creatorId,
          userName: creatorName,
          joinedAt: new Date()
        }]
      });
    } else {
      // Fallback: in-memory only (demo mode)
      console.warn('⚠️  MongoDB not connected — using in-memory store');
      room = memCreate({
        roomId,
        subject,
        topic,
        createdBy: creatorId.toString(),
        creatorName: creatorName,
        expiresAt
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        roomId:    room.roomId,
        subject:   room.subject,
        topic:     room.topic,
        creatorName: creatorName,
        expiresAt: room.expiresAt
      }
    });
  } catch (err) {
    console.error('CREATE room error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /api/join/:roomId — Join an existing room (Protected) ──────────────
router.post('/join/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const joinerId   = req.user._id;
    const joinerName = req.user.username;

    let room;

    if (dbReady()) {
      room = await Room.findOne({ roomId, isActive: true });
    } else {
      room = memFind(roomId);
    }

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found or expired' });
    }

    // Add participant (avoid duplicates by user ID)
    if (dbReady()) {
      const alreadyJoined = room.participants.some(
        p => p.user && p.user.toString() === joinerId.toString()
      );
      if (!alreadyJoined) {
        room.participants.push({
          user: joinerId,
          userName: joinerName,
          joinedAt: new Date()
        });
        await room.save();
      }
    } else {
      // In-memory fallback
      const alreadyJoined = room.participants.some(p => p.user === joinerId.toString());
      if (!alreadyJoined) {
        room.participants.push({
          user: joinerId.toString(),
          userName: joinerName,
          joinedAt: new Date()
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Room joined successfully',
      data: {
        roomId:           room.roomId,
        subject:          room.subject,
        topic:            room.topic,
        participantCount: (room.participants || []).length,
        joinedAs:         joinerName
      }
    });
  } catch (err) {
    console.error('JOIN room error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── GET /api/:roomId — Get room details (Protected) ─────────────────────────
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    let room;

    if (dbReady()) {
      room = await Room.findOne({ roomId, isActive: true });
    } else {
      room = memFind(roomId);
    }

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        roomId:           room.roomId,
        subject:          room.subject,
        topic:            room.topic,
        creatorName:      room.creatorName || 'Unknown',
        expiresAt:        room.expiresAt,
        participants:     (room.participants || []).map(p => ({
          userName: p.userName,
          joinedAt: p.joinedAt
        })),
        participantCount: (room.participants || []).length,
        messageCount:     (room.messages || []).length
      }
    });
  } catch (err) {
    console.error('GET room error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
