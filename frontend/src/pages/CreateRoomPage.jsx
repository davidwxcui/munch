import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Slider, FormControl, 
  InputLabel, Select, MenuItem, ToggleButton, 
  ToggleButtonGroup, Stack, Paper, Alert, CircularProgress 
} from '@mui/material';
import Layout from '../components/Layout';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { api } from '../services/api';

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    maxDistance: 5000,
    cuisine: 'restaurant',
    priceLevel: [1, 2, 3, 4]
  });

  const handlePriceChange = (event, newPriceLevel) => {
    if (newPriceLevel.length) {
      setFilters({ ...filters, priceLevel: newPriceLevel });
    }
  };

  const createRoom = async () => {
    setLoading(true);
    setError('');
    
    // Get user location first
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    console.log('Requesting location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('Location received:', position.coords);
        try {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          const data = await api.createRoom(filters, location);
          
          navigate(`/swipe/${data.roomId}`, { 
            state: { roomKey: data.roomKey } 
          });
        } catch (err) {
          setError(err.message || 'Failed to create room. Please try again.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMessage = 'Unable to retrieve your location.';
        if (err.code === 1) errorMessage = 'Location permission denied. Please allow access in browser settings.';
        if (err.code === 2) errorMessage = 'Location unavailable.';
        if (err.code === 3) errorMessage = 'Location request timed out.';
        
        setError(errorMessage + ' Please try again.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const distanceMarks = [
    { value: 1000, label: '1km' },
    { value: 5000, label: '5km' },
    { value: 10000, label: '10km' },
    { value: 20000, label: '20km' },
  ];

  const useRichmondLocation = async () => {
    setLoading(true);
    setError('');
    try {
      // Richmond, BC coordinates
      const location = { lat: 49.1666, lng: -123.1336 };
      
      const data = await api.createRoom(filters, location);
      
      navigate(`/swipe/${data.roomId}`, { state: { roomKey: data.roomKey } });
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Create Room" showBack>
      <Paper elevation={0} sx={{ p: 0, bgcolor: 'transparent' }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          Room Settings
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={useRichmondLocation}>
                Use Richmond, BC
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Stack spacing={4}>
          {/* Cuisine Selection */}
          <Box>
            <Typography gutterBottom fontWeight="medium">Cuisine</Typography>
            <FormControl fullWidth>
              <Select
                value={filters.cuisine}
                onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
                displayEmpty
                sx={{ borderRadius: 3, bgcolor: 'white' }}
              >
                <MenuItem value="restaurant">Any</MenuItem>
                <MenuItem value="italian_restaurant">Italian</MenuItem>
                <MenuItem value="chinese_restaurant">Chinese</MenuItem>
                <MenuItem value="mexican_restaurant">Mexican</MenuItem>
                <MenuItem value="japanese_restaurant">Japanese</MenuItem>
                <MenuItem value="american_restaurant">American</MenuItem>
                <MenuItem value="thai_restaurant">Thai</MenuItem>
                <MenuItem value="indian_restaurant">Indian</MenuItem>
                <MenuItem value="french_restaurant">French</MenuItem>
                <MenuItem value="cafe">Cafe</MenuItem>
                <MenuItem value="bar">Bar</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Distance Slider */}
          <Box>
            <Typography gutterBottom fontWeight="medium">
              Max Distance: {filters.maxDistance / 1000} km
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={filters.maxDistance}
                onChange={(e, val) => setFilters({ ...filters, maxDistance: val })}
                step={1000}
                min={1000}
                max={20000}
                marks={distanceMarks}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value / 1000}km`}
              />
            </Box>
          </Box>

          {/* Price Level */}
          <Box>
            <Typography gutterBottom fontWeight="medium">Price Range</Typography>
            <ToggleButtonGroup
              value={filters.priceLevel}
              onChange={handlePriceChange}
              aria-label="price level"
              fullWidth
              sx={{ 
                bgcolor: 'white', 
                borderRadius: 3,
                '& .MuiToggleButton-root': { py: 1.5 }
              }}
            >
              {[1, 2, 3, 4].map((price) => (
                <ToggleButton key={price} value={price} aria-label={`price level ${price}`}>
                  <Stack direction="row" spacing={0.5}>
                    {Array(price).fill(0).map((_, i) => (
                      <AttachMoneyIcon key={i} fontSize="small" />
                    ))}
                  </Stack>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Button 
            variant="contained" 
            size="large" 
            onClick={createRoom}
            disabled={loading}
            sx={{ mt: 4, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Start Swiping'}
          </Button>
        </Stack>
      </Paper>
    </Layout>
  );
};

export default CreateRoomPage;
