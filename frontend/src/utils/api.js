/**
 * StudySync — api.js
 * CO5: Async/await, ES6+ modules (CO1)
 * CO3: Consuming the Express REST API
 * Security credentials enabled (SSDLC)
 */
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: BASE,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // Crucial for sending/receiving HttpOnly cookies (SSDLC)
});

// Interceptor to inject x-username header
api.interceptors.request.use((config) => {
  const userJson = localStorage.getItem('studysync_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.username) {
        config.headers['x-username'] = user.username;
      }
    } catch (_) {}
  }
  return config;
});

// Uniform error extraction
function extractError(err) {
  return err?.response?.data?.message || err?.message || 'Unknown error';
}

// ══════════════════════════════════════════════════════════════
// AUTH API
// ══════════════════════════════════════════════════════════════

/** POST /api/auth/register */
export async function registerUser({ username, email, password }) {
  try {
    const { data } = await api.post('/auth/register', { username, email, password });
    return data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/** POST /api/auth/login */
export async function loginUser({ emailOrUsername, password }) {
  try {
    const { data } = await api.post('/auth/login', { emailOrUsername, password });
    return data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/** POST /api/auth/logout */
export async function logoutUser() {
  try {
    const { data } = await api.post('/auth/logout');
    return data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/** GET /api/auth/me */
export async function getMe() {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

// ══════════════════════════════════════════════════════════════
// ROOM API
// ══════════════════════════════════════════════════════════════

/** POST /api/create */
export async function createRoom({ subject, topic }) {
  try {
    const { data } = await api.post('/create', { subject, topic });
    return data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/** POST /api/join/:roomId */
export async function joinRoom(roomId) {
  try {
    const { data } = await api.post(`/join/${roomId}`);
    return data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/** GET /api/:roomId */
export async function getRoom(roomId) {
  try {
    const { data } = await api.get(`/${roomId}`);
    return data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/** GET /api/my-rooms */
export async function getMyRooms() {
  try {
    const { data } = await api.get('/my-rooms');
    return data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}
