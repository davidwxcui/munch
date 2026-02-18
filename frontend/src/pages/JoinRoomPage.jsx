import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import Layout from '../components/Layout';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { api } from '../services/api';

const JoinRoomPage = () => {
  const navigate = useNavigate();
  const [roomKey, setRoomKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomKey.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Validate room exists by attempting to fetch it (or join via socket later)
      const data = await api.joinRoom(roomKey.toUpperCase());
      
      navigate(`/swipe/${data.roomId}`, { 
        state: { roomKey: data.roomKey } 
      });
    } catch (err) {
      setError('Room not found. Please check the code and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Join Room" showBack>
      <Box 
        component="form" 
        onSubmit={handleJoin}
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          flexGrow: 1, 
          gap: 3 
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <MeetingRoomIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" fontWeight="bold">
            Enter Room Code
          </Typography>
          <Typography color="text.secondary">
            Ask your friend for the 4-character code
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          autoFocus
          fullWidth
          label="Room Code"
          value={roomKey}
          onChange={(e) => setRoomKey(e.target.value.toUpperCase())}
          inputProps={{ 
            maxLength: 4,
            style: { 
              textTransform: 'uppercase', 
              textAlign: 'center', 
              fontSize: '2rem', 
              letterSpacing: '0.5rem',
              fontWeight: 'bold'
            } 
          }}
          placeholder="ABCD"
          variant="outlined"
          sx={{ 
            '& .MuiOutlinedInput-root': { 
              borderRadius: 3,
              bgcolor: 'white'
            } 
          }}
        />

        <Button 
          type="submit" 
          variant="contained" 
          size="large" 
          fullWidth
          disabled={!roomKey.trim() || loading}
          sx={{ py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Join Room'}
        </Button>
      </Box>
    </Layout>
  );
};

export default JoinRoomPage;
