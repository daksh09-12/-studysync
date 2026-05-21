/**
 * StudySync — chatHandler.js
 * CO2: Event-driven real-time chat — messages and typing indicators
 * CO4: Messages are persisted to MongoDB (Room.messages[])
 * Secure Chat Implementation (SSDLC)
 */

'use strict';

const { nanoid } = require('nanoid');

// Mongoose + Room model for persistence
let Room;
try {
  Room = require('../models/Room');
} catch (_) {
  Room = null;
}

// In-memory fallback: roomId → Array<message>
const chatHistory = new Map();
const MAX_HISTORY = 200;

function getMemHistory(roomId) {
  if (!chatHistory.has(roomId)) chatHistory.set(roomId, []);
  return chatHistory.get(roomId);
}

/** Check if Mongoose is connected */
function dbReady() {
  try {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1 && Room;
  } catch (_) { return false; }
}

/**
 * @param {Server} io
 * @param {Socket} socket
 */
function chatHandler(io, socket) {

  // ── Send full chat history when a client joins ──────────────────────────
  socket.on('get-chat-history', async (roomId) => {
    try {
      if (dbReady()) {
        const room = await Room.findOne({ roomId, isActive: true }).lean();
        const history = room?.messages || [];
        socket.emit('chat-history', history);
      } else {
        socket.emit('chat-history', getMemHistory(roomId));
      }
    } catch (err) {
      console.error('❌ get-chat-history error:', err.message);
      socket.emit('chat-history', getMemHistory(roomId));
    }
  });

  // ── New message (Secure: username extracted from Socket session) ────────
  socket.on('send-message', async ({ roomId, message }) => {
    if (!roomId || !message?.message) return;

    // SSDLC: Use the session userName to prevent spoofing
    const verifiedUserName = socket.data.username || 'Guest';

    const msg = {
      id:        nanoid(8),
      userName:  verifiedUserName,
      message:   message.message.trim(),
      timestamp: new Date().toISOString()
    };

    // Persist to MongoDB
    try {
      if (dbReady()) {
        await Room.findOneAndUpdate(
          { roomId, isActive: true },
          {
            $push: {
              messages: {
                $each:  [msg],
                $slice: -MAX_HISTORY
              }
            }
          }
        );
      }
    } catch (err) {
      console.error('❌ save-message error:', err.message);
    }

    // Keep in-memory for fallback
    const history = getMemHistory(roomId);
    history.push(msg);
    if (history.length > MAX_HISTORY) history.shift();

    // Broadcast to ALL in room
    io.to(roomId).emit('receive-message', msg);
  });

  // ── Typing started (Secure: username extracted from Socket session) ─────
  socket.on('typing-start', ({ roomId }) => {
    const userName = socket.data.username || 'Guest';
    if (!roomId) return;
    socket.to(roomId).emit('user-typing', userName);
  });

  // ── Typing stopped (Secure: username extracted from Socket session) ─────
  socket.on('typing-stop', ({ roomId }) => {
    const userName = socket.data.username || 'Guest';
    if (!roomId) return;
    socket.to(roomId).emit('user-stopped-typing', userName);
  });
}

module.exports = chatHandler;
