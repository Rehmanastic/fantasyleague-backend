import express from 'express';
import Player from '../models/Player.js';
import { authenticate } from './auth.js';

const router = express.Router();

// Get all players (filtered by user, or all if admin)
router.get('/', authenticate, async (req, res) => {
  try {
    // Admins can see all players, regular users only see their own
    const query = req.user.isAdmin ? {} : { createdBy: req.user.userId };
    const players = await Player.find(query)
      .sort({ country: 1, name: 1 });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get players by country
router.get('/country/:country', async (req, res) => {
  try {
    const players = await Player.find({ country: req.params.country }).sort({ name: 1 });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single player
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create player (Users can create their own players)
router.post('/', authenticate, async (req, res) => {
  try {
    const player = new Player({
      ...req.body,
      createdBy: req.user.userId
    });
    await player.save();
    res.status(201).json(player);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update player (Users can only update their own players)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const player = await Player.findOne({ 
      _id: req.params.id,
      createdBy: req.user.userId 
    });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found or unauthorized' });
    }

    Object.assign(player, req.body);
    await player.save();
    res.json(player);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete player (Users can only delete their own players)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const player = await Player.findOneAndDelete({ 
      _id: req.params.id,
      createdBy: req.user.userId 
    });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found or unauthorized' });
    }
    res.json({ message: 'Player deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
