import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  matchNumber: {
    type: Number,
    required: true,
    unique: true
  },
  team1: {
    type: String,
    required: true
  },
  team2: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed'],
    default: 'upcoming'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Match', matchSchema);
