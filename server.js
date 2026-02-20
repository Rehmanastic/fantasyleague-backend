import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import matchRoutes from './routes/matches.js';
import playerRoutes from './routes/players.js';
import teamRoutes from './routes/teams.js';
import statsRoutes from './routes/stats.js';
import leaderboardRoutes from './routes/leaderboard.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
// server.js

// 1. Clean the FRONTEND_URL to prevent trailing slash issues
const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const FRONTEND_URL = rawFrontendUrl.replace(/\/$/, ""); // Removes any trailing /

console.log('Allowing CORS for:', FRONTEND_URL);

// 2. Optimized Socket.IO for Railway
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Railway/Vercel specific: Increase stability over proxies
  pingTimeout: 60000, 
  pingInterval: 25000,
  connectTimeout: 45000,
  transports: ['polling', 'websocket'], // Allow polling for the initial handshake
  allowEIO3: true
});

// 3. Express CORS middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// ... (rest of your routes)



// ✅ Use dynamic FRONTEND_URL for both local and production

// Socket.IO setup

// Middleware for REST API
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true, // needed if you use cookies/auth headers
}));
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Fantasy Cricket Backend is running 🚀',
    status: 'OK',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available in routes
app.set('io', io);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-cricket')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };