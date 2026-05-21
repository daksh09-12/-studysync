/**
 * StudySync — socketHandler.js
 * CO2: Node.js event-driven architecture — main Socket.io orchestrator
 * Handles room join/leave and delegates feature events to sub-handlers
 * Secure Event Orchestration (SSDLC)
 */

'use strict';

const chatHandler       = require('./chatHandler');
const notesHandler      = require('./notesHandler');
const whiteboardHandler = require('./whiteboardHandler');

// In-memory room state — Maps roomId → Set of {socketId, userName}
const rooms = new Map();

/**
 * Get or create participant set for a room
 * @param {string} roomId
 * @returns {Set}
 */
function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  return rooms.get(roomId);
}

/**
 * Build serialisable participant list from a room's Set
 * @param {Set} roomSet
 * @returns {Array<{socketId, userName}>}
 */
function getParticipantList(roomSet) {
  return [...roomSet];
}

/**
 * Main Socket.io initialiser — called once from server.js
 * @param {Server} io
 */
function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (Authenticated as: ${socket.data.username})`);

    // ── JOIN ROOM (Secure: username extracted from Socket session) ──────────
    socket.on('join-room', ({ roomId }) => {
      if (!roomId) return;

      const userName = socket.data.username || 'Guest';
      socket.join(roomId);

      const participant = { socketId: socket.id, userName };
      getRoom(roomId).add(participant);

      // Store on socket for cleanup on disconnect
      socket.data.roomId      = roomId;
      socket.data.participant = participant;

      console.log(`👤 ${userName} joined room ${roomId}`);

      const participants = getParticipantList(getRoom(roomId));

      // Confirm to the joining client
      socket.emit('join-success', { roomId, participants });

      // Notify everyone else
      socket.to(roomId).emit('user-joined', {
        userName,
        participantCount: participants.length
      });

      // Broadcast updated participant list to the whole room
      io.to(roomId).emit('participants-update', participants);
    });

    // ── LEAVE ROOM (Secure: username extracted from Socket session) ─────────
    socket.on('leave-room', ({ roomId }) => {
      const userName = socket.data.username || 'Guest';
      handleLeave(socket, io, roomId, userName);
    });

    // ── DISCONNECT ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const { roomId, username, participant } = socket.data;
      const userName = username || 'Guest';
      
      if (roomId && participant) {
        getRoom(roomId).delete(participant);
        console.log(`❌ ${userName} disconnected from room ${roomId}`);
        const participants = getParticipantList(getRoom(roomId));
        io.to(roomId).emit('user-left', { userName, participantCount: participants.length });
        io.to(roomId).emit('participants-update', participants);
        if (participants.length === 0) {
          rooms.delete(roomId);
          console.log(`🗑  Room ${roomId} cleaned up (empty)`);
        }
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });

    // ── Delegate feature events to sub-handlers ────────────────────────────
    chatHandler(io, socket);
    notesHandler(io, socket);
    whiteboardHandler(io, socket);
  });
}

/**
 * Shared leave logic used by both 'leave-room' event and disconnect
 */
function handleLeave(socket, io, roomId, userName) {
  if (!roomId) return;
  socket.leave(roomId);
  const room = rooms.get(roomId);
  if (room) {
    room.forEach(p => { if (p.socketId === socket.id) room.delete(p); });
    const participants = getParticipantList(room);
    io.to(roomId).emit('user-left', { userName, participantCount: participants.length });
    io.to(roomId).emit('participants-update', participants);
    if (participants.length === 0) rooms.delete(roomId);
  }
}

module.exports = socketHandler;
