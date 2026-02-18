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
        url: getPhotoUrl(photo.photo_reference),
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
    return `https://placehold.co/${maxWidth}x300/FF6B6B/FFFFFF?text=Restaurant`;
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
        url: getPhotoUrl(`mock_photo_${i}_1`),
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

/**
 * Get detailed information for a specific restaurant
 */
export async function getRestaurantDetails(placeId) {
  try {
    // For development/testing without API key
    if (process.env.GOOGLE_PLACES_API_KEY === 'placeholder_api_key') {
      return getMockRestaurantDetails(placeId);
    }

    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        fields: [
          'name',
          'rating',
          'formatted_phone_number',
          'formatted_address',
          'photos',
          'reviews',
          'website',
          'url',
          'opening_hours',
          'price_level',
          'user_ratings_total'
        ],
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    const place = response.data.result;

    // Transform to our format
    return {
      id: placeId,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      rating: place.rating || 0,
      totalRatings: place.user_ratings_total || 0,
      priceLevel: place.price_level || 0,
      website: place.website,
      googleMapsUrl: place.url,
      openingHours: place.opening_hours ? place.opening_hours.weekday_text : [],
      isOpen: place.opening_hours ? place.opening_hours.open_now : null,
      photos: place.photos ? place.photos.map(photo => ({
        url: getPhotoUrl(photo.photo_reference),
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) : [],
      reviews: place.reviews ? place.reviews.map(review => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.relative_time_description,
        profilePhoto: review.profile_photo_url
      })) : []
    };

  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    throw error;
  }
}

/**
 * Mock restaurant details for development/testing
 */
function getMockRestaurantDetails(placeId) {
  return {
    id: placeId,
    name: 'Mock Restaurant Details',
    address: '123 Mock Street, Mock City',
    phone: '(555) 123-4567',
    rating: 4.5,
    totalRatings: 120,
    priceLevel: 2,
    website: 'https://example.com',
    googleMapsUrl: 'https://maps.google.com',
    openingHours: [
      'Monday: 9:00 AM – 10:00 PM',
      'Tuesday: 9:00 AM – 10:00 PM',
      'Wednesday: 9:00 AM – 10:00 PM',
      'Thursday: 9:00 AM – 10:00 PM',
      'Friday: 9:00 AM – 11:00 PM',
      'Saturday: 10:00 AM – 11:00 PM',
      'Sunday: 10:00 AM – 9:00 PM'
    ],
    isOpen: true,
    photos: Array.from({ length: 5 }, (_, i) => ({
      url: getPhotoUrl(`mock_photo_detail_${i}`),
      reference: `mock_photo_detail_${i}`,
      width: 800,
      height: 600
    })),
    reviews: Array.from({ length: 3 }, (_, i) => ({
      author: `Reviewer ${i + 1}`,
      rating: 4 + (i % 2),
      text: 'This place is great! The food was delicious and the service was excellent. Would definitely recommend.',
      time: '2 days ago',
      profilePhoto: `https://ui-avatars.com/api/?name=Reviewer+${i+1}&background=random`
    }))
  };
}
