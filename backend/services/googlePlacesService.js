import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// We no longer use the @googlemaps/google-maps-services-js client for the New API
// because it defaults to legacy endpoints. We use direct HTTP calls to v1.

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://places.googleapis.com/v1';

/**
 * Search for nearby restaurants using Google Places API (New)
 * Endpoint: POST https://places.googleapis.com/v1/places:searchNearby
 */
export async function searchRestaurants({ lat, lng, radius, cuisine, priceLevel }) {
  try {
    // Development/Testing Mock
    if (API_KEY === 'placeholder_api_key') {
      return getMockRestaurants(lat, lng);
    }

    // Map legacy 'type' or cuisine to includedTypes
    // The new API uses specific types: https://developers.google.com/maps/documentation/places/web-service/supported_types
    let includedTypes = ['restaurant'];
    
    // Simple mapping for common cuisine types if passed as 'cuisine'
    if (cuisine && cuisine !== 'restaurant') {
      // If the user selected a specific cuisine (e.g., 'chinese_restaurant'), use it.
      // The new API supports types like 'chinese_restaurant', 'italian_restaurant', etc.
      includedTypes = [cuisine]; 
    } else {
        // broad search
        includedTypes = ['restaurant', 'cafe', 'bar'];
    }

    const requestBody = {
      locationRestriction: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng
          },
          radius: radius || 5000 // meters
        }
      },
      includedTypes: includedTypes,
      maxResultCount: 20,
      // prices is not directly supported in searchNearby filter in v1 in the same way, 
      // strictly speaking we filter post-fetch or use EV_CHARGE_OPTIONS? 
      // Wait, v1 places:searchNearby supports 'priceLevels' in some contexts? 
      // Actually, standard SearchNearby doesn't have a direct price filter in the body yet (as of late 2024/2025 knowledge).
      // We will filter client-side (in this service) after fetching.
    };

    // Define the fields we want to return (FieldMask)
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.priceLevel', // PRICE_LEVEL_INEXPENSIVE, etc.
      'places.rating',
      'places.userRatingCount',
      'places.photos',
      'places.types',
      'places.location'
    ].join(',');

    const response = await axios.post(
      `${BASE_URL}/places:searchNearby`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': fieldMask
        }
      }
    );

    let places = response.data.places || [];
    
    // DEBUG LOGGING
    if (places.length > 0) {
        console.log(`[DEBUG] Found ${places.length} places.`);
        console.log(`[DEBUG] First Place: ${places[0].displayName?.text}`);
        console.log(`[DEBUG] First Place Photos Valid?: ${!!places[0].photos}`);
        if (places[0].photos) {
            console.log(`[DEBUG] Photo 0 keys: ${Object.keys(places[0].photos[0])}`);
            console.log(`[DEBUG] Photo 0 name: ${places[0].photos[0].name}`);
        }
    } else {
        console.log('[DEBUG] No places found.');
    }

    // Map Price Levels from Enums if necessary, or just numbers.
    // The API returns 'PRICE_LEVEL_INEXPENSIVE' etc. or sometimes objects.
    // Actually v1 returns enums: PRICE_LEVEL_UNSPECIFIED, PRICE_LEVEL_FREE, PRICE_LEVEL_INEXPENSIVE (1), MODERATE (2), EXPENSIVE (3), VERY_EXPENSIVE (4)
    
    const priceMap = {
      'PRICE_LEVEL_FREE': 0,
      'PRICE_LEVEL_INEXPENSIVE': 1,
      'PRICE_LEVEL_MODERATE': 2,
      'PRICE_LEVEL_EXPENSIVE': 3,
      'PRICE_LEVEL_VERY_EXPENSIVE': 4
    };

    // Filter by price level if specified
    if (priceLevel && priceLevel.length > 0) {
       places = places.filter(place => {
         const lvl = priceMap[place.priceLevel] || 0;
         return priceLevel.includes(lvl);
       });
    }

    // Transform to our app's expected format
    return places.map(place => {
      const pLevel = priceMap[place.priceLevel] || 0;
      return {
        id: place.id,
        name: place.displayName?.text || 'Unknown',
        address: place.formattedAddress,
        rating: place.rating || 0,
        priceLevel: pLevel,
        photos: place.photos ? place.photos.slice(0, 3).map(photo => ({
          url: getPhotoUrl(photo.name), // photo.name is the resource name "places/ID/photos/ID"
          width: photo.widthPx,
          height: photo.heightPx
        })) : [],
        location: {
            lat: place.location?.latitude,
            lng: place.location?.longitude
        },
        types: place.types || []
      };
    });

  } catch (error) {
    console.error('Error in searchRestaurants (New API):', error.response?.data || error.message);
    // Fallback to mock if API fails? No, let's throw so user sees it.
    throw error;
  }
}

