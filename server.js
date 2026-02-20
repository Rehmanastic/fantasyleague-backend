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
    // Hardcode the array to be 100% sure, no trailing slashes
    origin: [
      "https://fantasyleague-frontend.vercel.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  // Add these for production stability
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
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
// Update the Express CORS as well
app.use(cors({
  origin: ["https://fantasyleague-frontend.vercel.app", "http://localhost:5173"],
  credentials: true
}));

// server.js

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI is not defined in environment variables!");
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    // Important: Don't kill the process, let the server try to run
  });

// Ensure your listen is outside the .then() block
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
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
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
// server.js


// IMPORTANT: Bind to 0.0.0.0
