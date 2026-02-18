import mongoose from 'mongoose';

const swipeSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  socketId: {
    type: String,
    required: true
  },
  restaurantId: {
    type: String, // Google Place ID
    required: true
  },
  direction: {
    type: String,
    enum: ['left', 'right'],
    required: true
  },
  restaurantData: {
    name: String,
    address: String,
    rating: Number,
    priceLevel: Number,
    photos: [{
      url: String,
      width: Number,
      height: Number
    }],
    location: {
      lat: Number,
      lng: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
swipeSchema.index({ roomId: 1, socketId: 1, restaurantId: 1 });

const Swipe = mongoose.model('Swipe', swipeSchema);

export default Swipe;
