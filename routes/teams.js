import express from 'express';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import { authenticate } from './auth.js';

const router = express.Router();

// Get all teams (Admin only - returns minimal info for leaderboard)
// Note: This endpoint should only be used by admin or for leaderboard purposes
// Regular users should use /user/:userId to get their own team
router.get('/', async (req, res) => {
  try {
    // Only return basic info, not full team details for privacy
    const teams = await Team.find()
      .populate('userId', 'username')
      .select('userId captain') // Only return userId and captain, not full player list
      .populate('captain', 'name');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get team by user ID (Users can only access their own team)
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    // SECURITY: Verify the requesting user matches the userId parameter
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only access your own team' });
    }
    
    const team = await Team.findOne({ userId: req.params.userId })
      .populate('players.playerId')
      .populate('captain');
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update team (Users can only update their own team)
router.post('/', authenticate, async (req, res) => {
  try {
    const { userId, players, captain } = req.body;
    
    // SECURITY: Verify the requesting user matches the userId
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only update your own team' });
    }

    // Validate team size
    if (!players || players.length !== 20) {
      return res.status(400).json({ error: 'Team must have exactly 20 players' });
    }

    // Check for duplicate players
    const playerIds = players.map(p => p.playerId || p);
    const uniquePlayerIds = new Set(playerIds);
    if (uniquePlayerIds.size !== 20) {
      return res.status(400).json({ error: 'Team cannot have duplicate players' });
    }

    // Check country limit
    const playerDocs = await Player.find({ _id: { $in: playerIds } });
    const countryCount = {};
    for (const player of playerDocs) {
      countryCount[player.country] = (countryCount[player.country] || 0) + 1;
      if (countryCount[player.country] > 2) {
        return res.status(400).json({ error: `Cannot have more than 2 players from ${player.country}` });
      }
    }

    // Check if captain is in team
    if (!playerIds.includes(captain)) {
      return res.status(400).json({ error: 'Captain must be in the team' });
    }

    // Check if team already exists
    let team = await Team.findOne({ userId });
    if (team) {
      // Update existing team
      team.players = players.map(p => ({ playerId: p.playerId || p }));
      team.captain = captain;
      await team.save();
    } else {
      // Create new team
      team = new Team({
        userId,
        players: players.map(p => ({ playerId: p.playerId || p })),
        captain
      });
      await team.save();
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('players.playerId')
      .populate('captain');

    const io = req.app.get('io');
    io.emit('teamUpdated', populatedTeam);
    res.json(populatedTeam);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Check if player is available (not in any team)
router.get('/check-availability/:playerId', async (req, res) => {
  try {
    const team = await Team.findOne({ 'players.playerId': req.params.playerId });
    res.json({ available: !team });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
