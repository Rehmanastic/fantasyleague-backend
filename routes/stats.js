import express from 'express';
import PlayerStats from '../models/PlayerStats.js';
import { calculateTotalPoints } from '../utils/scoring.js';

const router = express.Router();

// Get all stats
router.get('/', async (req, res) => {
  try {
    const stats = await PlayerStats.find()
      .populate('matchId')
      .populate('playerId')
      .sort({ matchId: -1, fantasyPoints: -1 });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats by match
router.get('/match/:matchId', async (req, res) => {
  try {
    const stats = await PlayerStats.find({ matchId: req.params.matchId })
      .populate('playerId')
      .sort({ fantasyPoints: -1 });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats by player
router.get('/player/:playerId', async (req, res) => {
  try {
    const stats = await PlayerStats.find({ playerId: req.params.playerId })
      .populate('matchId')
      .sort({ matchId: -1 });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update player stats (Admin only)
router.post('/', async (req, res) => {
  try {
    const { matchId, playerId, ...statData } = req.body;

    // Calculate fantasy points
    const fantasyPoints = calculateTotalPoints(statData);

    // Check if stats already exist
    let stats = await PlayerStats.findOne({ matchId, playerId });

    if (stats) {
      // Update existing stats
      Object.assign(stats, statData, { fantasyPoints });
      await stats.save();
    } else {
      // Create new stats
      stats = new PlayerStats({
        matchId,
        playerId,
        ...statData,
        fantasyPoints
      });
      await stats.save();
    }

    const populatedStats = await PlayerStats.findById(stats._id)
      .populate('matchId')
      .populate('playerId');

    const io = req.app.get('io');
    io.emit('statsUpdated', populatedStats);
    res.json(populatedStats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update player stats
router.put('/:id', async (req, res) => {
  try {
    const stats = await PlayerStats.findById(req.params.id);
    if (!stats) {
      return res.status(404).json({ error: 'Stats not found' });
    }

    // Update stats
    Object.assign(stats, req.body);
    
    // Recalculate fantasy points
    stats.fantasyPoints = calculateTotalPoints(stats);
    await stats.save();

    const populatedStats = await PlayerStats.findById(stats._id)
      .populate('matchId')
      .populate('playerId');

    const io = req.app.get('io');
    io.emit('statsUpdated', populatedStats);
    res.json(populatedStats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete player stats
router.delete('/:id', async (req, res) => {
  try {
    const stats = await PlayerStats.findByIdAndDelete(req.params.id);
    if (!stats) {
      return res.status(404).json({ error: 'Stats not found' });
    }
    const io = req.app.get('io');
    io.emit('statsDeleted', req.params.id);
    res.json({ message: 'Stats deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
