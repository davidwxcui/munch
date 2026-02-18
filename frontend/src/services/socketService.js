import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);
      
      this.socket.on('connect', () => {
        console.log('✅ Connected to server');
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId, roomKey) {
    if (this.socket) {
      this.socket.emit('join-room', { roomId, roomKey });
    }
  }

  onRoomUpdated(callback) {
    if (this.socket) {
      this.socket.on('room-updated', callback);
    }
  }

  sendSwipe(roomId, restaurantId, direction, restaurantData) {
    if (this.socket) {
      this.socket.emit('swipe', { roomId, restaurantId, direction, restaurantData });
    }
  }

  onPartnerSwiped(callback) {
    if (this.socket) {
      this.socket.on('partner-swiped', callback);
    }
  }

  completeSwiping(roomId) {
    if (this.socket) {
      this.socket.emit('complete-swiping', { roomId });
    }
  }

  onPartnerCompleted(callback) {
    if (this.socket) {
      this.socket.on('partner-completed', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new SocketService();
