/**
 * StudySync — Home.js
 * User Dashboard & Room Management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createRoom, joinRoom, getMyRooms } from '../utils/api';
import './Home.css';

const SUBJECT_OPTIONS = [
  { id: 'Web Development', label: 'Web Dev', icon: '🌐', color: 'rgba(59, 130, 246, 0.15)' },
  { id: 'Artificial Intelligence', label: 'AI & ML', icon: '🤖', color: 'rgba(139, 92, 246, 0.15)' },
  { id: 'Data Science', label: 'Data Science', icon: '📊', color: 'rgba(16, 185, 129, 0.15)' },
  { id: 'Mathematics', label: 'Mathematics', icon: '📐', color: 'rgba(245, 158, 11, 0.15)' },
  { id: 'Computer Systems', label: 'Systems', icon: '💻', color: 'rgba(239, 68, 68, 0.15)' }
];

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Create Room State
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0].id);
  const [topic, setTopic]     = useState('');
  const [createErr, setCreateErr] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Join Room State
  const [roomIdInput, setRoomIdInput] = useState('');
  const [joinErr, setJoinErr] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // User's Rooms
  const [myRooms, setMyRooms] = useState([]);
  const [myRoomsLoading, setMyRoomsLoading] = useState(true);

  // Fetch user's active rooms
  useEffect(() => {
    async function fetchMyRooms() {
      try {
        const res = await getMyRooms();
        if (res.success && res.data) {
          setMyRooms(res.data);
        }
      } catch (err) {
        console.error('Failed to load my rooms:', err.message);
      } finally {
        setMyRoomsLoading(false);
      }
    }
    fetchMyRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreateErr('');
    if (!topic.trim()) {
      setCreateErr('Topic is required');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await createRoom({ subject, topic: topic.trim() });
      if (res.success && res.data) {
        navigate(`/room/${res.data.roomId}`);
      }
    } catch (err) {
      setCreateErr(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setJoinErr('');
    const id = roomIdInput.trim().toUpperCase();
    if (!id) {
      setJoinErr('Room ID is required');
      return;
    }

    setJoinLoading(true);
    try {
      const res = await joinRoom(id);
      if (res.success && res.data) {
        navigate(`/room/${res.data.roomId}`);
      }
    } catch (err) {
      setJoinErr(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="dashboard-page">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="dashboard-header glass-panel">
        <div className="dashboard-header__left">
          <span className="brand-icon">⚡</span>
          <h1 className="brand-logo">StudySync</h1>
        </div>

        <div className="dashboard-header__right">
          <div className="user-badge">
            <div className="user-badge__avatar">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-badge__info">
              <span className="user-badge__name">{user?.username}</span>
              <span className="user-badge__role">Student</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary btn-logout">
            Logout
          </button>
        </div>
      </header>

      {/* ── CONTENT GRID ────────────────────────────────────────────────── */}
      <main className="dashboard-container">
        <div className="dashboard-grid">
          
          {/* Left Panel: Creator & Joiner */}
          <div className="dashboard-left-col">
            
            {/* Create Room Panel */}
            <div className="dashboard-card glass-panel">
              <h2 className="card-title">🚀 Create Study Room</h2>
              <p className="card-description">Start a live space. Invited peers join instantly via code.</p>

              {createErr && <div className="panel-error">⚠️ {createErr}</div>}

              <form onSubmit={handleCreateRoom} className="dashboard-form">
                <div className="form-group">
                  <label>Select Course Field</label>
                  <div className="subject-selectors">
                    {SUBJECT_OPTIONS.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        className={`subject-pill ${subject === sub.id ? 'subject-pill--active' : ''}`}
                        onClick={() => setSubject(sub.id)}
                        style={{ '--pill-color': sub.color }}
                      >
                        <span className="subject-pill__icon">{sub.icon}</span>
                        <span className="subject-pill__label">{sub.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="topic-input">Study Topic / Chapter</label>
                  <input
                    id="topic-input"
                    type="text"
                    placeholder="e.g., Session 4: Designing REST endpoints"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    maxLength={150}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-primary form-submit"
                  disabled={createLoading}
                >
                  {createLoading && <span className="btn-spinner" />}
                  {createLoading ? 'Building Room…' : 'Launch Session'}
                </button>
              </form>
            </div>

            {/* Join Room Panel */}
            <div className="dashboard-card glass-panel">
              <h2 className="card-title">🔑 Enter Study Space</h2>
              <p className="card-description">Paste a 6-character room access code below to join peers.</p>

              {joinErr && <div className="panel-error">⚠️ {joinErr}</div>}

              <form onSubmit={handleJoinRoom} className="dashboard-form join-form-inline">
                <input
                  type="text"
                  placeholder="CODE (e.g., AD3E7G)"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  maxLength={6}
                  required
                  className="code-input"
                />
                <button 
                  type="submit" 
                  className="btn-primary join-submit"
                  disabled={joinLoading}
                >
                  {joinLoading && <span className="btn-spinner" />}
                  {joinLoading ? 'Joining…' : 'Join'}
                </button>
              </form>
            </div>

          </div>

          {/* Right Panel: User's Rooms and Statistics */}
          <div className="dashboard-right-col">
            
            {/* Stats Summary */}
            <div className="stats-strip glass-panel">
              <div className="stat-card">
                <span className="stat-card__val">{myRooms.length}</span>
                <span className="stat-card__lbl">Rooms Created</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__val">24h</span>
                <span className="stat-card__lbl">Session Limit</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__val">Active</span>
                <span className="stat-card__lbl">Account Status</span>
              </div>
            </div>

            {/* My Active Rooms List */}
            <div className="dashboard-card my-rooms-card glass-panel">
              <h2 className="card-title">📖 Your Active Rooms</h2>
              <p className="card-description">Quickly resume your currently running workspace collaborations.</p>

              {myRoomsLoading ? (
                <div className="my-rooms-spinner-wrap">
                  <div className="spinner" />
                </div>
              ) : myRooms.length === 0 ? (
                <div className="my-rooms-empty">
                  <span className="empty-icon">📂</span>
                  <h3>No Active Spaces</h3>
                  <p>Rooms you create will list here for 24 hours until expiration.</p>
                </div>
              ) : (
                <div className="my-rooms-list">
                  {myRooms.map((room) => (
                    <div 
                      key={room.roomId} 
                      className="room-list-item"
                      onClick={() => navigate(`/room/${room.roomId}`)}
                    >
                      <div className="room-list-item__left">
                        <div className="room-list-item__subj-tag">
                          {room.subject}
                        </div>
                        <h4 className="room-list-item__topic">{room.topic}</h4>
                        <div className="room-list-item__meta">
                          <span>⏱ Expires: {new Date(room.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span>👥 {room.participantCount} active</span>
                        </div>
                      </div>
                      <div className="room-list-item__right">
                        <span className="room-code-tag">{room.roomId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
