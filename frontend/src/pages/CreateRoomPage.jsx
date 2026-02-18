import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import socketService from '../services/socketService';
import './CreateRoomPage.css';

function CreateRoomPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomKey, setRoomKey] = useState('');
  const [roomId, setRoomId] = useState('');
  const [waitingForPartner, setWaitingForPartner] = useState(false);
  
  const [filters, setFilters] = useState({
    maxDistance: 5000,
    cuisine: 'restaurant',
    priceLevel: [1, 2, 3, 4]
  });

  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to San Francisco
          setLocation({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      // Default location
      setLocation({ lat: 37.7749, lng: -122.4194 });
    }
  }, []);

  useEffect(() => {
    if (roomId && roomKey) {
      // Connect to socket and join room
      socketService.connect();
      socketService.joinRoom(roomId, roomKey);

      // Listen for room updates
      socketService.onRoomUpdated((data) => {
        if (data.participantCount === 2 && data.status === 'active') {
          // Both users joined, navigate to swipe page
          navigate(`/swipe/${roomId}`);
        }
      });

      return () => {
        socketService.removeAllListeners();
      };
    }
  }, [roomId, roomKey, navigate]);

  const handleCreateRoom = async () => {
    if (!location) {
      setError('Waiting for location...');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.createRoom(filters, location);
      setRoomKey(response.roomKey);
      setRoomId(response.roomId);
      setWaitingForPartner(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceLevelToggle = (level) => {
    setFilters(prev => ({
      ...prev,
      priceLevel: prev.priceLevel.includes(level)
        ? prev.priceLevel.filter(l => l !== level)
        : [...prev.priceLevel, level].sort()
    }));
  };

  const copyRoomKey = () => {
    navigator.clipboard.writeText(roomKey);
    alert('Room key copied to clipboard!');
  };

  if (waitingForPartner) {
    return (
      <div className="create-room-page">
        <div className="waiting-container fade-in">
          <h2>Room Created! 🎉</h2>
          <div className="room-key-display">
            <p className="label">Share this code with your friend:</p>
            <div className="room-key">
              {roomKey}
            </div>
            <button className="copy-button" onClick={copyRoomKey}>
              📋 Copy Code
            </button>
          </div>
          <div className="waiting-indicator">
            <div className="spinner"></div>
            <p>Waiting for your friend to join...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-room-page">
      <div className="create-room-container fade-in">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        
        <h2>Create Room</h2>
        <p className="subtitle">Set your preferences for restaurant search</p>

        <div className="form-group">
          <label>Max Distance: {(filters.maxDistance / 1000).toFixed(1)} km</label>
          <input
            type="range"
            min="1000"
            max="25000"
            step="1000"
            value={filters.maxDistance}
            onChange={(e) => setFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
            className="slider"
          />
        </div>

        <div className="form-group">
          <label>Cuisine Type</label>
          <select
            value={filters.cuisine}
            onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
          >
            <option value="restaurant">All Restaurants</option>
            <option value="italian">Italian</option>
            <option value="japanese">Japanese</option>
            <option value="chinese">Chinese</option>
            <option value="mexican">Mexican</option>
            <option value="thai">Thai</option>
            <option value="indian">Indian</option>
            <option value="french">French</option>
            <option value="american">American</option>
          </select>
        </div>

        <div className="form-group">
          <label>Price Range</label>
          <div className="price-buttons">
            {[1, 2, 3, 4].map(level => (
              <button
                key={level}
                className={`price-button ${filters.priceLevel.includes(level) ? 'active' : ''}`}
                onClick={() => handlePriceLevelToggle(level)}
              >
                {'$'.repeat(level)}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          className="create-button"
          onClick={handleCreateRoom}
          disabled={loading || !location}
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>
      </div>
    </div>
  );
}

export default CreateRoomPage;
