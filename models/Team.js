import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  players: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true
    }
  }],
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure max 2 players per country
teamSchema.pre('save', async function(next) {
  const Player = mongoose.model('Player');
  const playerIds = this.players.map(p => p.playerId);
  const players = await Player.find({ _id: { $in: playerIds } });
  
  const countryCount = {};
  for (const player of players) {
    countryCount[player.country] = (countryCount[player.country] || 0) + 1;
    if (countryCount[player.country] > 2) {
      return next(new Error(`Cannot have more than 2 players from ${player.country}`));
    }
  }
  
  if (this.players.length !== 20) {
    return next(new Error('Team must have exactly 20 players'));
  }
  
  next();
});

export default mongoose.model('Team', teamSchema);
