import express from 'express';
import Team from '../models/Team.js';
import PlayerStats from '../models/PlayerStats.js';
import User from '../models/User.js';
import { authenticate } from './auth.js';

const router = express.Router();

// Get leaderboard (Public endpoint - doesn't expose full team details)
router.get('/', async (req, res) => {
  try {
    // Get teams with player IDs (needed for calculation) but don't expose full details
    const teams = await Team.find()
      .populate('userId', 'username')
      .populate('players.playerId', 'name') // Only get player names, not full details
      .populate('captain', 'name');
    const allStats = await PlayerStats.find().populate('playerId');

    // Calculate points for each team
    const leaderboard = teams.map(team => {
      let totalPoints = 0;
      const matchBreakdown = {};

      // Get all stats for players in this team
      const teamPlayerIds = team.players.map(p => p.playerId._id.toString());
      const teamStats = allStats.filter(stat => 
        teamPlayerIds.includes(stat.playerId._id.toString())
      );

      // Group stats by match
      const statsByMatch = {};
      teamStats.forEach(stat => {
        const matchId = stat.matchId.toString();
        if (!statsByMatch[matchId]) {
          statsByMatch[matchId] = [];
        }
        statsByMatch[matchId].push(stat);
      });

      // Calculate points per match
      Object.keys(statsByMatch).forEach(matchId => {
        let matchPoints = 0;
        statsByMatch[matchId].forEach(stat => {
          const playerPoints = stat.fantasyPoints || 0;
          // Captain gets 2x points
          if (stat.playerId._id.toString() === team.captain._id.toString()) {
            matchPoints += playerPoints * 2;
          } else {
            matchPoints += playerPoints;
          }
        });
        matchBreakdown[matchId] = matchPoints;
        totalPoints += matchPoints;
      });

      return {
        userId: team.userId._id,
        username: team.userId.username,
        totalPoints: Math.round(totalPoints * 10) / 10,
        matchBreakdown,
        captain: team.captain
      };
    });

    // Sort by total points (descending)
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard for specific user (Users can only view their own breakdown)
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    // SECURITY: Verify the requesting user matches the userId
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only view your own breakdown' });
    }
    
    const team = await Team.findOne({ userId: req.params.userId })
      .populate('players.playerId')
      .populate('captain');

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const allStats = await PlayerStats.find().populate('playerId').populate('matchId');
    const teamPlayerIds = team.players.map(p => p.playerId._id.toString());
    const teamStats = allStats.filter(stat => 
      teamPlayerIds.includes(stat.playerId._id.toString())
    );

    const matchBreakdown = {};
    let totalPoints = 0;

    teamStats.forEach(stat => {
      const matchId = stat.matchId._id.toString();
      if (!matchBreakdown[matchId]) {
        matchBreakdown[matchId] = {
          match: stat.matchId,
          players: [],
          totalPoints: 0
        };
      }

      const playerPoints = stat.fantasyPoints || 0;
      const isCaptain = stat.playerId._id.toString() === team.captain._id.toString();
      const finalPoints = isCaptain ? playerPoints * 2 : playerPoints;

      matchBreakdown[matchId].players.push({
        player: stat.playerId,
        points: playerPoints,
        isCaptain,
        finalPoints
      });
      matchBreakdown[matchId].totalPoints += finalPoints;
      totalPoints += finalPoints;
    });

    res.json({
      userId: team.userId,
      totalPoints: Math.round(totalPoints * 10) / 10,
      matchBreakdown: Object.values(matchBreakdown),
      captain: team.captain
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