/**
 * Get detailed information for a specific restaurant
 * Endpoint: GET https://places.googleapis.com/v1/places/{placeId}
 */
export async function getRestaurantDetails(placeId) {
  try {
    if (API_KEY === 'placeholder_api_key') {
      return getMockRestaurantDetails(placeId);
    }

    const fieldMask = [
      'id',
      'displayName',
      'formattedAddress',
      'rating',
      'userRatingCount',
      'priceLevel',
      'websiteUri',
      'googleMapsUri',
      'regularOpeningHours',
      'photos',
      'reviews'
    ].join(',');

    const response = await axios.get(
      `${BASE_URL}/places/${placeId}`,
      {
        headers: {
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': fieldMask
        }
      }
    );

    const place = response.data;
    
    const priceMap = {
      'PRICE_LEVEL_FREE': 0,
      'PRICE_LEVEL_INEXPENSIVE': 1,
      'PRICE_LEVEL_MODERATE': 2,
      'PRICE_LEVEL_EXPENSIVE': 3,
      'PRICE_LEVEL_VERY_EXPENSIVE': 4
    };

    return {
      id: place.id,
      name: place.displayName?.text,
      address: place.formattedAddress,
      // phone: place.nationalPhoneNumber, // Request if needed
      rating: place.rating || 0,
      totalRatings: place.userRatingCount || 0,
      priceLevel: priceMap[place.priceLevel] || 0,
      website: place.websiteUri,
      googleMapsUrl: place.googleMapsUri,
      isOpen: place.regularOpeningHours?.openNow,
      openingHours: place.regularOpeningHours?.weekdayDescriptions || [],
      photos: place.photos ? place.photos.map(photo => ({
        url: getPhotoUrl(photo.name),
        width: photo.widthPx,
        height: photo.heightPx
      })) : [],
      reviews: place.reviews ? place.reviews.map(review => ({
        author: review.authorAttribution?.displayName || 'Anonymous',
        rating: review.rating,
        text: review.text?.text, // v1 returns LocalizedText object
        time: review.relativePublishTimeDescription,
        profilePhoto: review.authorAttribution?.photoUri
      })) : []
    };

  } catch (error) {
    console.error('Error fetching details (New API):', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get photo URL from photo resource name
 * New API Format: https://places.googleapis.com/v1/{NAME}/media?key={KEY}&maxWidthPx=400
 * @param {string} photoName - The resource name, e.g., "places/PLACE_ID/photos/PHOTO_ID"
 */
export function getPhotoUrl(photoName, maxWidth = 400) {
  if (API_KEY === 'placeholder_api_key') {
    return `https://placehold.co/${maxWidth}x300/FF6B6B/FFFFFF?text=Restaurant`;
  }
  if (!photoName) return '';
  
  // Return relative proxy URL
  // Frontend will request /api/restaurants/photo?name=...
  // Vite proxy will forward to http://localhost:5000/api/restaurants/photo...
  return `/api/restaurants/photo?name=${encodeURIComponent(photoName)}&maxwidth=${maxWidth}`;
}

/**
 * Mock restaurant data
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
        url: `https://placehold.co/400x300?text=Mock+Photo`,
        width: 400,
        height: 300
      }
    ],
    location: {
      lat: lat + (Math.random() - 0.5) * 0.02,
      lng: lng + (Math.random() - 0.5) * 0.02
    },
    types: ['restaurant', 'food']
  }));
}

function getMockRestaurantDetails(placeId) {
    return {
        id: placeId,
        name: 'Mock Restaurant Details',
        address: '123 Mock St',
        rating: 4.5,
        photos: [],
        reviews: []
    }
}
