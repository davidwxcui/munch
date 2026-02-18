import { Client } from '@googlemaps/google-maps-services-js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({});

/**
 * Search for nearby restaurants using Google Places API
 */
export async function searchRestaurants({ lat, lng, radius, cuisine, priceLevel }) {
  try {
    // For development/testing without API key
    if (process.env.GOOGLE_PLACES_API_KEY === 'placeholder_api_key') {
      return getMockRestaurants(lat, lng);
    }

    const response = await client.placesNearby({
      params: {
        location: { lat, lng },
        radius: radius || 5000,
        type: cuisine || 'restaurant',
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    let results = response.data.results || [];

    // Filter by price level if specified
    if (priceLevel && priceLevel.length > 0) {
      results = results.filter(place => 
        place.price_level && priceLevel.includes(place.price_level)
      );
    }

    // Transform to our format
    return results.map(place => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      rating: place.rating || 0,
      priceLevel: place.price_level || 0,
      photos: place.photos ? place.photos.slice(0, 3).map(photo => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) : [],
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      types: place.types || []
    }));

  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }
}

/**
 * Get photo URL from photo reference
 */
export function getPhotoUrl(photoReference, maxWidth = 400) {
  if (process.env.GOOGLE_PLACES_API_KEY === 'placeholder_api_key') {
    return `https://via.placeholder.com/${maxWidth}x300/FF6B6B/FFFFFF?text=Restaurant`;
  }

  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
}

/**
 * Mock restaurant data for development/testing
 */
function getMockRestaurants(lat, lng) {
  const cuisines = ['Italian', 'Japanese', 'Mexican', 'Thai', 'American', 'Chinese', 'French', 'Indian'];
  const adjectives = ['Delicious', 'Tasty', 'Authentic', 'Modern', 'Traditional', 'Fusion', 'Gourmet', 'Fresh'];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: `mock_restaurant_${i + 1}`,
    name: `${adjectives[i % adjectives.length]} ${cuisines[i % cuisines.length]} Kitchen`,
    address: `${100 + i} Main Street, City`,
    rating: 3.5 + Math.random() * 1.5,
    priceLevel: Math.floor(Math.random() * 4) + 1,
    photos: [
      {
        reference: `mock_photo_${i}_1`,
        width: 400,
        height: 300
      }
    ],
    location: {
      lat: lat + (Math.random() - 0.5) * 0.02,
      lng: lng + (Math.random() - 0.5) * 0.02
    },
    types: ['restaurant', 'food', 'point_of_interest']
  }));
}
