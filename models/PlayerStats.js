import mongoose from 'mongoose';

const playerStatsSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  // Batting stats
  runs: {
    type: Number,
    default: 0
  },
  ballsFaced: {
    type: Number,
    default: 0
  },
  fours: {
    type: Number,
    default: 0
  },
  sixes: {
    type: Number,
    default: 0
  },
  // Bowling stats
  wickets: {
    type: Number,
    default: 0
  },
  oversBowled: {
    type: Number,
    default: 0
  },
  runsConceded: {
    type: Number,
    default: 0
  },
  dotBalls: {
    type: Number,
    default: 0
  },
  maidens: {
    type: Number,
    default: 0
  },
  // Fielding stats
  catches: {
    type: Number,
    default: 0
  },
  runouts: {
    type: Number,
    default: 0
  },
  runoutAssists: {
    type: Number,
    default: 0
  },
  stumpings: {
    type: Number,
    default: 0
  },
  // Calculated points
  fantasyPoints: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate stats
playerStatsSchema.index({ matchId: 1, playerId: 1 }, { unique: true });

export default mongoose.model('PlayerStats', playerStatsSchema);
