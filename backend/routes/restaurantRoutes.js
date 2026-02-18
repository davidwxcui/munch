import express from 'express';
import { searchRestaurants, getPhotoUrl } from '../services/googlePlacesService.js';
import Room from '../models/Room.js';

const router = express.Router();

/**
 * GET /api/restaurants
 * Fetch restaurants based on room filters
 */
router.get('/', async (req, res) => {
  try {
    const { roomId } = req.query;

    if (!roomId) {
      return res.status(400).json({ error: 'roomId is required' });
    }

    // Get room to fetch filters and location
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Search restaurants using room filters
    const restaurants = await searchRestaurants({
      lat: room.location.lat,
      lng: room.location.lng,
      radius: room.filters.maxDistance,
      cuisine: room.filters.cuisine,
      priceLevel: room.filters.priceLevel
    });

    // Add full photo URLs
    const restaurantsWithPhotos = restaurants.map(restaurant => ({
      ...restaurant,
      photos: restaurant.photos.map(photo => ({
        url: getPhotoUrl(photo.reference, 400),
        width: photo.width,
        height: photo.height
      }))
    }));

    res.json({
      restaurants: restaurantsWithPhotos,
      count: restaurantsWithPhotos.length
    });

  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

export default router;
