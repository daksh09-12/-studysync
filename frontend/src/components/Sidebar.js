/**
 * StudySync — Sidebar.js
 * CO5: React functional component, props
 */
import React from 'react';
import './Sidebar.css';

const MODES = [
  { id: 'whiteboard', icon: '🎨',  label: 'Whiteboard'  },
  { id: 'notes',      icon: '📝',  label: 'Notes'       },
];

export default function Sidebar({ currentMode, onModeChange }) {
  return (
    <nav className="sidebar" aria-label="Mode switcher">
      {MODES.map(({ id, icon, label }) => (
        <button
          key={id}
          id={`mode-${id}`}
          className={`sidebar__btn ${currentMode === id ? 'sidebar__btn--active' : ''}`}
          onClick={() => onModeChange(id)}
          title={label}
          aria-pressed={currentMode === id}
        >
          <span className="sidebar__icon" aria-hidden="true">{icon}</span>
          <span className="sidebar__label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
