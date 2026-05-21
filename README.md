# StudySync — Real-time Collaborative Study Platform

StudySync is a full-stack, real-time collaborative platform designed to facilitate group studying and virtual classrooms. It integrates shared whiteboard sketching, collaborative document editing, real-time chat, and room management in a cohesive single-page application.

---

## 🌟 Key Features

1. **Shared Workspace Rooms**: Group-centric study sessions with dynamically generated access IDs (via `nanoid`).
2. **Collaborative Whiteboard**: An interactive HTML5 canvas featuring:
   - Freehand pen sketching and variable brush thickness.
   - Drawing tools for flowchart shapes (Rectangles, Circles, Diamonds, Arrows).
   - Pan and zoom canvas exploration with a reset HUD.
   - Live synchronization of brush strokes/shapes across room participants.
   - Snapshot exports (download as PNG).
   - Canvas-wide clear and stroke-level undo controls.
3. **Collaborative Notes Editor**: Real-time rich-text markdown-like editor featuring:
   - Debounced socket synchronization (400ms typing delay to optimize network payload).
   - Live word count tracking.
   - PDF document generation and export (via `jsPDF`).
4. **Live Group Chat**: Instanced room chat with automated join/leave notifications and timestamped messages.
5. **Secure Authentication**:
   - HTTP-only JWT-based session cookies.
   - Helmet protection headers (custom CSP policies for WebSockets and fonts).
   - Brute force protection via `express-rate-limit` for login/registration endpoints.
   - Mongoose schemas with password hashing via `bcryptjs`.
6. **Graceful Failbacks**: Integrated backend capabilities to switch to an in-memory database configuration if MongoDB is unavailable.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18
- **Routing**: React Router DOM (v6)
- **Networking**: Axios (HTTP) & Socket.io-client (WebSockets)
- **Utilities**: `jsPDF` (Export to PDF)
- **Styling**: Modular Vanilla CSS

### Backend
- **Runtime**: Node.js & Express
- **Real-time Engine**: Socket.io
- **Database**: MongoDB & Mongoose ORM
- **Security**: Helmet, Express Rate Limit, Cookies, JSON Web Tokens (JWT), BCryptJS

---

## 📂 Project Structure

```text
240840131096_Studysync/
├── backend/
│   ├── middleware/        # Authentication & validation middleware
│   ├── models/            # MongoDB/Mongoose User & Room models
│   ├── routes/            # REST API controllers (Auth & Room CRUD)
│   ├── socket/            # Real-time WebSocket handlers (Canvas, Chat, Notes)
│   ├── server.js          # App entrypoint (Express initialization & WebSockets)
│   └── package.json
└── frontend/
    ├── public/            # Static assets
    ├── src/
    │   ├── components/    # Reusable widgets (Chat, Notes, Whiteboard, Sidebar)
    │   ├── context/       # React Context Providers (AuthContext)
    │   ├── hooks/         # Custom React hooks (useDebounce)
    │   ├── pages/         # Page components (Auth, Home, Room)
    │   ├── styles/        # Shared stylesheets
    │   ├── utils/         # Utility functions
    │   ├── App.js         # Frontend routing configurations
    │   └── index.js       # React client entry point
    └── package.json
```

---

## 🚀 Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local server or MongoDB Atlas cluster URI)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5001
   MONGO_URI=mongodb://localhost:24017/studysync  # or your Atlas URI
   JWT_SECRET=your_super_secret_key_here
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```
4. Start the server:
   - For production: `npm start`
   - For local development: `npm run dev`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```

The application will launch on `http://localhost:3000` and communicate with the API on `http://localhost:5001`.

---

## 🔒 Security Practices & SDLC

- **Secure Session Handshake**: Real-time Socket.io handshakes parse cookies directly to validate JWT credentials before establishing a connection.
- **DDoS Mitigation**: Limits auth endpoint requests (e.g., maximum 100 requests per 15 minutes) and general endpoints to 1000 requests per 15 minutes.
- **Input Sanitization**: Rejects paths containing dangerous characters and escapes credentials.
- **Data Protection**: Transmits auth credentials only via httpOnly cookies.
