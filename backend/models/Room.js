import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  filters: {
    maxDistance: {
      type: Number,
      required: true,
      default: 5000 // in meters
    },
    cuisine: {
      type: String,
      default: 'restaurant'
    },
    priceLevel: {
      type: [Number], // Array of price levels [1,2,3,4]
      default: [1, 2, 3, 4]
    }
  },
  participants: [{
    socketId: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting'
  },
  location: {
    lat: Number,
    lng: Number
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours
  }
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
