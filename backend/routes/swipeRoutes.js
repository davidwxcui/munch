import express from 'express';
import Swipe from '../models/Swipe.js';
import Room from '../models/Room.js';
import { calculateMatches } from '../utils/matchCalculator.js';

const router = express.Router();

/**
 * POST /api/swipes
 * Record a user's swipe
 */
router.post('/', async (req, res) => {
  try {
    const { roomId, socketId, restaurantId, direction, restaurantData } = req.body;

    // Validate required fields
    if (!roomId || !socketId || !restaurantId || !direction) {
      return res.status(400).json({ 
        error: 'roomId, socketId, restaurantId, and direction are required' 
      });
    }

    if (!['left', 'right'].includes(direction)) {
      return res.status(400).json({ 
        error: 'direction must be "left" or "right"' 
      });
    }

    // Check if swipe already exists (prevent duplicates)
    const existingSwipe = await Swipe.findOne({
      roomId,
      socketId,
      restaurantId
    });

    if (existingSwipe) {
      return res.status(400).json({ 
        error: 'Swipe already recorded for this restaurant' 
      });
    }

    // Create swipe
    const swipe = new Swipe({
      roomId,
      socketId,
      restaurantId,
      direction,
      restaurantData
    });

    await swipe.save();

    res.status(201).json({
      success: true,
      swipeId: swipe._id
    });

  } catch (error) {
    console.error('Error recording swipe:', error);
    res.status(500).json({ 
      error: 'Failed to record swipe',
      details: error.message 
    });
  }
});

/**
 * GET /api/matches/:roomId
 * Get matched restaurants for a room
 */
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    // Get room and verify it has 2 participants
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // (Removed strict participant count check to allow viewing matches even if one person disconnects)

    // Calculate matches
    // const socketIds = room.participants.map(p => p.socketId);
    const matches = await calculateMatches(roomId);

    // Sort by rating (descending)
    matches.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    res.json({
      matches,
      count: matches.length
    });

  } catch (error) {
    console.error('Error calculating matches:', error);
    res.status(500).json({ error: 'Failed to calculate matches' });
  }
});

export default router;
