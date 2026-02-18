import React from 'react';
import { 
  Card, CardMedia, CardContent, Typography, 
  Box, Chip, Rating, IconButton, Fab
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const RestaurantCard = ({ restaurant, onInfoClick }) => {
  const photoUrl = restaurant.photos && restaurant.photos.length > 0 
    ? restaurant.photos[0].url 
    : 'https://placehold.co/400x300?text=No+Photo';

  return (
    <Card 
      sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        borderRadius: 4,
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardMedia
        component="img"
        image={photoUrl}
        alt={restaurant.name}
        sx={{ 
          height: '65%', 
          objectFit: 'cover' 
        }}
      />
      
      {/* Overlay Gradient for text readability if needed, but we have content below */}
      
      <CardContent sx={{ flexGrow: 1, position: 'relative', pt: 3 }}>
        {/* Floating Info Button */}
        <Fab 
          color="white" 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick();
          }}
          sx={{ 
            position: 'absolute', 
            top: -24, 
            right: 24, 
            boxShadow: 2,
            bgcolor: 'white',
            '&:hover': { bgcolor: '#f5f5f5' }
          }}
        >
          <InfoIcon color="primary" />
        </Fab>

        <Typography variant="h5" component="div" fontWeight="bold" noWrap>
          {restaurant.name}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, mb: 1.5 }}>
          <Rating value={restaurant.rating} readOnly precision={0.5} size="small" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {Array(restaurant.priceLevel || 1).fill('$').join('')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            icon={<LocationOnIcon fontSize="small" />} 
            label={restaurant.vicinity || restaurant.address} 
            size="small" 
            variant="outlined" 
            sx={{ maxWidth: '100%' }} 
          />
          {restaurant.types && restaurant.types.length > 0 && (
            <Chip 
              label={restaurant.types[0].replace('_', ' ')} 
              size="small" 
              sx={{ textTransform: 'capitalize' }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RestaurantCard;
