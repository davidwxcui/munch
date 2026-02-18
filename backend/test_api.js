import { searchRestaurants } from './services/googlePlacesService.js';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing Google Places API...');
console.log('API Key:', process.env.GOOGLE_PLACES_API_KEY ? 'Present' : 'Missing');

async function test() {
  try {
    const results = await searchRestaurants({
      lat: 49.1666, // Richmond, BC
      lng: -123.1336,
      radius: 5000,
      cuisine: 'restaurant'
    });

    console.log('--- Results ---');
    if (results.length > 0) {
        console.log(`Found ${results.length} restaurants.`);
        const first = results[0];
        console.log('First Restaurant:', first.name);
        console.log('Photos Array:', JSON.stringify(first.photos, null, 2));
    } else {
        console.log('No restaurants found.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
