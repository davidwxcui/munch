let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
if (API_URL && !API_URL.startsWith('http')) {
  API_URL = `https://${API_URL}`;
}

export const api = {
  // Room endpoints
  async createRoom(filters, location) {
    const response = await fetch(`${API_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...filters, location })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create room');
    }
    
    return response.json();
  },

  async joinRoom(roomKey) {
    const response = await fetch(`${API_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomKey })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join room');
    }
    
    return response.json();
  },

  async getRoom(roomId) {
    const response = await fetch(`${API_URL}/api/rooms/${roomId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch room');
    }
    
    return response.json();
  },

  // Restaurant endpoints
  async getRestaurants(roomId) {
    const response = await fetch(`${API_URL}/api/restaurants?roomId=${roomId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch restaurants');
    }
    
    return response.json();
  },

  // Swipe endpoints
  async recordSwipe(roomId, socketId, restaurantId, direction, restaurantData) {
    const response = await fetch(`${API_URL}/api/swipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, socketId, restaurantId, direction, restaurantData })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to record swipe');
    }
    
    return response.json();
  },

  async getMatches(roomId) {
    const response = await fetch(`${API_URL}/api/swipes/${roomId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch matches');
    }
    
    return response.json();
  }
};
