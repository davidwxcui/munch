import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';

const Layout = ({ children, title, showBack = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we should show the back button based on path or prop
  const shouldShowBack = showBack || (location.pathname !== '/' && location.pathname !== '/join' && location.pathname !== '/create');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary', borderBottom: '1px solid #eee' }}>
        <Toolbar>
          {shouldShowBack ? (
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
              <ArrowBackIcon />
            </IconButton>
          ) : (
            <IconButton edge="start" color="primary" aria-label="logo">
              <RestaurantMenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700, ml: 1 }}>
            {title || 'Munch'}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container component="main" maxWidth="sm" sx={{ flexGrow: 1, py: 3, display: 'flex', flexDirection: 'column' }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
