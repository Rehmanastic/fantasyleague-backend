import express from 'express';
import Match from '../models/Match.js';

const router = express.Router();

// Get all matches
router.get('/', async (req, res) => {
  try {
    const matches = await Match.find().sort({ date: 1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single match
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create match (Admin only)
router.post('/', async (req, res) => {
  try {
    const match = new Match(req.body);
    await match.save();
    const io = req.app.get('io');
    io.emit('matchCreated', match);
    res.status(201).json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update match
router.put('/:id', async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    const io = req.app.get('io');
    io.emit('matchUpdated', match);
    res.json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete match
router.delete('/:id', async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    const io = req.app.get('io');
    io.emit('matchDeleted', req.params.id);
    res.json({ message: 'Match deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
