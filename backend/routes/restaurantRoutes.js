import express from 'express';
import axios from 'axios';
import { searchRestaurants, getRestaurantDetails, getPhotoUrl } from '../services/googlePlacesService.js';
import Room from '../models/Room.js';
import { googlePlacesRateLimiter, globalApiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * GET /api/restaurants
 * Fetch restaurants based on room filters
 * Rate limited to prevent exceeding Google Places API quota
 */
router.get('/', googlePlacesRateLimiter, globalApiRateLimiter, async (req, res) => {
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
        ...photo,
        // The service now returns relative URLs or full URLs, but we want to ensure
        // they are accessible. If they are relative, the frontend proxy handles it.
        url: photo.url 
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

/**
 * GET /api/restaurants/photo
 * Proxy Google Places Photo to avoid CORS/Auth issues on frontend
 */
router.get('/photo', async (req, res) => {
  try {
    const { name, maxwidth } = req.query; // 'name' is the resource name from New API
    
    if (!name) {
      return res.status(400).send('Missing photo reference (name)');
    }

    const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    // Construct the Google URL
    // New API format: https://places.googleapis.com/v1/{name}/media?key={KEY}&maxWidthPx={width}
    const googlePhotoUrl = `https://places.googleapis.com/v1/${name}/media?key=${API_KEY}&maxWidthPx=${maxwidth || 400}`;

    const response = await axios({
      method: 'get',
      url: googlePhotoUrl,
      responseType: 'stream'
    });

    // Forward the headers (content-type, etc.)
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    response.data.pipe(res);

  } catch (error) {
    // console.error('Error proxing photo:', error.message);
    res.status(404).send('Photo not found');
  }
});

/**
 * GET /api/restaurants/:id
 * Fetch detailed information for a specific restaurant
 * Rate limited to prevent exceeding Google Places API quota
 */
router.get('/:id', googlePlacesRateLimiter, globalApiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Get detailed information
    const details = await getRestaurantDetails(id);

    // Add full photo URLs
    const detailsWithPhotos = {
      ...details,
      photos: details.photos.map(photo => ({
        url: photo.url, // Service already returns proxy URL
        width: photo.width,
        height: photo.height
      }))
    };

    res.json(detailsWithPhotos);

  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant details' });
  }
});

export default router;
