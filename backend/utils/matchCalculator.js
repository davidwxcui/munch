import Swipe from '../models/Swipe.js';

/**
 * Calculate matches between two users in a room
 * Returns restaurants that both users swiped right on
 */
export async function calculateMatches(roomId, socketIds) {
  if (!socketIds || socketIds.length !== 2) {
    throw new Error('Exactly 2 participants required for matching');
  }

  const [user1Id, user2Id] = socketIds;

  // Get all right swipes for user 1
  const user1Swipes = await Swipe.find({
    roomId,
    socketId: user1Id,
    direction: 'right'
  }).lean();

  // Get all right swipes for user 2
  const user2Swipes = await Swipe.find({
    roomId,
    socketId: user2Id,
    direction: 'right'
  }).lean();

  // Find common restaurant IDs
  const user1RestaurantIds = new Set(
    user1Swipes.map(swipe => swipe.restaurantId)
  );

  const matches = user2Swipes.filter(swipe =>
    user1RestaurantIds.has(swipe.restaurantId)
  );

  // Return unique matches with full restaurant data
  const uniqueMatches = [];
  const seenIds = new Set();

  for (const match of matches) {
    if (!seenIds.has(match.restaurantId)) {
      seenIds.add(match.restaurantId);
      uniqueMatches.push({
        restaurantId: match.restaurantId,
        ...match.restaurantData
      });
    }
  }

  return uniqueMatches;
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
