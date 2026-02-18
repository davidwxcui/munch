import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import roomRoutes from './routes/roomRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import swipeRoutes from './routes/swipeRoutes.js';
import Room from './models/Room.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/swipes', swipeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join room
  socket.on('join-room', async ({ roomId, roomKey }) => {
    try {
      const room = await Room.findById(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Add participant if not already in room
      const existingParticipant = room.participants.find(
        p => p.socketId === socket.id
      );

      if (!existingParticipant) {
        if (room.participants.length >= 2) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }

        room.participants.push({ socketId: socket.id });
        
        // Update room status
        if (room.participants.length === 2) {
          room.status = 'active';
        }

        await room.save();
      }

      // Join socket room
      socket.join(roomId);

      // Notify room participants
      io.to(roomId).emit('room-updated', {
        participantCount: room.participants.length,
        status: room.status
      });

      console.log(`Socket ${socket.id} joined room ${roomKey}`);

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle swipe
  socket.on('swipe', async ({ roomId, restaurantId, direction, restaurantData }) => {
    try {
      // Broadcast swipe to other participants in the room
      socket.to(roomId).emit('partner-swiped', {
        restaurantId,
        direction
      });

      console.log(`Swipe in room ${roomId}: ${direction} on ${restaurantId}`);

    } catch (error) {
      console.error('Error handling swipe:', error);
      socket.emit('error', { message: 'Failed to process swipe' });
    }
  });

  // Handle completion
  socket.on('complete-swiping', async ({ roomId }) => {
    try {
      // Notify other participants
      socket.to(roomId).emit('partner-completed');

      console.log(`User ${socket.id} completed swiping in room ${roomId}`);

    } catch (error) {
      console.error('Error handling completion:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      // Find and update rooms where this socket was a participant
      const rooms = await Room.find({
        'participants.socketId': socket.id
      });

      for (const room of rooms) {
        room.participants = room.participants.filter(
          p => p.socketId !== socket.id
        );

        if (room.participants.length === 0) {
          // Delete empty room
          await Room.findByIdAndDelete(room._id);
        } else {
          room.status = 'waiting';
          await room.save();

          // Notify remaining participants
          io.to(room._id.toString()).emit('room-updated', {
            participantCount: room.participants.length,
            status: room.status
          });
        }
      }

      console.log(`Client disconnected: ${socket.id}`);

    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready for connections`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
