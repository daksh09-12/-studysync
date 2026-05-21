/**
 * StudySync — useSocket.js
 * CO5: Custom React Hook (useState, useEffect)
 * CO6: Socket.io-client — WebSocket real-time connection
 * Secure WebSocket Handshake Credentials (SSDLC)
 */
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

export function useSocket(roomId, userName) {
  const [socket, setSocket]           = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId || !userName) return;

    // CO6: Create WebSocket connection
    const newSocket = io(SOCKET_URL, {
      transports:           ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
      auth: {
        username: userName
      },
      withCredentials:      true // Crucial: Transmit the HttpOnly session cookie during handshake (SSDLC)
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Socket connected:', newSocket.id);
      
      // Join room (identity resolved securely on the server via JWT)
      newSocket.emit('join-room', { roomId });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Socket disconnected');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });

    // Room events
    newSocket.on('join-success', ({ participants: list }) => {
      setParticipants(list);
    });

    newSocket.on('participants-update', (list) => {
      setParticipants(list);
    });

    // Cleanup on unmount
    return () => {
      newSocket.emit('leave-room', { roomId });
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userName]);

  return { socket, participants, isConnected };
}
