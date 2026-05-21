/**
 * StudySync — notesHandler.js
 * CO2: Event-driven collaborative notes — auto-save sync across all clients
 */

'use strict';

// In-memory notes: roomId → string
const notesStore = new Map();

/**
 * @param {Server} io
 * @param {Socket} socket
 */
function notesHandler(io, socket) {

  // Send current notes when client joins
  socket.on('get-notes', (roomId) => {
    socket.emit('notes-sync', notesStore.get(roomId) || '');
  });

  // Client sends updated notes (after debounce on frontend)
  socket.on('update-notes', ({ roomId, notes }) => {
    if (!roomId) return;
    notesStore.set(roomId, notes ?? '');
    // Broadcast to all OTHER clients in the room
    socket.to(roomId).emit('notes-updated', notes);
  });
}

module.exports = notesHandler;
