/**
 * StudySync — Chat.js
 * CO5: useState, useEffect, useRef hooks; CO6: socket.io real-time events
 */
import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

export default function Chat({ socket, roomId, userName }) {
  const [messages,    setMessages  ] = useState([]);
  const [input,       setInput     ] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping,    setIsTyping  ] = useState(false);
  const [collapsed,   setCollapsed ] = useState(false);
  const [unread,      setUnread    ] = useState(0);

  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);

  // CO6: Socket events
  useEffect(() => {
    if (!socket) return;

    socket.emit('get-chat-history', roomId);

    const onHistory = (hist) => {
      setMessages(hist);
    };

    const onReceive = (msg) => {
      setMessages(prev => [...prev, msg]);
      // Track unread when collapsed
      if (collapsed) {
        setUnread(prev => prev + 1);
      }
    };

    const onTyping = (user) => {
      setTypingUsers(prev => new Set([...prev, user]));
    };

    const onStopTyping = (user) => {
      setTypingUsers(prev => {
        const s = new Set(prev);
        s.delete(user);
        return s;
      });
    };

    socket.on('chat-history', onHistory);
    socket.on('receive-message', onReceive);
    socket.on('user-typing', onTyping);
    socket.on('user-stopped-typing', onStopTyping);

    return () => {
      socket.off('chat-history', onHistory);
      socket.off('receive-message', onReceive);
      socket.off('user-typing', onTyping);
      socket.off('user-stopped-typing', onStopTyping);
    };
  }, [socket, roomId, collapsed]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Clear unread when expanding
  function toggleChat() {
    setCollapsed(prev => {
      if (prev) setUnread(0); // opening: clear unread
      return !prev;
    });
  }

  function handleInput(e) {
    setInput(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing-start', { roomId, userName });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing-stop', { roomId, userName });
    }, 1200);
  }

  function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    socket.emit('send-message', { roomId, message: { userName, message: text } });
    setInput('');
    setIsTyping(false);
    socket.emit('typing-stop', { roomId, userName });
    clearTimeout(typingTimer.current);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  const typingArr = [...typingUsers];

  return (
    <div className={`chat-wrapper ${collapsed ? 'chat-wrapper--collapsed' : ''}`}>
      {/* Toggle button — always visible */}
      <button
        className="chat__toggle"
        onClick={toggleChat}
        title={collapsed ? 'Show Chat' : 'Hide Chat'}
        aria-label={collapsed ? 'Show Chat' : 'Hide Chat'}
      >
        <span className="chat__toggle-icon">
          {collapsed ? '💬' : '◂'}
        </span>
        {collapsed && unread > 0 && (
          <span className="chat__toggle-badge">{unread}</span>
        )}
      </button>

      <aside className="chat">
        <div className="chat__header">
          <span className="chat__title">Chat</span>
          <span className="chat__count">{messages.length}</span>
        </div>

        <div className="chat__messages">
          {messages.length === 0 && (
            <div className="chat__empty">
              No messages yet. Start the conversation!
            </div>
          )}
          {messages.map((msg, i) => {
            const own = msg.userName === userName;
            return (
              <div
                key={msg.id || i}
                className={`chat__msg ${own ? 'chat__msg--own' : ''}`}
              >
                <div className="chat__bubble">
                  <div className="chat__meta">
                    <span className="chat__name">{own ? 'You' : msg.userName}</span>
                    <span className="chat__time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="chat__text">{msg.message}</p>
                </div>
              </div>
            );
          })}

          {typingArr.length > 0 && (
            <div className="chat__typing">
              <span>
                {typingArr.join(', ')} {typingArr.length === 1 ? 'is' : 'are'} typing…
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form className="chat__form" onSubmit={handleSend}>
          <label htmlFor="chat-input" className="visually-hidden">Type a message…</label>
          <input
            id="chat-input"
            name="message"
            type="text"
            className="chat__input"
            placeholder="Type a message…"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            maxLength={500}
            autoComplete="off"
          />
          <button
            id="chat-send-btn"
            type="submit"
            className="chat__send"
            disabled={!input.trim()}
            aria-label="Send message"
          >
            ↑
          </button>
        </form>
      </aside>
    </div>
  );
}
