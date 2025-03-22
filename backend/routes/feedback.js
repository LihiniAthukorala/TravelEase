import express from 'express';
import Feedback from '../models/Feedback.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create feedback
router.post('/', async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.status(201).json({ feedback });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all feedback (admin only)
router.get('/',  async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json({ feedback });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update feedback (admin only)
router.put('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ feedback });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete feedback (admin only)
router.delete('/:id',async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
