/**
 * StudySync — Room.js
 * CO5: React hooks (useState, useEffect, useParams, useLocation), props, component lifecycle
 * Protected session details integrated (SSDLC)
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { getRoom } from '../utils/api';
import Sidebar    from '../components/Sidebar';
import Whiteboard from '../components/Whiteboard';
import Notes      from '../components/Notes';
import Chat       from '../components/Chat';
import './Room.css';

export default function Room() {
  const { roomId }   = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  
  // SSDLC: Use the authenticated username from global Auth context
  const userName     = user?.username || 'Guest';

  const [roomData, setRoomData] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [mode,     setMode]     = useState('whiteboard');  // 'whiteboard' | 'notes'

  // CO6: WebSocket hook (withCredentials session passed inside useSocket)
  const { socket, participants, isConnected } = useSocket(roomId, userName);

  // CO5: useEffect — fetch room on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchRoom() {
      try {
        const res = await getRoom(roomId);
        if (!cancelled) setRoomData(res.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRoom();
    return () => { cancelled = true; };
  }, [roomId]);

  function handleLeave() {
    socket?.emit('leave-room', { roomId });
    navigate('/');
  }

  // ── Copy room ID to clipboard
  function handleCopyId() {
    navigator.clipboard.writeText(roomId)
      .then(() => alert(`Access Code "${roomId}" copied!`))
      .catch(() => {});
  }

  if (loading) return (
    <div className="room-loading">
      <div className="spinner" />
      <p>Configuring secure workspace…</p>
    </div>
  );

  if (error) return (
    <div className="room-error">
      <h2>⚠️ {error}</h2>
      <p>The space you requested might have expired or does not exist.</p>
      <button className="btn-primary" onClick={() => navigate('/')}>← Return to Dashboard</button>
    </div>
  );

  return (
    <div className="room">

      {/* ── Header — Premium Single line ──────── */}
      <header className="room__header glass-panel">
        <div className="room__header-left">
          <span className="room__brand">⚡ StudySync</span>
          <div className="room__title-group">
            <span className="room__title-sep">/</span>
            <div className="room__title">
              <span className="room__subject-badge">{roomData?.subject}</span>
              <span className="room__topic">{roomData?.topic}</span>
            </div>
            <button
              id="copy-room-id-btn"
              className="room__code-btn"
              onClick={handleCopyId}
              title="Click to copy Room Code"
            >
              {roomId} 📋
            </button>
          </div>
        </div>

        <div className="room__header-right">
          <div className={`room__conn ${isConnected ? 'room__conn--on' : 'room__conn--off'}`}>
            <span className="room__conn-dot" />
            {isConnected ? 'Connected' : 'Connecting…'}
          </div>
          <button
            id="leave-btn"
            className="room__leave-btn"
            onClick={handleLeave}
          >
            Leave Space
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────── */}
      <div className="room__body">

        {/* Sidebar — Navigation controls */}
        <Sidebar currentMode={mode} onModeChange={setMode} />

        {/* Main workspace (collaborative views) */}
        <main className="room__workspace">
          {mode === 'whiteboard' && socket && <Whiteboard socket={socket} roomId={roomId} userName={userName} />}
          {mode === 'notes'      && socket && <Notes      socket={socket} roomId={roomId} userName={userName} />}
        </main>

        {/* Chat panel */}
        {socket && <Chat socket={socket} roomId={roomId} userName={userName} />}

      </div>

      {/* ── Floating Participant list tray ────────────────── */}
      {participants.length > 0 && (
        <aside className="room__participants glass-panel">
          <p className="room__participants-title">Collaborators ({participants.length})</p>
          <div className="room__participants-list">
            {participants.map((p, i) => (
              <div key={p.socketId || i} className="room__participant">
                <div
                  className="room__participant-avatar"
                  style={{ background: avatarColor(p.userName) }}
                >
                  {p.userName.substring(0, 2).toUpperCase()}
                </div>
                <span className="room__participant-name">
                  {p.userName} {p.userName === userName ? ' (You)' : ''}
                </span>
              </div>
            ))}
          </div>
        </aside>
      )}

    </div>
  );
}

const AVATAR_COLORS = ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#6C757D'];

function avatarColor(name = '') {
  const code = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}
