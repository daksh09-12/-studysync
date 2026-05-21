/**
 * StudySync — canvasHandler.js
 * CO2: Event-driven — infinite canvas card events (create/move/update/delete)
 * State is kept in-memory per room; MongoDB sync on significant events.
 */

'use strict';

// In-memory store: roomId → Map<cardId, card>
const canvasRooms = new Map();

function getRoomCards(roomId) {
  if (!canvasRooms.has(roomId)) canvasRooms.set(roomId, new Map());
  return canvasRooms.get(roomId);
}

/**
 * @param {Server} io
 * @param {Socket} socket
 */
function canvasHandler(io, socket) {

  // Client requests current canvas state when they join
  socket.on('get-canvas-state', (roomId) => {
    const cards = [...getRoomCards(roomId).values()];
    socket.emit('canvas-state', cards);
  });

  // Create a new card
  socket.on('create-card', ({ roomId, card }) => {
    if (!roomId || !card?.id) return;
    getRoomCards(roomId).set(card.id, card);
    // Broadcast to ALL in room (including sender) so state stays consistent
    io.to(roomId).emit('card-created', card);
  });

  // Move a card (drag)
  socket.on('move-card', ({ roomId, cardId, x, y }) => {
    if (!roomId || !cardId) return;
    const cards = getRoomCards(roomId);
    if (cards.has(cardId)) {
      cards.set(cardId, { ...cards.get(cardId), x, y });
    }
    // Broadcast to OTHER clients only (sender already moved it locally)
    socket.to(roomId).emit('card-moved', { cardId, x, y });
  });

  // Update card content (text edit)
  socket.on('update-card', ({ roomId, cardId, content }) => {
    if (!roomId || !cardId) return;
    const cards = getRoomCards(roomId);
    if (cards.has(cardId)) {
      cards.set(cardId, { ...cards.get(cardId), content });
    }
    socket.to(roomId).emit('card-updated', { cardId, content });
  });

  // Delete a card
  socket.on('delete-card', ({ roomId, cardId }) => {
    if (!roomId || !cardId) return;
    getRoomCards(roomId).delete(cardId);
    io.to(roomId).emit('card-deleted', cardId);
  });
}

module.exports = canvasHandler;
