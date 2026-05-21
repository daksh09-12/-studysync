/**
 * StudySync — FloatingCard.js
 * CO5: useRef, useEffect, useState — draggable card component
 * CO1: ES6 — destructuring, arrow functions, spread operator
 *
 * Drag logic accounts for the parent layer's CSS transform
 * (translate + scale) so cards move freely on the infinite canvas.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './FloatingCard.css';

export default function FloatingCard({ card, onDrag, onUpdate, onDelete, pan, scale }) {
  const [position, setPosition] = useState({ x: card.x, y: card.y });
  const [content,  setContent]  = useState(card.content);
  const [dragging, setDragging] = useState(false);

  const dragStart = useRef({ mouseX: 0, mouseY: 0, cardX: 0, cardY: 0 });
  const cardRef   = useRef(null);

  // Sync position from server (other users moving)
  useEffect(() => {
    if (!dragging) setPosition({ x: card.x, y: card.y });
  }, [card.x, card.y, dragging]);

  // Sync content from server (other users typing)
  useEffect(() => {
    setContent(card.content);
  }, [card.content]);

  // Stable onDrag ref to avoid re-creating listeners
  const onDragRef = useRef(onDrag);
  useEffect(() => { onDragRef.current = onDrag; }, [onDrag]);

  // ── Start drag — only from the drag-handle areas ────────
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      cardX:  position.x,
      cardY:  position.y
    };
  }, [position.x, position.y]);

  // ── Global mouse move / up while dragging ───────────────
  useEffect(() => {
    if (!dragging) return;

    const s = scale ?? 1;

    function onMove(e) {
      e.preventDefault();
      const dx = (e.clientX - dragStart.current.mouseX) / s;
      const dy = (e.clientY - dragStart.current.mouseY) / s;
      setPosition({
        x: dragStart.current.cardX + dx,
        y: dragStart.current.cardY + dy
      });
    }

    function onUp(e) {
      const dx = (e.clientX - dragStart.current.mouseX) / s;
      const dy = (e.clientY - dragStart.current.mouseY) / s;
      const newX = dragStart.current.cardX + dx;
      const newY = dragStart.current.cardY + dy;
      setDragging(false);
      setPosition({ x: newX, y: newY });
      onDragRef.current(card.id, newX, newY);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, [dragging, card.id, scale]);

  // ── Content save on blur ────────────────────────────────
  function handleBlur() {
    if (content !== card.content) onUpdate(card.id, content);
  }

  return (
    <div
      ref={cardRef}
      className={`fcard ${dragging ? 'fcard--dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top:  `${position.y}px`,
      }}
    >
      {/* ── Drag handle (header) ── */}
      <div className="fcard__header" onMouseDown={handleDragStart}>
        <span className="fcard__type">{card.type}</span>
        <span className="fcard__drag-hint">⠿</span>
        <button
          className="fcard__delete"
          onClick={() => onDelete(card.id)}
          onMouseDown={e => e.stopPropagation()}
          title="Delete card"
          aria-label="Delete card"
        >
          ×
        </button>
      </div>

      {/* ── Editable body — click to type, NOT draggable ── */}
      <label htmlFor={`fcard-body-${card.id}`} className="visually-hidden">Card Content</label>
      <textarea
        id={`fcard-body-${card.id}`}
        name="cardContent"
        className="fcard__body"
        value={content}
        onChange={e => setContent(e.target.value)}
        onBlur={handleBlur}
        placeholder="Type here…"
        spellCheck={false}
      />

      {/* ── Footer — also a drag handle ── */}
      <div className="fcard__footer" onMouseDown={handleDragStart}>
        by {card.createdBy}
      </div>
    </div>
  );
}
