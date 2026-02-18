import express from 'express';
import Room from '../models/Room.js';
import { generateRoomKey, isValidRoomKey } from '../utils/roomKeyGenerator.js';

const router = express.Router();

/**
 * POST /api/rooms
 * Create a new room with filters
 */
router.post('/', async (req, res) => {
  try {
    const { maxDistance, cuisine, priceLevel, location } = req.body;

    // Validate required fields
    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ 
        error: 'Location (lat, lng) is required' 
      });
    }

    // Generate unique room key
    let roomKey;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      roomKey = generateRoomKey();
      const existing = await Room.findOne({ roomKey });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return res.status(500).json({ 
        error: 'Failed to generate unique room key' 
      });
    }

    // Create room
    const room = new Room({
      roomKey,
      filters: {
        maxDistance: maxDistance || 5000,
        cuisine: cuisine || 'restaurant',
        priceLevel: priceLevel || [1, 2, 3, 4]
      },
      location: {
        lat: location.lat,
        lng: location.lng
      },
      status: 'waiting'
    });

    await room.save();

    res.status(201).json({
      roomId: room._id,
      roomKey: room.roomKey,
      filters: room.filters,
      status: room.status
    });

  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

/**
 * POST /api/rooms/join
 * Join an existing room with room key
 */
router.post('/join', async (req, res) => {
  try {
    const { roomKey } = req.body;

    // Validate room key format
    if (!isValidRoomKey(roomKey)) {
      return res.status(400).json({ 
        error: 'Invalid room key format' 
      });
    }

    // Find room
    const room = await Room.findOne({ roomKey });

    if (!room) {
      return res.status(404).json({ 
        error: 'Room not found' 
      });
    }

    // Check if room is full (max 2 participants)
    if (room.participants.length >= 2) {
      return res.status(400).json({ 
        error: 'Room is full' 
      });
    }

    res.json({
      roomId: room._id,
      roomKey: room.roomKey,
      filters: room.filters,
      location: room.location,
      participantCount: room.participants.length,
      status: room.status
    });

  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

/**
 * GET /api/rooms/:roomId
 * Get room details
 */
router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      roomId: room._id,
      roomKey: room.roomKey,
      filters: room.filters,
      location: room.location,
      participantCount: room.participants.length,
      status: room.status,
      createdAt: room.createdAt
    });

  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

export default router;
