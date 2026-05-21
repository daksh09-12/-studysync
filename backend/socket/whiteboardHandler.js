/**
 * StudySync — whiteboardHandler.js
 * CO2: Event-driven real-time whiteboard — draw, undo, clear
 */

'use strict';

// In-memory strokes: roomId → Array<stroke>
const boardStrokes = new Map();

function getStrokes(roomId) {
  if (!boardStrokes.has(roomId)) boardStrokes.set(roomId, []);
  return boardStrokes.get(roomId);
}

/**
 * @param {Server} io
 * @param {Socket} socket
 */
function whiteboardHandler(io, socket) {

  // Send full board state when client joins
  socket.on('get-whiteboard-state', (roomId) => {
    socket.emit('whiteboard-state', getStrokes(roomId));
  });

  // New drawing stroke
  socket.on('drawing', (data) => {
    const { roomId, x0, y0, x1, y1, color, size, strokeId, type, text } = data;
    if (!roomId) return;
    const stroke = { x0, y0, x1, y1, color, size, strokeId, type };
    if (text) stroke.text = text;
    getStrokes(roomId).push(stroke);
    socket.to(roomId).emit('draw-update', stroke);
  });

  // Undo last stroke
  socket.on('undo-stroke', (roomId) => {
    const strokes = getStrokes(roomId);
    if (strokes.length > 0) {
      const lastStrokeId = strokes[strokes.length - 1].strokeId;
      if (lastStrokeId) {
        // Filter out all segments matching the last strokeId
        const updated = strokes.filter(s => s.strokeId !== lastStrokeId);
        boardStrokes.set(roomId, updated);
        io.to(roomId).emit('whiteboard-state', updated);
      } else {
        strokes.pop();
        io.to(roomId).emit('whiteboard-state', strokes);
      }
    }
  });

  // Clear entire board
  socket.on('clear-board', (roomId) => {
    boardStrokes.set(roomId, []);
    io.to(roomId).emit('board-cleared');
  });
}

module.exports = whiteboardHandler;
