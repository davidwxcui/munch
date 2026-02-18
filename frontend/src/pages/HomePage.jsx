import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Box, Paper, Stack } from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import Layout from '../components/Layout';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexGrow: 1, 
        textAlign: 'center',
        gap: 4
      }}>
        <Box sx={{ mb: 2 }}>
          <Box 
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white', 
              p: 3, 
              borderRadius: '50%', 
              display: 'inline-flex',
              mb: 3,
              boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)'
            }}
          >
            <RestaurantMenuIcon sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h2" component="h1" gutterBottom fontWeight="800" color="primary">
            Munch
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
            The tastiest way to decide where to eat with friends.
          </Typography>
        </Box>

        <Stack spacing={2} width="100%" maxWidth={320}>
          <Button 
            variant="contained" 
            size="large" 
            fullWidth 
            onClick={() => navigate('/create')}
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            Create a Room
          </Button>
          <Button 
            variant="outlined" 
            size="large" 
            fullWidth 
            onClick={() => navigate('/join')}
            sx={{ py: 1.5, fontSize: '1.1rem', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
          >
            Join a Room
          </Button>
        </Stack>
      </Box>
    </Layout>
  );
};

export default HomePage;
