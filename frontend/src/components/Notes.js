/**
 * StudySync — Notes.js
 * CO5: useEffect, useState, custom hooks; CO1: Debounce, ES6+
 * CO6: Socket.io auto-save sync; PDF export with jsPDF
 */
import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { jsPDF } from 'jspdf';
import './Notes.css';

export default function Notes({ socket, roomId, userName }) {
  const [content,   setContent]  = useState('');
  const [saved,     setSaved]    = useState(null); // Date of last save
  const [wordCount, setWordCount] = useState(0);

  // CO1: Debounce — only sync after 400ms pause in typing
  const debouncedContent = useDebounce(content, 400);

  // Load notes on mount
  useEffect(() => {
    if (!socket) return;
    socket.emit('get-notes', roomId);

    socket.on('notes-sync',    text => { setContent(text); countWords(text); });
    socket.on('notes-updated', text => { setContent(text); countWords(text); });

    return () => {
      socket.off('notes-sync');
      socket.off('notes-updated');
    };
  }, [socket, roomId]);

  // CO6: Sync to server after debounce
  useEffect(() => {
    if (debouncedContent === undefined) return;
    if (!socket) return;
    socket.emit('update-notes', { roomId, notes: debouncedContent, userName });
    setSaved(new Date());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent]);

  function handleChange(e) {
    setContent(e.target.value);
    countWords(e.target.value);
  }

  function countWords(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }

  function handleExportPDF() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('StudySync Notes', 20, 20);

    // Room info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Room: ${roomId}   Exported: ${new Date().toLocaleString()}`, 20, 28);

    // Line
    doc.setDrawColor(180);
    doc.line(20, 32, 190, 32);

    // Content
    doc.setFontSize(12);
    doc.setTextColor(30);
    const lines = doc.splitTextToSize(content || '(no content)', 170);
    doc.text(lines, 20, 42);

    doc.save(`studysync-notes-${roomId}.pdf`);
  }

  return (
    <div className="notes">
      <div className="notes__header">
        <div className="notes__title-group">
          <h3 className="notes__title">Shared Notes</h3>
          <span className="notes__wc">{wordCount} words</span>
        </div>

        <div className="notes__actions">
          {saved && (
            <span className="notes__saved">
              Saved {saved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            id="export-pdf-btn"
            className="notes__export-btn"
            onClick={handleExportPDF}
            title="Export to PDF"
          >
            Export PDF
          </button>
        </div>
      </div>

      <label htmlFor="notes-editor" className="visually-hidden">Notes Editor</label>
      <textarea
        id="notes-editor"
        name="notes"
        className="notes__editor"
        value={content}
        onChange={handleChange}
        placeholder="Start writing…"
        spellCheck
      />
    </div>
  );
}
