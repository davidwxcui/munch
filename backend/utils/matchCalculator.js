import Swipe from '../models/Swipe.js';

/**
 * Calculate matches between two users in a room
 * Returns restaurants that both users swiped right on
 */
export async function calculateMatches(roomId) {
  // Find all right swipes for this room
  const swipes = await Swipe.find({
    roomId,
    direction: 'right'
  }).lean();

  // Group by restaurantId
  const swipesByRestaurant = {};
  
  swipes.forEach(swipe => {
    if (!swipesByRestaurant[swipe.restaurantId]) {
      swipesByRestaurant[swipe.restaurantId] = {
        restaurantData: swipe.restaurantData,
        socketIds: new Set()
      };
    }
    swipesByRestaurant[swipe.restaurantId].socketIds.add(swipe.socketId);
  });

  // Filter for restaurants with at least 2 distinct users (socketIds)
  const matches = [];
  
  Object.values(swipesByRestaurant).forEach(item => {
    if (item.socketIds.size >= 2) {
      matches.push({
        restaurantId: item.restaurantData.restaurantId || item.restaurantData.id, // Handle potential data inconsistencies
        ...item.restaurantData
      });
    }
  });

  return matches;
}

/**
 * Get swipe statistics for a room
 */
export async function getSwipeStats(roomId) {
  const swipes = await Swipe.find({ roomId }).lean();
  
  const stats = {
    totalSwipes: swipes.length,
    byUser: {},
    byDirection: {
      left: 0,
      right: 0
    }
  };

  swipes.forEach(swipe => {
    // Count by user
    if (!stats.byUser[swipe.socketId]) {
      stats.byUser[swipe.socketId] = { left: 0, right: 0 };
    }
    stats.byUser[swipe.socketId][swipe.direction]++;

    // Count by direction
    stats.byDirection[swipe.direction]++;
  });

  return stats;
}
