import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import socketService from '../services/socketService';
import './JoinRoomPage.css';

function JoinRoomPage() {
  const navigate = useNavigate();
  const [roomKey, setRoomKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    
    const trimmedKey = roomKey.trim().toUpperCase();
    if (trimmedKey.length !== 4) {
      setError('Please enter a 4-letter room key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.joinRoom(trimmedKey);
      
      // Connect to socket and join room
      socketService.connect();
      socketService.joinRoom(response.roomId, trimmedKey);

      // Navigate to swipe page
      navigate(`/swipe/${response.roomId}`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-room-page">
      <div className="join-room-container fade-in">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        
        <h2>Join Room</h2>
        <p className="subtitle">Enter the 4-letter code shared by your friend</p>

        <form onSubmit={handleJoinRoom}>
          <div className="form-group">
            <label>Room Key</label>
            <input
              type="text"
              placeholder="ABCD"
              value={roomKey}
              onChange={(e) => setRoomKey(e.target.value.toUpperCase())}
              className="room-key-input"
              maxLength={4}
              autoFocus
            />
            <p className="hint">Format: 4 letters</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="join-button"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinRoomPage;
