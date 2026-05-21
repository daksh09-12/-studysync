/**
 * StudySync — server.js
 * CO2: Node.js event-driven architecture
 * CO3: Express.js framework — middleware, routing, error handling
 * Secure Application Initialization (SSDLC)
 */

'use strict';

// ── 1. Imports ─────────────────────────────────────────────────────────────
const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const mongoose     = require('mongoose');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
require('dotenv').config();

const { verifyToken } = require('./middleware/authMiddleware');
const User = require('./models/User');

// ── 2. Express + HTTP server ────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── 3. CORS origins (supports comma-separated FRONTEND_URL) ─────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim());

// ── 4. Security Middlewares (SSDLC) ─────────────────────────────────────────
// Helmet security headers (configured to allow WebSockets and styles)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:5001", "ws://localhost:5001", "wss://*", "https://*"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
    }
  }
}));

// Cookie Parser for HttpOnly cookies
app.use(cookieParser());

// CORS configuration supporting credentials
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware (sanitized outputs)
app.use((req, _res, next) => {
  const sanitizedPath = req.path.replace(/[^\w\/\.\-]/g, '');
  console.log(`[${new Date().toISOString()}] ${req.method} ${sanitizedPath}`);
  next();
});

// ── 5. Rate Limiters (SSDLC: Brute force & DDoS mitigation) ────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // max 100 requests per window
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // max 1000 requests per 15 mins
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);

// ── 6. MongoDB connection (CO4: NoSQL database) ─────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('⚠️  MongoDB connection failed (running in-memory mode):', err.message);
  });

// ── 7. Socket.io (CO2: event-driven real-time communication) ───────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Helper to parse cookie headers manually (avoiding extra socket dependencies)
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    const val = parts.slice(1).join('=');
    cookies[name] = decodeURIComponent(val);
  });
  return cookies;
}

// Socket.io security middleware (Handshake Authentication)
io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    const cookies = parseCookies(cookieHeader);
    
    // Accept token from cookie or fallback query param during connection
    const token = cookies.token || socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }

    // Attach user metadata to socket
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      // Allow fallback in development if MongoDB is down, otherwise reject
      if (process.env.NODE_ENV === 'production') {
        return next(new Error('Authentication error: Account not found'));
      }
    }

    socket.data.userId = decoded.id;
    socket.data.username = user ? user.username : 'Guest';
    next();
  } catch (err) {
    return next(new Error('Authentication error: ' + err.message));
  }
});

// ── 8. Routes (CO3: RESTful API) ───────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');

app.get('/', (_req, res) => {
  res.json({
    message: 'StudySync API',
    version: '1.0.0',
    status: 'running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', roomRoutes);

// ── 9. Socket.io handlers (CO2: event-driven architecture) ─────────────────
const socketHandler = require('./socket/socketHandler');
socketHandler(io);
console.log('✅ Socket.io handlers registered');

// ── 10. 404 handler ────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── 11. Global error handler (CO3: error handling middleware) ───────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err.stack);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({ 
    success: false, 
    message: isDev ? err.message : 'Internal server error' 
  });
});

// ── 12. Start server ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 StudySync server running → http://localhost:${PORT}`);
});

// ── 13. Graceful shutdown ───────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('⏹  SIGTERM received — closing server');
  server.close(() => mongoose.connection.close());
});
